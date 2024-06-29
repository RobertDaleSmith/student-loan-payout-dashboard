import React, { useState } from 'react';
import axios from 'axios';
import { Box, Button, Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    const formData = new FormData();
    formData.append('file', file);

    axios.post('http://localhost:5001/upload', formData)
      .then((response) => {
        setPayments(response.data);
        // Generate summary
        const summary = generateSummary(response.data);
        setSummary(summary);
      })
      .catch((error) => {
        console.error('Error uploading file', error);
      });
  };

  const handleApprove = () => {
    axios.post('http://localhost:5001/create-payments', { payments })
      .then((response) => {
        console.log('Payments created successfully', response.data);
      })
      .catch((error) => {
        console.error('Error creating payments', error);
      });
  };

  const generateSummary = (payments) => {
    // Generate a succinct summary of the payments
    return payments.map(payment => ({
      employee: `${payment.employee.FirstName[0]} ${payment.employee.LastName[0]}`,
      amount: payment.amount
    }));
  };

  const handleReport = (type) => {
    axios.post('http://localhost:5001/generate-report', { payments, type })
      .then((response) => {
        const csv = convertToCSV(response.data);
        downloadCSV(csv, `${type}-report.csv`);
      })
      .catch((error) => {
        console.error('Error generating report', error);
      });
  };

  const convertToCSV = (data) => {
    const array = [Object.keys(data[0])].concat(data);
    return array.map(row => {
      return Object.values(row).toString();
    }).join('\n');
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Container>
      <Box my={4}>
        <input type="file" onChange={handleFileChange} />
        <Button variant="contained" color="primary" onClick={handleUpload} style={{ marginLeft: '10px' }}>
          Upload
        </Button>
      </Box>
      {summary && (
        <Box my={4}>
          <Typography variant="h6">Payments Summary</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summary.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.employee}</TableCell>
                    <TableCell>{item.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Button variant="contained" color="secondary" onClick={handleApprove} style={{ marginTop: '10px' }}>
            Approve Payments
          </Button>
        </Box>
      )}
      <Box my={4}>
        <Typography variant="h6">Generate Reports</Typography>
        <Button variant="contained" color="primary" onClick={() => handleReport('source-account')}>
          Source Account Report
        </Button>
        <Button variant="contained" color="primary" onClick={() => handleReport('branch')} style={{ marginLeft: '10px' }}>
          Branch Report
        </Button>
        <Button variant="contained" color="primary" onClick={() => handleReport('status')} style={{ marginLeft: '10px' }}>
          Status Report
        </Button>
      </Box>
    </Container>
  );

};

export default Upload;
