const express = require('express');
const router = express.Router();
const axios = require('axios');
const Mine = require('../models/Mine');
const Forecast = require('../models/Forecast');
const { getMineEmissionModel } = require('../models/Emission');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
const FORECAST_TTL_HOURS = 24;

// POST /api/forecast/:mineId - Generate forecast (calls Python ML service)
router.post('/:mineId', async (req, res) => {
  try {
    const { mineId } = req.params;
    const horizon = parseInt(req.body.horizon) || 7;

    // Validate horizon
    if (![7, 14, 30].includes(horizon)) {
      return res.status(400).json({ error: 'Horizon must be 7, 14, or 30 days.' });
    }

    const mine = await Mine.findById(mineId);
    if (!mine) {
      return res.status(404).json({ error: 'Mine not found' });
    }

    // Clear any stale/expired cache entries for this mine+horizon
    await Forecast.deleteMany({
      mine_id: mineId,
      horizon_days: horizon,
      expires_at: { $lte: new Date() },
    });

    // Check cache first
    const cached = await Forecast.findOne({
      mine_id: mineId,
      horizon_days: horizon,
      expires_at: { $gt: new Date() },
    }).sort({ generated_at: -1 });

    if (cached) {
      console.log(`📦 Returning cached forecast for ${mine.name} (${horizon}d)`);
      return res.json({
        source: 'cache',
        forecast_data: cached.forecast_data,
        model_accuracy: cached.model_accuracy,
        model_params: cached.model_params,
        data_points_used: cached.data_points_used,
        generated_at: cached.generated_at,
        expires_at: cached.expires_at,
      });
    }

    // Fetch emission data for this mine (last 120 days for good ARIMA fit)
    const MineEmission = getMineEmissionModel(mine.name);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 120);

    const emissions = await MineEmission.find({
      date: { $gte: cutoffDate }
    }).sort({ date: 1 }).lean();

    if (emissions.length < 30) {
      return res.status(400).json({
        error: `Insufficient data for forecasting. Need at least 30 data points, got ${emissions.length}. Please add more emission data.`,
      });
    }

    // Convert MongoDB ObjectIds and dates to serializable format
    const serializedEmissions = emissions.map(e => ({
      date: e.date instanceof Date ? e.date.toISOString() : e.date,
      total_carbon_emission: e.total_carbon_emission || 0,
      fuel_emission: e.fuel_emission || 0,
      electricity_emission: e.electricity_emission || 0,
      explosives_emission: e.explosives_emission || 0,
      transport_emission: e.transport_emission || 0,
      methane_emissions_co2e: e.methane_emissions_co2e || 0,
      scope1: e.scope1 || 0,
      scope2: e.scope2 || 0,
      scope3: e.scope3 || 0,
    }));

    console.log(`🧠 Calling ML service for ${mine.name}: ${serializedEmissions.length} records, horizon=${horizon}`);

    // Call Python ML service
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/api/forecast`, {
      emissions: serializedEmissions,
      horizon,
    }, {
      timeout: 120000, // 120 second timeout for ML processing (ARIMA fitting can be slow)
      headers: { 'Content-Type': 'application/json' },
    });

    if (!mlResponse.data.success) {
      return res.status(500).json({ error: mlResponse.data.error || 'ML service returned an error.' });
    }

    const { forecast_data, model_accuracy, model_params, data_points_used } = mlResponse.data;

    // Cache the result
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + FORECAST_TTL_HOURS);

    const forecastDoc = new Forecast({
      mine_id: mineId,
      mine_name: mine.name,
      horizon_days: horizon,
      forecast_data,
      model_params,
      model_accuracy,
      data_points_used,
      expires_at: expiresAt,
    });

    await forecastDoc.save();
    console.log(`💾 Forecast cached for ${mine.name} (expires: ${expiresAt.toISOString()})`);

    res.json({
      source: 'generated',
      forecast_data,
      model_accuracy,
      model_params,
      data_points_used,
      generated_at: forecastDoc.generated_at,
      expires_at: forecastDoc.expires_at,
    });

  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.error('❌ ML service is not running:', err.message);
      return res.status(503).json({ error: 'ML service is unavailable. Please ensure it is running on port 5001.' });
    }
    console.error('Error generating forecast:', err.message);
    res.status(500).json({ error: 'Failed to generate forecast: ' + err.message });
  }
});

// GET /api/forecast/:mineId - Get cached forecast
router.get('/:mineId', async (req, res) => {
  try {
    const { mineId } = req.params;
    const { horizon = 7 } = req.query;

    const mine = await Mine.findById(mineId);
    if (!mine) {
      return res.status(404).json({ error: 'Mine not found' });
    }

    const cached = await Forecast.findOne({
      mine_id: mineId,
      horizon_days: parseInt(horizon),
      expires_at: { $gt: new Date() },
    }).sort({ generated_at: -1 });

    if (!cached) {
      return res.status(404).json({
        error: 'No cached forecast available. Use POST to generate a new one.',
      });
    }

    res.json({
      source: 'cache',
      forecast_data: cached.forecast_data,
      model_accuracy: cached.model_accuracy,
      model_params: cached.model_params,
      data_points_used: cached.data_points_used,
      generated_at: cached.generated_at,
      expires_at: cached.expires_at,
    });

  } catch (err) {
    console.error('Error fetching forecast:', err.message);
    res.status(500).json({ error: 'Failed to fetch forecast.' });
  }
});

module.exports = router;
