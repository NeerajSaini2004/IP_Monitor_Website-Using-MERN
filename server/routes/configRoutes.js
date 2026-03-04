const express = require('express');
const router = express.Router();
const Config = require('../models/Config');

// Get all config settings
router.get('/', async (req, res) => {
  try {
    const configs = await Config.find();
    const configObj = {};
    configs.forEach(config => {
      configObj[config.key] = config.value;
    });
    res.json(configObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update config setting
router.post('/', async (req, res) => {
  try {
    const { key, value } = req.body;
    await Config.findOneAndUpdate(
      { key },
      { key, value, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ message: 'Config updated' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Initialize default configs
router.post('/init', async (req, res) => {
  try {
    const defaults = [
      { key: 'downloadThreshold', value: '10' }, // Mbps
      { key: 'uploadThreshold', value: '5' }, // Mbps
      { key: 'alertEmail', value: 'admin@company.com' },
      { key: 'checkInterval', value: '30' } // seconds
    ];

    for (const config of defaults) {
      await Config.findOneAndUpdate(
        { key: config.key },
        config,
        { upsert: true }
      );
    }
    res.json({ message: 'Default configs initialized' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;