const mongoose = require('mongoose');

const usageSchema = new mongoose.Schema({
  ip: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  bytesSent: { type: Number, default: 0 },
  bytesRecv: { type: Number, default: 0 },
  uploadSpeed: { type: Number, default: 0 }, // Mbps
  downloadSpeed: { type: Number, default: 0 }, // Mbps
  dept: String
});

const Usage = mongoose.model('Usage', usageSchema); // ✅ Model banana zaruri hai

module.exports = Usage; // ✅ Yeh hi sahi export hai
