const express = require('express');
const router = express.Router();
const Mine = require('../models/Mine');

// GET /api/mines - Get all mines
router.get('/', async (req, res) => {
  try {
    const mines = await Mine.find({ status: 'active' }).select('name location state coordinates').sort({ name: 1 });
    res.json(mines);
  } catch (err) {
    console.error('Error fetching mines:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
