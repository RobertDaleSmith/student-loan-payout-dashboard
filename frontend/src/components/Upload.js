import React, { useState } from 'react';
import axios from 'axios';
import { Snackbar, Alert } from '@mui/material';

const Upload = ({ onUpload }) => {
  const [batch, setBatch] = useState(null);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);

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
      setOpen(true); // Open the Snackbar
    } catch (err) {
      setError(err.message);
      setBatch(null);
    }
  };

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleUpload}
        style={{ display: 'none' }}
        id="upload-button"
      />
      <label htmlFor="upload-button" style={{ cursor: 'pointer', color: 'white', backgroundColor: 'green', padding: '10px', borderRadius: '5px', textAlign: 'center' }}>
        Upload XML
      </label>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }} // Positioning the Snackbar
      >
        <Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>
          Batch Uploaded Successfully
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Upload;
