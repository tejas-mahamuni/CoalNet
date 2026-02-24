const express = require('express');
const router = express.Router();
const axios = require('axios');
const Mine = require('../models/Mine');
const Forecast = require('../models/Forecast');
const { getMineEmissionModel } = require('../models/Emission');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// GET /api/forecast/insights/:mineId — Full forecast intelligence insights
router.get('/:mineId', async (req, res) => {
  try {
    const { mineId } = req.params;
    const { horizon = 7 } = req.query;

    const mine = await Mine.findById(mineId);
    if (!mine) return res.status(404).json({ error: 'Mine not found' });

    // Fetch emission data
    const MineEmission = getMineEmissionModel(mine.name);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 120);

    const emissions = await MineEmission.find({
      date: { $gte: cutoffDate }
    }).sort({ date: 1 }).lean();

    if (emissions.length < 7) {
      return res.status(400).json({ error: 'Insufficient data for insights analysis.' });
    }

    // Get cached forecast for this mine
    const cached = await Forecast.findOne({
      mine_id: mineId,
      horizon_days: parseInt(horizon),
      expires_at: { $gt: new Date() },
    }).sort({ generated_at: -1 });

    const serializedEmissions = emissions.map(e => ({
      date: e.date instanceof Date ? e.date.toISOString() : e.date,
      total_carbon_emission: e.total_carbon_emission || 0,
      fuel_emission: e.fuel_emission || 0,
      electricity_emission: e.electricity_emission || 0,
      explosives_emission: e.explosives_emission || 0,
      transport_emission: e.transport_emission || 0,
      methane_emissions_co2e: e.methane_emissions_co2e || 0,
    }));

    // Call ML insights endpoint
    let mlInsights = null;
    try {
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/api/forecast/insights`, {
        emissions: serializedEmissions,
        forecast_data: cached ? cached.forecast_data : [],
      }, { timeout: 30000 });

      if (mlResponse.data.success) {
        mlInsights = mlResponse.data;
      }
    } catch (mlErr) {
      console.warn('ML insights unavailable, computing basic insights:', mlErr.message);
    }

    // Compute Carbon Budget (dynamic per-mine, based on actual emissions)
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const yearEmissions = await MineEmission.find({
      date: { $gte: startOfYear, $lte: now }
    }).lean();

    const ytdEmissions = yearEmissions.reduce((sum, e) => sum + (e.total_carbon_emission || 0), 0);
    const daysSoFar = Math.max(Math.ceil((now - startOfYear) / (1000 * 60 * 60 * 24)), 1);
    const dailyRate = ytdEmissions / daysSoFar;
    const annualRate = dailyRate * 365;

    // Determine target year based on emission trend direction
    const trend = mlInsights?.trend || { direction: 'stable', slope: 0 };
    let targetYear;
    if (trend.direction === 'rising') {
      targetYear = 2035; // Tighter budget for rising emitters → breach sooner
    } else if (trend.direction === 'falling') {
      targetYear = 2065; // Generous budget for declining emitters
    } else {
      targetYear = 2050; // Middle ground for stable mines
    }

    const currentYear = now.getFullYear();
    const yearsUntilTarget = Math.max(targetYear - currentYear, 1);

    // Total budget = annual emission rate × years until target
    // Multiply by a budget factor (0.85 for uptrend, 1.0 for stable, 1.15 for downtrend)
    // This creates meaningful progress bars and realistic breach dates
    const budgetFactor = trend.direction === 'rising' ? 0.85 : trend.direction === 'falling' ? 1.15 : 1.0;
    const TOTAL_BUDGET_KG = Math.round(annualRate * yearsUntilTarget * budgetFactor);

    // Calculate how much of the total multi-year budget has been consumed YTD
    // (fraction of current year / total years × 100)
    const expectedYtdUsage = (daysSoFar / 365) / yearsUntilTarget;
    const actualYtdUsage = TOTAL_BUDGET_KG > 0 ? ytdEmissions / TOTAL_BUDGET_KG : 0;
    const budgetUsedPct = Math.min(actualYtdUsage * 100, 100);

    const remainingBudget = Math.max(TOTAL_BUDGET_KG - ytdEmissions, 0);

    // Estimate breach date
    let estimatedBreachDate = null;
    if (dailyRate > 0 && ytdEmissions < TOTAL_BUDGET_KG) {
      const daysUntilBreach = Math.ceil(remainingBudget / dailyRate);
      const breach = new Date(now);
      breach.setDate(breach.getDate() + daysUntilBreach);
      estimatedBreachDate = breach.toISOString().split('T')[0];
    }

    // Risk level from trend + budget tracking rate
    let riskLevel = 'low';
    const trackingRatio = actualYtdUsage / Math.max(expectedYtdUsage, 0.001);
    if (trackingRatio > 1.2 || trend.direction === 'rising') {
      riskLevel = 'high';
    } else if (trackingRatio > 0.9 || trend.slope > 0) {
      riskLevel = 'medium';
    }

    // Mine summary stats
    const recent30 = emissions.slice(-30);
    const currentEmission = recent30.length > 0
      ? recent30.reduce((s, e) => s + (e.total_carbon_emission || 0), 0) / recent30.length
      : 0;

    const older30 = emissions.slice(-60, -30);
    const olderAvg = older30.length > 0
      ? older30.reduce((s, e) => s + (e.total_carbon_emission || 0), 0) / older30.length
      : currentEmission;

    const forecastGrowthPct = olderAvg > 0
      ? ((currentEmission - olderAvg) / olderAvg) * 100
      : 0;

    // Carbon intensity (emissions per unit of activity — simplified)
    const totalFuel = recent30.reduce((s, e) => s + (e.fuel_used || 0), 0);
    const carbonIntensity = totalFuel > 0 ? currentEmission / (totalFuel / 30) : 0;

    res.json({
      anomalies: mlInsights?.anomalies || [],
      seasonality: mlInsights?.seasonality || { weekday_data: [], insight: 'Insights unavailable', has_pattern: false },
      drivers: mlInsights?.drivers || [],
      trend: mlInsights?.trend || { direction: 'stable', slope: 0, description: 'Trend analysis unavailable.' },
      mape: mlInsights?.mape || null,
      carbonBudget: {
        annualBudgetKg: TOTAL_BUDGET_KG,
        ytdEmissionsKg: Math.round(ytdEmissions),
        budgetUsedPct: Math.round(budgetUsedPct * 10) / 10,
        remainingBudgetKg: Math.round(remainingBudget),
        estimatedBreachDate,
        targetYear,
      },
      riskLevel,
      summary: {
        currentEmission: Math.round(currentEmission),
        forecastGrowthPct: Math.round(forecastGrowthPct * 10) / 10,
        reductionPotential: Math.round(currentEmission * 0.15),
        carbonIntensity: Math.round(carbonIntensity * 100) / 100,
      },
    });

  } catch (err) {
    console.error('Error computing forecast insights:', err.message);
    res.status(500).json({ error: 'Failed to compute forecast insights.' });
  }
});

module.exports = router;
