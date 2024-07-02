// models/Batch.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  employee: {
    dunkinId: String,
    firstName: String,
    lastName: String,
    dob: String,
    phone: String,
  },
  payor: {
    dunkinId: String,
    abarouting: String,
    accountnumber: String,
    name: String,
    dba: String,
    ein: String,
    address: {
      line1: String,
      city: String,
      state: String,
      zip: String,
    },
    methodEntityId: String,
    accountId: String,
  },
  payee: {
    plaidId: String,
    loanaccountnumber: String,
    methodEntityId: String,
    accountId: String,
  },
  amount: Number,
  status: { type: String, default: 'pending' },
  error: String,
  methodPaymentId: String,
});

const batchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  payments: [paymentSchema],
  status: { type: String, default: 'uploaded' },
  approved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  paymentsCount: { type: Number, default: 0 },
  paymentsTotal: { type: Number, default: 0 },
});

const Batch = mongoose.model('Batch', batchSchema);
module.exports = Batch;
