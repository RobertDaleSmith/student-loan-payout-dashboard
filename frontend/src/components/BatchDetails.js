import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
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
  Alert,
  Snackbar,
} from '@mui/material';
import dayjs from 'dayjs';

const BatchDetails = () => {
  const { batchId } = useParams();
  const location = useLocation();
  const [batch, setBatch] = useState(null);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState(null);
  const [showSnackbar, setShowSnackbar] = useState(location.state?.showSnackbar || false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

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

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/batch/${batchId}/payments`, {
          params: { page, limit: 20 },
        });
        if (response.data.length > 0) {
          // Filter out duplicates by payment ID

          setPayments((prev) => {
            const newPayments = response.data.filter(
              (newPayment) => !prev.some(
                (existingPayment) => existingPayment._id === newPayment._id,
              ),
            );
            return [...prev, ...newPayments];
          });
          setHasMore(response.data.length === 20);
        } else {
          setHasMore(false);
        }
      } catch (err) {
        setError(err.message);
      }
    };
    fetchPayments();
  }, [batchId, page]);

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
      case 'failed':
      case 'discarded':
        color = 'error';
        break;
      default:
        color = 'default';
    }
    return <Chip label={status} color={color} />;
  };

  const handleCloseSnackbar = () => {
    setShowSnackbar(false);
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
        <Box display="flex" alignItems="center">
          <Typography variant="h4">Batch Details</Typography>
        </Box>
        <Box>
          {!batch.approved && batch.status !== 'discarded' && (
            <>
              <Button
                variant="contained"
                color="primary"
                onClick={handleApproveBatch}
                style={{ marginRight: 8 }}
              >
                Authorize
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleRejectBatch}
                style={{ marginRight: 8 }}
              >
                Discard
              </Button>
            </>
          )}
        </Box>
      </Box>
      <Box mb={2}>
        <Typography variant="h6">Batch Name: {batch.name}</Typography>
        <Typography variant="body1">Batch ID: {batch._id}</Typography>
        <Box display="flex" alignItems="center">
          <Typography variant="body1">Status:&nbsp;</Typography>
          {getStatusChip(batch.status)}
        </Box>
        <br />
        <Typography variant="body1">Approved: {batch.approved ? 'Yes' : 'No'}</Typography>
        <Typography variant="body1">Created At: {dayjs(batch.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Typography>
        <Typography variant="body1">Payments Count: {batch.paymentsCount}</Typography>
        <Typography variant="body1">Total Sum: ${(batch.paymentsTotal / 100).toFixed(2)}</Typography>
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
      {payments.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment._id}>
                  <TableCell>{`${payment.employee.firstName} ${payment.employee.lastName}`}</TableCell>
                  <TableCell>${(payment.amount / 100).toFixed(2)}</TableCell>
                  <TableCell>
                    {getStatusChip(payment.status)}
                  </TableCell>
                  <TableCell>{dayjs(payment.createdAt).format('YYYY-MM-DD HH:mm:ss')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {hasMore && (
        <div style={{ float: 'right', padding: '16px 0' }}>
          <Button variant="contained" onClick={() => setPage((prev) => prev + 1)}>
            Load More
          </Button>
        </div>
      )}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }} // Positioning the Snackbar
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Batch Uploaded Successfully
        </Alert>
      </Snackbar>
    </div>
  );
};

export default BatchDetails;
