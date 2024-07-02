// models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  employee: {
    dunkinId: String,
    dunkinBranch: String,
    firstName: String,
    lastName: String,
    dob: String,
    phone: String,
  },
  payor: {
    dunkinId: String,
    methodEntityId: String,
    accountId: String,
  },
  payee: {
    plaidId: String,
    methodEntityId: String,
    accountId: String,
  },
  amount: Number,
  status: { type: String, default: 'pending' },
  error: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
