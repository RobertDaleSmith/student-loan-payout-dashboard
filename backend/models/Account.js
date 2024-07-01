// models/Account.js
const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  holderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Entity', required: true },
  type: { type: String, required: true }, // 'ach' or 'liability'
  ach: {
    routing: { type: String, required: false },
    number: { type: String, required: false },
    type: { type: String, required: false }, // 'checking' or 'savings'
  },
  liability: {
    mch_id: { type: String, required: false },
    account_number: { type: String, required: false },
    type: { type: String, required: false }, // 'student_loan' etc.
  },
  methodAccountId: { type: String, unique: true },
});

const Account = mongoose.model('Account', accountSchema);
module.exports = Account;
