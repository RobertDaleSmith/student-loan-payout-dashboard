require('dotenv').config();
const mongoose = require('mongoose');
const { runWorker } = require('./worker');

mongoose.connect('mongodb://localhost:27017/studentLoanPayoutsDB')
  .then(() => {
    console.log('Worker connected to MongoDB');
    runWorker().catch(err => {
      console.error('Error in worker process:', err);
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB in worker', err);
  });

// Set an interval to run the worker process periodically
setInterval(runWorker, 60000); // Run every 60 seconds
