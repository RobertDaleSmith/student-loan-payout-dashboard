import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const BatchDetails = () => {
  const { batchId } = useParams();
  const [batch, setBatch] = useState(null);
  const [error, setError] = useState(null);

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

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  if (!batch) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Batch Details</h2>
      <p>Batch ID: {batch._id}</p>
      <p>Status: {batch.status}</p>
      <p>Approved: {batch.approved ? 'Yes' : 'No'}</p>
      <h3>Payments</h3>
      <ul>
        {batch.payments.map((payment) => (
          <li key={payment._id}>
            Employee: {payment.employee.firstName} {payment.employee.lastName}, Amount: ${payment.amount / 100}, Status: {payment.status}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BatchDetails;
