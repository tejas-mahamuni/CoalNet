const express = require('express');
const router = express.Router();
const Mine = require('../models/Mine');
const Forecast = require('../models/Forecast');
const { getMineEmissionModel } = require('../models/Emission');

// GET /api/forecast/report/:mineId — Generate forecast intelligence report (JSON summary for client-side PDF)
router.get('/:mineId', async (req, res) => {
  try {
    const { mineId } = req.params;
    const { horizon = 7 } = req.query;

    const mine = await Mine.findById(mineId);
    if (!mine) return res.status(404).json({ error: 'Mine not found' });

    // Fetch forecast
    const cached = await Forecast.findOne({
      mine_id: mineId,
      horizon_days: parseInt(horizon),
      expires_at: { $gt: new Date() },
    }).sort({ generated_at: -1 });

    if (!cached) {
      return res.status(404).json({ error: 'No forecast available. Generate a forecast first.' });
    }

    // Fetch recent emissions
    const MineEmission = getMineEmissionModel(mine.name);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const emissions = await MineEmission.find({
      date: { $gte: cutoffDate }
    }).sort({ date: 1 }).lean();

    // Summary stats
    const totalEmissions = emissions.reduce((s, e) => s + (e.total_carbon_emission || 0), 0);
    const avgEmission = emissions.length > 0 ? totalEmissions / emissions.length : 0;
    const forecastAvg = cached.forecast_data.reduce((s, f) => s + f.predicted, 0) / cached.forecast_data.length;

    res.json({
      report: {
        mineName: mine.name,
        mineLocation: mine.location,
        generatedAt: new Date().toISOString(),
        horizon: parseInt(horizon),
        historicalSummary: {
          dataPoints: emissions.length,
          totalEmissions: Math.round(totalEmissions),
          averageDailyEmission: Math.round(avgEmission),
        },
        forecast: {
          data: cached.forecast_data,
          modelAccuracy: cached.model_accuracy,
          modelParams: cached.model_params,
          dataPointsUsed: cached.data_points_used,
          averagePredicted: Math.round(forecastAvg),
        },
        confidenceBand: cached.forecast_data.map(f => ({
          date: f.date,
          range: Math.round(f.upper_bound - f.lower_bound),
        })),
      }
    });

  } catch (err) {
    console.error('Error generating report:', err.message);
    res.status(500).json({ error: 'Failed to generate report.' });
  }
});

module.exports = router;
