// models/Entity.js
const mongoose = require('mongoose');

const entitySchema = new mongoose.Schema({
  dunkinId: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  individual: {
    first_name: String,
    last_name: String,
    dob: String,
    phone: String,
  },
  corporation: {
    name: String,
    dba: String,
    ein: String,
    owners: { type: Array, default: undefined },
  },
  address: {
    line1: String,
    city: String,
    state: String,
    zip: String,
  },
  methodEntityId: { type: String, unique: true },
});

const Entity = mongoose.model('Entity', entitySchema);
module.exports = Entity;
