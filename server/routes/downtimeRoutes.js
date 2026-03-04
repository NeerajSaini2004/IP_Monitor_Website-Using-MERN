const express = require('express');
const router = express.Router();
const DowntimeLog = require('../models/DowntimeLog');

// Get downtime logs
router.get('/', async (req, res) => {
  try {
    const { period = 'daily', dept } = req.query;
    let days = 1;
    if (period === 'weekly') days = 7;
    if (period === 'monthly') days = 30;

    const since = new Date();
    since.setDate(since.getDate() - days);

    const query = { startTime: { $gte: since } };
    if (dept) query.dept = dept;

    const logs = await DowntimeLog.find(query).sort({ startTime: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Log downtime start
router.post('/start', async (req, res) => {
  try {
    const { dept, ip } = req.body;
    const downtime = new DowntimeLog({
      dept,
      ip,
      startTime: new Date()
    });
    await downtime.save();
    res.status(201).json(downtime);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Log downtime end
router.put('/end/:id', async (req, res) => {
  try {
    const endTime = new Date();
    const downtime = await DowntimeLog.findById(req.params.id);
    if (!downtime) return res.status(404).json({ error: 'Downtime log not found' });

    const duration = Math.round((endTime - downtime.startTime) / (1000 * 60)); // minutes
    downtime.endTime = endTime;
    downtime.duration = duration;
    await downtime.save();

    res.json(downtime);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;