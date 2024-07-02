const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
  batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
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

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
