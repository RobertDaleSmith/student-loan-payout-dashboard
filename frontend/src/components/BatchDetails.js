import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  IconButton
} from '@mui/material';
import dayjs from 'dayjs';

const BatchDetails = () => {
  const { batchId } = useParams();
  const [batch, setBatch] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBatchDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/batch/${batchId}`);
        setBatch(response.data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchBatchDetails();
  }, [batchId]);

  const handleApproveBatch = async () => {
    try {
      const response = await axios.post(`http://localhost:5001/approve-batch/${batchId}`);
      setBatch(response.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRejectBatch = async () => {
    try {
      const response = await axios.post(`http://localhost:5001/reject-batch/${batchId}`);
      setBatch(response.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDownloadCsv = async (type) => {
    try {
      const response = await axios.get(`http://localhost:5001/batch/${batchId}/csv/${type}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `batch_${batchId}_${type}.csv`);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusChip = (status) => {
    let color;
    switch (status) {
      case 'uploaded':
        color = 'default';
        break;
      case 'preprocessing':
        color = 'warning';
        break;
      case 'pending':
        color = 'info';
        break;
      case 'processing':
        color = 'primary';
        break;
      case 'complete':
        color = 'success';
        break;
      case 'rejected':
      case 'error':
        color = 'error';
        break;
      default:
        color = 'default';
    }
    return <Chip label={status} color={color} />;
  };

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  if (!batch) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" paddingTop="16px" mb={2}>
        <Typography variant="h4">Batch Details</Typography>
        <Box>
          {!batch.approved && batch.status !== 'rejected' && (
            <>
              <Button
                variant="contained"
                color="primary"
                onClick={handleApproveBatch}
                style={{ marginLeft: 8 }}
              >
                Approve
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleRejectBatch}
                style={{ marginLeft: 8 }}
              >
                Reject
              </Button>
            </>
          )}
        </Box>
      </Box>
      <Box mb={2}>
        <Typography variant="h6">Batch Name: {batch.name}</Typography>
        <Typography variant="body1">Batch ID: {batch._id}</Typography>
        <Typography variant="body1">Status: {getStatusChip(batch.status)}</Typography>
        <br />
        <Typography variant="body1">Approved: {batch.approved ? 'Yes' : 'No'}</Typography>
        <Typography variant="body1">Created At: {dayjs(batch.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Typography>
        <Typography variant="body1">Payments Count: {batch.paymentsCount}</Typography>
        <Typography variant="body1">Payments Total: ${(batch.paymentsTotal / 100).toFixed(2)}</Typography>
      </Box>
      <Box mb={2}>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => handleDownloadCsv('source-account')}
          style={{ marginRight: 8 }}
        >
          Download Source Account CSV
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => handleDownloadCsv('branch')}
          style={{ marginRight: 8 }}
        >
          Download Branch CSV
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => handleDownloadCsv('payments-status')}
        >
          Download Payments Status CSV
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {batch.payments.map((payment) => (
              <TableRow key={payment._id}>
                <TableCell>{payment.employee.firstName} {payment.employee.lastName}</TableCell>
                <TableCell>${(payment.amount / 100).toFixed(2)}</TableCell>
                <TableCell>{payment.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default BatchDetails;
