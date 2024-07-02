import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Box,
  Typography
} from '@mui/material';
import dayjs from 'dayjs';
import Upload from './Upload';

const BatchList = ({ refresh, onUpload }) => {
  const [batches, setBatches] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const response = await axios.get('http://localhost:5001/batches');
        setBatches(response.data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchBatches();
  }, [refresh]); // Add refresh as a dependency

  const handleApproveBatch = async (batchId) => {
    try {
      await axios.post(`http://localhost:5001/approve-batch/${batchId}`);
      setBatches((prevBatches) =>
        prevBatches.map((batch) =>
          batch._id === batchId ? { ...batch, approved: true } : batch
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRejectBatch = async (batchId) => {
    try {
      await axios.post(`http://localhost:5001/reject-batch/${batchId}`);
      setBatches((prevBatches) =>
        prevBatches.map((batch) =>
          batch._id === batchId ? { ...batch, status: 'rejected' } : batch
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDetailsClick = (batchId) => {
    navigate(`/batch/${batchId}`);
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
        color = 'error';
        break;  
      default:
        color = 'default';
    }
    return <Chip label={status} color={color} />;
  };

  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" paddingTop="16px" mb={2}>
        <Typography variant="h4">Batches</Typography>
        <Upload onUpload={onUpload} />
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Approved</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Payments</TableCell>
              <TableCell>Total</TableCell>
              <TableCell style={{textAlign: 'right'}}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {batches.map((batch) => (
              <TableRow key={batch._id}>
                <TableCell>
                  <span
                    onClick={() => handleDetailsClick(batch._id)}
                    style={{cursor: 'pointer'}}
                  >{batch.name}</span>
                </TableCell>
                <TableCell>{getStatusChip(batch.status)}</TableCell>
                <TableCell>{batch.approved ? 'Yes' : 'No'}</TableCell>
                <TableCell>{dayjs(batch.createdAt).format('YYYY-MM-DD HH:mm:ss')}</TableCell>
                <TableCell>{batch.paymentsCount}</TableCell>
                <TableCell>${(batch.paymentsTotal / 100).toFixed(2)}</TableCell>
                <TableCell style={{textAlign: 'right'}}>
                  {!batch.approved && batch.status !== 'rejected' && (
                    <>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleApproveBatch(batch._id)}
                        style={{ marginRight: 8 }}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => handleRejectBatch(batch._id)}
                        style={{ marginRight: 8 }}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => handleDetailsClick(batch._id)}
                  >
                    Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
};

export default BatchList;
