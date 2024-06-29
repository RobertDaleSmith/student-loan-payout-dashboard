const express = require('express');
const multer = require('multer');
const xml2js = require('xml2js');
const cors = require('cors');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());

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

      // Process the parsed XML data here (result)
      res.send(result);
    });
  });
});

app.listen(5001, () => {
  console.log('Server is running on port 5001');
});
