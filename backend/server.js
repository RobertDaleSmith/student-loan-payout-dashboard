const express = require('express');
const multer = require('multer');
const xml2js = require('xml2js');
const cors = require('cors');
const fs = require('fs');
const axios = require('axios');

const app = express();
const upload = multer({ dest: 'uploads/' });
const port = 5001;

app.use(cors());
app.use(express.json());

const processXMLData = (xmlData) => {
  // console.log(JSON.stringify(xmlData, null, 2)); // Pretty print the parsed XML data

  // Assuming xmlData has the structure: { root: { row: [ ... ] } }
  if (xmlData && xmlData.root && xmlData.root.row) {
    const payments = xmlData.root.row.map(row => ({
      employee: row.Employee[0],
      payor: row.Payor[0],
      payee: row.Payee[0],
      amount: row.Amount[0]
    }));
    return payments;
  } else {
    throw new Error('Invalid XML data structure');
  }
};

// Updated XML upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  const xmlFile = req.file.path;
  fs.readFile(xmlFile, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading XML file');
    }
    xml2js.parseString(data, (err, result) => {
      if (err) {
        return res.status(500).send('Error parsing XML file');
      }
      try {
        const payments = processXMLData(result);
        res.send(payments);
      } catch (error) {
        res.status(500).send(error.message);
      }
    });
  });
});

const createPayment = async (payment) => {
  // Replace with your Method API integration
  const response = await axios.post('https://api.methodfi.com/payments', payment, {
    headers: { Authorization: `sk_Mq9yE3xQtmajFfpeWc6Wz4JB` }
  });
  return response.data;
};

// Endpoint to create payments via Method API
app.post('/create-payments', async (req, res) => {
  const payments = req.body.payments;
  const results = [];
  for (const payment of payments) {
    try {
      const result = await createPayment(payment);
      results.push(result);
    } catch (error) {
      results.push({ error: error.message });
    }
  }
  res.send(results);
});

const generateReport = (payments, type) => {
  // Generate the CSV reports based on the type
  let report = '';
  switch (type) {
    case 'source-account':
      // Total amount of funds paid out per unique source account
      report = payments.reduce((acc, payment) => {
        const account = payment.payor.AccountNumber[0];
        acc[account] = (acc[account] || 0) + parseFloat(payment.amount.replace('$', ''));
        return acc;
      }, {});
      break;
    case 'branch':
      // Total amount of funds paid out per Dunkin branch
      report = payments.reduce((acc, payment) => {
        const branch = payment.employee.DunkinBranch[0];
        acc[branch] = (acc[branch] || 0) + parseFloat(payment.amount.replace('$', ''));
        return acc;
      }, {});
      break;
    case 'status':
      // Status of every payment and its relevant metadata
      report = payments.map(payment => ({
        employee: `${payment.employee.FirstName[0]} ${payment.employee.LastName[0]}`,
        status: 'Pending',
        metadata: payment
      }));
      break;
    default:
      report = {};
  }
  return report;
};

app.post('/generate-report', (req, res) => {
  const { payments, type } = req.body;
  const report = generateReport(payments, type);
  res.send(report);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
