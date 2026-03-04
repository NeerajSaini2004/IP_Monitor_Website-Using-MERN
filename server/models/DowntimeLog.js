const mongoose = require('mongoose');

const downtimeLogSchema = new mongoose.Schema({
  dept: { type: String, required: true },
  ip: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number }, // in minutes
  reason: { type: String, default: 'Network timeout' },
  leasedBandwidth: { type: Number, default: 0 }, // in Mbps
  bandwidthLoss: { type: Number, default: 0 } // calculated bandwidth loss
});

module.exports = mongoose.model('DowntimeLog', downtimeLogSchema);