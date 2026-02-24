const express = require('express');
const router = express.Router();
const Mine = require('../models/Mine');
const mongoose = require('mongoose');

/**
 * GET /api/home-stats
 * Returns aggregate statistics for the home page from real DB data.
 */
router.get('/', async (req, res) => {
  try {
    const mines = await Mine.find({}).lean();
    const activeMines = mines.filter(m => m.status === 'active').length;
    const totalMines = mines.length;

    // Aggregate emissions across all mine collections
    let totalEmissions = 0;
    let recentEmissions = 0;    // last 30 days
    let previousEmissions = 0;  // 30-60 days ago
    let latestRecords = [];

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    for (const mine of mines) {
      const collName = `emission_${mine.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
      const coll = mongoose.connection.collection(collName);

      // Total emissions
      const totalResult = await coll.aggregate([
        { $group: { _id: null, total: { $sum: '$total_carbon_emission' } } }
      ]).toArray();
      if (totalResult.length) totalEmissions += totalResult[0].total;

      // Recent 30 days
      const recentResult = await coll.aggregate([
        { $match: { date: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$total_carbon_emission' } } }
      ]).toArray();
      if (recentResult.length) recentEmissions += recentResult[0].total;

      // Previous 30 days (30-60 days ago)
      const prevResult = await coll.aggregate([
        { $match: { date: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$total_carbon_emission' } } }
      ]).toArray();
      if (prevResult.length) previousEmissions += prevResult[0].total;

      // Latest 3 records for ticker
      const latest = await coll.find({})
        .sort({ date: -1 })
        .limit(3)
        .toArray();
      latest.forEach(r => {
        latestRecords.push({
          mine: mine.name,
          state: mine.state,
          date: r.date,
          emission: r.total_carbon_emission || 0,
        });
      });
    }

    // Calculate reduction percentage
    const reductionPct = previousEmissions > 0
      ? ((previousEmissions - recentEmissions) / previousEmissions * 100)
      : 0;

    // Sort latest records by date desc, take top 15 for ticker
    latestRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
    const tickerData = latestRecords.slice(0, 20);

    res.json({
      totalMines,
      activeMines,
      totalEmissions: Math.round(totalEmissions / 1000), // in tonnes
      recentEmissions: Math.round(recentEmissions / 1000),
      reductionPct: Math.round(Math.abs(reductionPct) * 10) / 10,
      reductionDirection: reductionPct >= 0 ? 'down' : 'up',
      tickerData,
    });
  } catch (err) {
    console.error('Home stats error:', err.message);
    res.status(500).json({ error: 'Failed to get home stats' });
  }
});

module.exports = router;
