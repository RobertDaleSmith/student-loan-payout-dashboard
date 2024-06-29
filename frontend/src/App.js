import React from 'react';
import { AppBar, Toolbar, Typography, Container } from '@mui/material';
import Upload from './components/Upload';

const App = () => {
  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" style={{ flexGrow: 1 }}>
            Student Loan Payout Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      <Container>
        <Upload />
      </Container>
    </div>
  );
};

export default App;
