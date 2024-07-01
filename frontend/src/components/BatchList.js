import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Upload from './Upload';

const BatchList = () => {
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
  }, []);

  const handleApproveBatch = async (batchId) => {
    try {
      const response = await axios.post(`http://localhost:5001/approve-batch/${batchId}`);
      setBatches((prevBatches) =>
        prevBatches.map((batch) =>
          batch._id === batchId ? { ...batch, approved: true } : batch
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpload = (newBatch) => {
    setBatches((prevBatches) => [...prevBatches, newBatch]);
  };

  const handleDetailsClick = (batchId) => {
    navigate(`/batch/${batchId}`);
  };

  return (
    <div>
      <h1>Batch List</h1>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <ul>
        {batches.map((batch) => (
          <li key={batch._id}>
            Batch ID: {batch._id}, Status: {batch.status}, Approved: {batch.approved ? 'Yes' : 'No'}
            {!batch.approved && (
              <button onClick={() => handleApproveBatch(batch._id)}>Approve</button>
            )}
            <button onClick={() => handleDetailsClick(batch._id)}>Details</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BatchList;
