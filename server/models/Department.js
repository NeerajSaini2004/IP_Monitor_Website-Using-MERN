const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  dept: { type: String, required: true, unique: true },
  ip: { type: String, required: true, unique: true },
  leasedBandwidth: { type: Number, default: 100 }, // in Mbps
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Department', departmentSchema);