const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const batchSchema = new Schema({
  name: { type: String, required: true },
  status: { type: String, default: 'uploaded' },
  approved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  paymentsCount: { type: Number, default: 0 },
  paymentsTotal: { type: Number, default: 0 },
});

const Batch = mongoose.model('Batch', batchSchema);

module.exports = Batch;
