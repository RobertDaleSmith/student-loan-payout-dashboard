import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container } from '@mui/material';
import Upload from './components/Upload';
import BatchList from './components/BatchList';
import BatchDetails from './components/BatchDetails';

const App = () => {
  return (
    <Router>
      <div>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" style={{ flexGrow: 1 }}>
              <Link to="/">🍩 Student Loan Payout Dashboard</Link>
            </Typography>
            <Upload />
          </Toolbar>
        </AppBar>
        <Container>
          <Routes>
            <Route path="/" element={<BatchList />} />
            <Route path="/batch/:batchId" element={<BatchDetails />} />
          </Routes>
        </Container>
      </div>
    </Router>
  );
};

export default App;
