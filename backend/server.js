require('dotenv').config();
const express = require('express');
const multer = require('multer');
const xml2js = require('xml2js');
const cors = require('cors');
const fs = require('fs');
const dayjs = require('dayjs');
const { createObjectCsvStringifier } = require('csv-writer');
const mongoose = require('mongoose');
const { runWorker } = require('./worker');
const Batch = require('./models/Batch');
const Payment = require('./models/Payment');

const app = express();
const upload = multer({ dest: 'uploads/' });
const port = process.env.PORT || 5001;

mongoose.connect('mongodb://localhost:27017/studentLoanPayoutsDB')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB', err);
  });

app.use(cors());
app.use(express.json({ limit: '60mb' })); // Increase the limit here

const processXMLData = (xmlData, batchId) => {
  if (xmlData && xmlData.root && xmlData.root.row) {
    const payments = xmlData.root.row.map(row => ({
      batchId,
      employee: {
        dunkinId: row.Employee[0].DunkinId[0],
        dunkinBranch: row.Employee[0].DunkinBranch[0],
        firstName: row.Employee[0].FirstName[0],
        lastName: row.Employee[0].LastName[0],
        dob: row.Employee[0].DOB[0],
        phone: row.Employee[0].PhoneNumber[0],
      },
      payor: {
        dunkinId: row.Payor[0].DunkinId[0],
        abarouting: row.Payor[0].ABARouting[0],
        accountnumber: row.Payor[0].AccountNumber[0],
        name: row.Payor[0].Name[0],
        dba: row.Payor[0].DBA[0],
        ein: row.Payor[0].EIN[0],
        address: {
          line1: row.Payor[0].Address[0].Line1[0],
          city: row.Payor[0].Address[0].City[0],
          state: row.Payor[0].Address[0].State[0],
          zip: row.Payor[0].Address[0].Zip[0],
        },
      },
      payee: {
        plaidId: row.Payee[0].PlaidId[0],
        loanaccountnumber: row.Payee[0].LoanAccountNumber[0],
      },
      amount: parseFloat(row.Amount[0].replace('$', '')) * 100, // convert to cents
    }));
    return payments;
  } else {
    throw new Error('Invalid XML data structure');
  }
};

app.post('/upload', upload.single('file'), async (req, res) => {
  const xmlFile = req.file.path;

  const parser = new xml2js.Parser();

  const readStream = fs.createReadStream(xmlFile);
  const chunks = [];

  readStream.on('data', chunk => {
    chunks.push(chunk);
  });

  readStream.on('end', async () => {
    const data = Buffer.concat(chunks).toString();
    parser.parseString(data, async (err, result) => {
      if (err) {
        return res.status(500).send('Error parsing XML file');
      }
      try {
        const batch = new Batch({ name: req.file.originalname });
        await batch.save();

        const payments = processXMLData(result, batch._id);

        await Payment.insertMany(payments);

        batch.paymentsCount = payments.length;
        batch.paymentsTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);
        await batch.save();

        res.send({ batchId: batch._id, status: batch.status });
        runWorker(); // Trigger the worker after upload
      } catch (error) {
        res.status(500).send(error.message);
      }
    });
  });

  readStream.on('error', err => {
    return res.status(500).send('Error reading XML file');
  });
});

app.post('/approve-batch/:batchId', async (req, res) => {
  const { batchId } = req.params;
  try {
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).send('Batch not found');
    }
    batch.approved = true;
    await batch.save();
    res.send(batch);
    runWorker(); // Trigger the worker after approval
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/batches', async (req, res) => {
  try {
    const batches = await Batch.find().sort({ createdAt: -1 }).select('_id name status approved createdAt paymentsCount paymentsTotal');
    res.send(batches);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/batch/:batchId', async (req, res) => {
  const { batchId } = req.params;
  try {
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).send('Batch not found');
    }
    res.send(batch);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post('/reject-batch/:batchId', async (req, res) => {
  const { batchId } = req.params;
  try {
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).send('Batch not found');
    }
    batch.status = 'discarded';
    await batch.save();
    res.send(batch);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/batch/:batchId/payments', async (req, res) => {
  const { batchId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;
  try {
    const payments = await Payment.find({ batchId }).skip(skip).limit(Number(limit));
    res.send(payments);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Endpoint to generate CSV report for total amount paid out per unique source account
app.get('/batch/:batchId/csv/source-account', async (req, res) => {
  const { batchId } = req.params;
  try {
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).send('Batch not found');
    }

    const payments = await Payment.find({ batchId });

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'sourceAccount', title: 'Source Account' },
        { id: 'totalAmount', title: 'Total Amount' }
      ]
    });

    const sourceAccounts = {};
    payments.forEach(payment => {
      const sourceAccount = payment.payor.accountnumber;
      if (!sourceAccounts[sourceAccount]) {
        sourceAccounts[sourceAccount] = 0;
      }
      sourceAccounts[sourceAccount] += payment.amount;
    });

    const records = Object.keys(sourceAccounts).map(account => ({
      sourceAccount: account,
      totalAmount: (sourceAccounts[account] / 100).toFixed(2)
    }));

    const csvData = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="batch_${batchId}_source_account.csv"`);
    res.send(csvData);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Endpoint to generate CSV for total amount of funds paid out per Dunkin branch
app.get('/batch/:batchId/csv/branch', async (req, res) => {
  const { batchId } = req.params;
  try {
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).send('Batch not found');
    }

    const payments = await Payment.find({ batchId });

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'dunkinBranch', title: 'Dunkin Branch' },
        { id: 'totalAmount', title: 'Total Amount' }
      ]
    });

    const branches = {};
    payments.forEach(payment => {
      const branch = payment.employee.dunkinBranch;
      if (!branches[branch]) {
        branches[branch] = 0;
      }
      branches[branch] += payment.amount;
    });

    const records = Object.keys(branches).map(branch => ({
      dunkinBranch: branch,
      totalAmount: (branches[branch] / 100).toFixed(2)
    }));

    const csvData = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="batch_${batchId}_branch.csv"`);
    res.send(csvData);
  } catch (error) {
    res.status(500).send(error.message);
  }
});


// Endpoint to generate CSV for the status of every payment and its relevant metadata
app.get('/batch/:batchId/csv/payments-status', async (req, res) => {
  const { batchId } = req.params;
  try {
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).send('Batch not found');
    }

    const payments = await Payment.find({ batchId });

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'employeePhone', title: 'Employee Phone' },
        { id: 'employeeDunkinId', title: 'Employee DunkinId' },
        { id: 'employeeFirstName', title: 'Employee FirstName' },
        { id: 'employeeLastName', title: 'Employee LastName' },
        { id: 'employeeDOB', title: 'Employee DOB' },
        { id: 'payeeAccountId', title: 'Payee AccountId' },
        { id: 'payeePlaidId', title: 'Payee PlaidId' },
        { id: 'payeeMethodEntityId', title: 'Payee MethodEntityId' },
        { id: 'payeeLoanAccountNumber', title: 'Payee LoanAccountNumber' },
        { id: 'payorEIN', title: 'Payor EIN' },
        { id: 'payorAccountId', title: 'Payor AccountId' },
        { id: 'payorABARouting', title: 'Payor ABARouting' },
        { id: 'payorDBA', title: 'Payor DBA' },
        { id: 'payorMethodEntityId', title: 'Payor MethodEntityId' },
        { id: 'payorDunkinId', title: 'Payor DunkinId' },
        { id: 'payorName', title: 'Payor Name' },
        { id: 'payorAddressLine1', title: 'Payor Address Line1' },
        { id: 'payorAddressCity', title: 'Payor Address City' },
        { id: 'payorAddressState', title: 'Payor Address State' },
        { id: 'payorAddressZip', title: 'Payor Address Zip' },
        { id: 'amount', title: 'Amount' },
        { id: 'status', title: 'Status' },
        { id: 'error', title: 'Error' },
        { id: 'createdAt', title: 'Created At' },
        { id: 'updatedAt', title: 'Updated At' }
      ]
    });

    const records = payments.map(payment => ({
      employeePhone: payment.employee.phone,
      employeeDunkinId: payment.employee.dunkinId,
      employeeFirstName: payment.employee.firstName,
      employeeLastName: payment.employee.lastName,
      employeeDOB: payment.employee.dob,
      payeeAccountId: payment.payee.accountId,
      payeePlaidId: payment.payee.plaidId,
      payeeMethodEntityId: payment.payee.methodEntityId,
      payeeLoanAccountNumber: payment.payee.loanaccountnumber,
      payorEIN: payment.payor.ein,
      payorAccountId: payment.payor.accountId,
      payorABARouting: payment.payor.abarouting,
      payorDBA: payment.payor.dba,
      payorMethodEntityId: payment.payor.methodEntityId,
      payorDunkinId: payment.payor.dunkinId,
      payorName: payment.payor.name,
      payorAddressLine1: payment.payor.address.line1,
      payorAddressCity: payment.payor.address.city,
      payorAddressState: payment.payor.address.state,
      payorAddressZip: payment.payor.address.zip,
      amount: (payment.amount / 100).toFixed(2),
      status: payment.status,
      error: payment.error || '',
      createdAt: dayjs(payment.createdAt).format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: dayjs(payment.updatedAt).format('YYYY-MM-DD HH:mm:ss')
    }));

    const csvData = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="batch_${batchId}_payments_status.csv"`);
    res.send(csvData);
  } catch (error) {
    res.status(500).send(error.message);
  }
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Periodically run the worker process
setInterval(runWorker, 60000); // Run every 60 seconds
runWorker();
