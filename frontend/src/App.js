import React from 'react';
import Upload from './components/Upload';
import { AppBar, Toolbar, Typography, Container } from '@mui/material';

const App = () => {
  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" style={{ flexGrow: 1 }}>
            Student Loan Payout Dashboard
          </Typography>
          <Upload />
        </Toolbar>
      </AppBar>
      <Container>
        {/* Additional dashboard components can be added here */}
      </Container>
    </div>
  );
};

export default App;
