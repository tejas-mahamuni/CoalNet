const express = require('express');
const router = express.Router();
const axios = require('axios');
const Mine = require('../models/Mine');
const Forecast = require('../models/Forecast');
const { getMineEmissionModel } = require('../models/Emission');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
const FORECAST_TTL_HOURS = 24;

// POST /api/forecast/compare — Multi-mine forecast comparison (auto-generates missing forecasts)
router.post('/', async (req, res) => {
  try {
    const { mineIds = [], horizon = 7 } = req.body;
    const parsedHorizon = parseInt(horizon) || 7;

    if (!Array.isArray(mineIds) || mineIds.length < 2 || mineIds.length > 5) {
      return res.status(400).json({ error: 'Select 2 to 5 mines for comparison.' });
    }

    const results = [];

    for (const mineId of mineIds) {
      const mine = await Mine.findById(mineId);
      if (!mine) continue;

      // Check for cached forecast
      let cached = await Forecast.findOne({
        mine_id: mineId,
        horizon_days: parsedHorizon,
        expires_at: { $gt: new Date() },
      }).sort({ generated_at: -1 });

      // If no cached forecast, auto-generate one via ML service
      if (!cached) {
        try {
          console.log(`🔄 Auto-generating ${parsedHorizon}d forecast for ${mine.name}...`);

          const MineEmission = getMineEmissionModel(mine.name);
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - 120);

          const emissions = await MineEmission.find({
            date: { $gte: cutoffDate }
          }).sort({ date: 1 }).lean();

          if (emissions.length >= 30) {
            const serializedEmissions = emissions.map(e => ({
              date: e.date instanceof Date ? e.date.toISOString() : e.date,
              total_carbon_emission: e.total_carbon_emission || 0,
              fuel_emission: e.fuel_emission || 0,
              electricity_emission: e.electricity_emission || 0,
              explosives_emission: e.explosives_emission || 0,
              transport_emission: e.transport_emission || 0,
              methane_emissions_co2e: e.methane_emissions_co2e || 0,
            }));

            const mlResponse = await axios.post(`${ML_SERVICE_URL}/api/forecast`, {
              emissions: serializedEmissions,
              horizon: parsedHorizon,
            }, { timeout: 120000 });

            if (mlResponse.data.success) {
              const { forecast_data, model_accuracy, model_params, data_points_used } = mlResponse.data;

              // Cache the result
              const expiresAt = new Date();
              expiresAt.setHours(expiresAt.getHours() + FORECAST_TTL_HOURS);

              const forecastDoc = new Forecast({
                mine_id: mineId,
                mine_name: mine.name,
                horizon_days: parsedHorizon,
                forecast_data,
                model_params,
                model_accuracy,
                data_points_used,
                expires_at: expiresAt,
              });

              await forecastDoc.save();
              cached = forecastDoc;
              console.log(`✅ Auto-generated forecast for ${mine.name}`);
            }
          } else {
            console.warn(`⚠️ Insufficient data for ${mine.name} (${emissions.length} records)`);
          }
        } catch (mlErr) {
          console.warn(`⚠️ Could not auto-generate forecast for ${mine.name}:`, mlErr.message);
        }
      }

      results.push({
        mineId,
        mineName: mine.name,
        hasForecast: !!cached,
        forecast_data: cached ? cached.forecast_data : [],
        model_accuracy: cached ? cached.model_accuracy : null,
        totalPredicted: cached
          ? cached.forecast_data.reduce((sum, f) => sum + f.predicted, 0)
          : 0,
      });
    }

    // Sort by total predicted emissions (highest first)
    results.sort((a, b) => b.totalPredicted - a.totalPredicted);

    res.json({
      comparison: results,
      highestEmitter: results.length > 0 ? results[0].mineName : null,
    });

  } catch (err) {
    console.error('Error comparing forecasts:', err.message);
    res.status(500).json({ error: 'Failed to compare mine forecasts.' });
  }
});

module.exports = router;
