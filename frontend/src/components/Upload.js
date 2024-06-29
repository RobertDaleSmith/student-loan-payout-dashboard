import React, { useState } from 'react';
import axios from 'axios';
import Button from '@mui/material/Button';
import { Box } from '@mui/material';

const Upload = () => {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    const formData = new FormData();
    formData.append('file', file);

    axios.post('http://localhost:5001/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    .then((response) => {
      console.log('File uploaded successfully', response.data);
      // Process the response data as needed
    })
    .catch((error) => {
      console.error('Error uploading file', error);
    });
  };

  return (
    <Box>
      <input type="file" onChange={handleFileChange} />
      <Button variant="contained" color="primary" onClick={handleUpload}>
        Upload
      </Button>
    </Box>
  );
};

export default Upload;
