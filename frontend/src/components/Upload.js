import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Snackbar, Alert } from '@mui/material';

const Upload = ({ onUpload }) => {
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

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
      setError(null);
      onUpload(response.data); // Notify parent component of new batch
      event.target.value = ''; // Clear the file input
      navigate(`/batch/${response.data.batchId}`, { state: { showSnackbar: true } }); // Navigate to the new batch's detail view with state
    } catch (err) {
      setError(err.message);
      setOpen(true); // Show the snackbar on error
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
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleClose} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Upload;
