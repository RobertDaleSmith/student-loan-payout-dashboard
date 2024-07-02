require('dotenv').config();
const express = require('express');
const multer = require('multer');
const xml2js = require('xml2js');
const cors = require('cors');
const fs = require('fs');
const dayjs = require('dayjs');
const { createObjectCsvWriter } = require('csv-writer');
const mongoose = require('mongoose');
const { runWorker } = require('./worker');
const Batch = require('./models/Batch');

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
app.use(express.json());

const processXMLData = (xmlData) => {
  if (xmlData && xmlData.root && xmlData.root.row) {
    const payments = xmlData.root.row.map(row => ({
      employee: {
        dunkinId: row.Employee[0].DunkinId[0],
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
  const batchName = req.file.originalname;

  fs.readFile(xmlFile, 'utf8', async (err, data) => {
    if (err) {
      return res.status(500).send('Error reading XML file');
    }
    xml2js.parseString(data, async (err, result) => {
      if (err) {
        return res.status(500).send('Error parsing XML file');
      }
      try {
        const payments = processXMLData(result);
        const batch = new Batch({ name: batchName, payments, status: 'uploaded' });
        await batch.save();
        res.send({ batchId: batch._id, status: batch.status });
        runWorker(); // Trigger the worker after upload
      } catch (error) {
        res.status(500).send(error.message);
      }
    });
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
    batch.status = 'rejected';
    await batch.save();
    res.send(batch);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Endpoint to generate CSV for total amount of funds paid out per unique source account
app.get('/batch/:batchId/csv/source-account', async (req, res) => {
  const { batchId } = req.params;
  try {
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).send('Batch not found');
    }

    const csvWriter = createObjectCsvWriter({
      path: `batch_${batchId}_source_account.csv`,
      header: [
        { id: 'sourceAccount', title: 'Source Account' },
        { id: 'totalAmount', title: 'Total Amount' }
      ]
    });

    const sourceAccounts = {};
    batch.payments.forEach(payment => {
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

    await csvWriter.writeRecords(records);

    res.download(`batch_${batchId}_source_account.csv`);
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

    const csvWriter = createObjectCsvWriter({
      path: `batch_${batchId}_branch.csv`,
      header: [
        { id: 'branch', title: 'Dunkin Branch' },
        { id: 'totalAmount', title: 'Total Amount' }
      ]
    });

    const branches = {};
    batch.payments.forEach(payment => {
      const branch = payment.employee.dunkinBranch;
      if (!branches[branch]) {
        branches[branch] = 0;
      }
      branches[branch] += payment.amount;
    });

    const records = Object.keys(branches).map(branch => ({
      branch,
      totalAmount: (branches[branch] / 100).toFixed(2)
    }));

    await csvWriter.writeRecords(records);

    res.download(`batch_${batchId}_branch.csv`);
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

    const csvWriter = createObjectCsvWriter({
      path: `batch_${batchId}_payments_status.csv`,
      header: [
        { id: 'employee', title: 'Employee' },
        { id: 'amount', title: 'Amount' },
        { id: 'status', title: 'Status' },
        { id: 'createdAt', title: 'Created At' },
        { id: 'updatedAt', title: 'Updated At' }
      ]
    });

    const records = batch.payments.map(payment => ({
      employee: `${payment.employee.firstName} ${payment.employee.lastName}`,
      amount: (payment.amount / 100).toFixed(2),
      status: payment.status,
      createdAt: dayjs(payment.createdAt).format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: dayjs(payment.updatedAt).format('YYYY-MM-DD HH:mm:ss')
    }));

    await csvWriter.writeRecords(records);

    res.download(`batch_${batchId}_payments_status.csv`);
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
