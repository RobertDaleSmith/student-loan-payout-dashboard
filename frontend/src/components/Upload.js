import React, { useState } from 'react';
import axios from 'axios';

const Upload = ({ onUpload }) => {
  const [batch, setBatch] = useState(null);
  const [error, setError] = useState(null);

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5001/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setBatch(response.data);
      setError(null);
      onUpload(response.data); // Notify parent component of new batch
      event.target.value = ''; // Clear the file input
    } catch (err) {
      setError(err.message);
      setBatch(null);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleUpload}
        style={{ display: 'none' }}
        id="upload-button"
      />
      <label htmlFor="upload-button" style={{ cursor: 'pointer' }}>
        <button>Upload XML</button>
      </label>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {batch && (
        <div>
          <h2>Batch Uploaded</h2>
          <p>Batch ID: {batch._id}</p>
          <p>Status: {batch.status}</p>
        </div>
      )}
    </div>
  );
};

export default Upload;
