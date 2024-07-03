import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MenuIcon from '@mui/icons-material/Menu';
import BatchList from './components/BatchList';
import BatchDetails from './components/BatchDetails';

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [refresh, setRefresh] = useState(false);

  const handleUpload = (newBatch) => {
    setRefresh((prev) => !prev); // Toggle the refresh state to trigger BatchList update
    navigate(`/batch/${newBatch.batchId}`); // Navigate to the new batch's detail view
  };

  const handleBackClick = () => {
    navigate('/');
  };

  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          {location.pathname.startsWith('/batch/') && (
            <IconButton edge="start" color="inherit" onClick={handleBackClick}>
              <ArrowBackIcon />
            </IconButton>
          )}
          {!location.pathname.startsWith('/batch/') && (
            <IconButton edge="start" color="inherit" disabled>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" style={{ flexGrow: 1 }}>
            &nbsp;&nbsp;🍩 Student Loan Payout Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      <Container>
        <Routes>
          <Route path="/" element={<BatchList refresh={refresh} onUpload={handleUpload} />} />
          <Route path="/batch/:batchId" element={<BatchDetails />} />
        </Routes>
      </Container>
    </div>
  );
};

const WrappedApp = () => (
  <Router>
    <App />
  </Router>
);

export default WrappedApp;
