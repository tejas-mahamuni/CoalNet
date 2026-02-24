const express = require('express');
const router = express.Router();
const Mine = require('../models/Mine');
const { getMineEmissionModel } = require('../models/Emission');

/**
 * GET /api/aqi/:mineId
 * Calculates an estimated Air Quality Index (AQI) for a mine based on
 * its recent emission data. This is derived from the mine's carbon emissions,
 * methane, fuel combustion, and other operational parameters.
 */
router.get('/:mineId', async (req, res) => {
  try {
    const { mineId } = req.params;
    const mine = await Mine.findById(mineId);
    if (!mine) return res.status(404).json({ error: 'Mine not found' });

    const MineEmission = getMineEmissionModel(mine.name);

    // Get last 30 days of emissions
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const emissions = await MineEmission.find({ date: { $gte: cutoff } })
      .sort({ date: -1 })
      .lean();

    if (!emissions.length) {
      return res.status(404).json({ error: 'No emission data available for AQI calculation' });
    }

    // Calculate average daily values
    const n = emissions.length;
    const avgTotals = {
      totalCarbon: emissions.reduce((s, e) => s + (e.total_carbon_emission || 0), 0) / n,
      fuel: emissions.reduce((s, e) => s + (e.fuel_emission || 0), 0) / n,
      electricity: emissions.reduce((s, e) => s + (e.electricity_emission || 0), 0) / n,
      transport: emissions.reduce((s, e) => s + (e.transport_emission || 0), 0) / n,
      methane: emissions.reduce((s, e) => s + (e.methane_emissions_co2e || 0), 0) / n,
      explosives: emissions.reduce((s, e) => s + (e.explosives_emission || 0), 0) / n,
    };

    // ── Derive pollutant concentrations from emission data ──
    // These are estimated concentrations (µg/m³) based on emission factors
    // In production, these would come from real air quality sensors

    // PM2.5: from combustion (fuel + transport) + coal dust
    const pm25 = Math.min(500,
      (avgTotals.fuel * 0.008) +
      (avgTotals.transport * 0.012) +
      (avgTotals.totalCarbon * 0.003) +
      15 + Math.random() * 10 // ambient baseline
    );

    // PM10: mining operations generate coarse particles
    const pm10 = Math.min(600,
      pm25 * 1.8 +
      (avgTotals.explosives * 0.05) +
      20 + Math.random() * 15
    );

    // SO2: from fuel combustion (coal contains sulfur)
    const so2 = Math.min(800,
      (avgTotals.fuel * 0.006) +
      (avgTotals.electricity * 0.003) +
      5 + Math.random() * 8
    );

    // NO2: from transport and machinery combustion
    const no2 = Math.min(400,
      (avgTotals.transport * 0.01) +
      (avgTotals.fuel * 0.004) +
      10 + Math.random() * 12
    );

    // CO: incomplete combustion
    const co = Math.min(50,
      (avgTotals.fuel * 0.0001) +
      (avgTotals.transport * 0.00015) +
      0.5 + Math.random() * 0.3
    );

    // O3: ground-level ozone (derived from NOx + VOCs)
    const o3 = Math.min(200,
      no2 * 0.4 +
      20 + Math.random() * 10
    );

    // ── Calculate sub-indices (US EPA AQI breakpoints) ──
    const calcSubIndex = (c, breakpoints) => {
      for (const bp of breakpoints) {
        if (c >= bp.cLow && c <= bp.cHigh) {
          return Math.round(
            ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (c - bp.cLow) + bp.iLow
          );
        }
      }
      return 500; // Beyond scale
    };

    const pm25Breakpoints = [
      { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },
      { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
      { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
      { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
      { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
      { cLow: 250.5, cHigh: 500.4, iLow: 301, iHigh: 500 },
    ];

    const pm10Breakpoints = [
      { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
      { cLow: 55, cHigh: 154, iLow: 51, iHigh: 100 },
      { cLow: 155, cHigh: 254, iLow: 101, iHigh: 150 },
      { cLow: 255, cHigh: 354, iLow: 151, iHigh: 200 },
      { cLow: 355, cHigh: 424, iLow: 201, iHigh: 300 },
      { cLow: 425, cHigh: 604, iLow: 301, iHigh: 500 },
    ];

    const so2Breakpoints = [
      { cLow: 0, cHigh: 35, iLow: 0, iHigh: 50 },
      { cLow: 36, cHigh: 75, iLow: 51, iHigh: 100 },
      { cLow: 76, cHigh: 185, iLow: 101, iHigh: 150 },
      { cLow: 186, cHigh: 304, iLow: 151, iHigh: 200 },
      { cLow: 305, cHigh: 604, iLow: 201, iHigh: 300 },
      { cLow: 605, cHigh: 804, iLow: 301, iHigh: 500 },
    ];

    const no2Breakpoints = [
      { cLow: 0, cHigh: 53, iLow: 0, iHigh: 50 },
      { cLow: 54, cHigh: 100, iLow: 51, iHigh: 100 },
      { cLow: 101, cHigh: 360, iLow: 101, iHigh: 150 },
      { cLow: 361, cHigh: 649, iLow: 151, iHigh: 200 },
      { cLow: 650, cHigh: 1249, iLow: 201, iHigh: 300 },
      { cLow: 1250, cHigh: 2049, iLow: 301, iHigh: 500 },
    ];

    const subIndices = {
      pm25: calcSubIndex(pm25, pm25Breakpoints),
      pm10: calcSubIndex(pm10, pm10Breakpoints),
      so2: calcSubIndex(so2, so2Breakpoints),
      no2: calcSubIndex(no2, no2Breakpoints),
    };

    // AQI is the maximum of all sub-indices
    const aqi = Math.max(subIndices.pm25, subIndices.pm10, subIndices.so2, subIndices.no2);

    // Determine category
    let category, color, healthAdvice;
    if (aqi <= 50) {
      category = 'Good';
      color = '#10b981';
      healthAdvice = 'Air quality is satisfactory. No health risk.';
    } else if (aqi <= 100) {
      category = 'Moderate';
      color = '#f59e0b';
      healthAdvice = 'Acceptable air quality. Sensitive individuals should limit prolonged outdoor exertion.';
    } else if (aqi <= 150) {
      category = 'Unhealthy for Sensitive Groups';
      color = '#f97316';
      healthAdvice = 'Members of sensitive groups may experience health effects. General public less likely.';
    } else if (aqi <= 200) {
      category = 'Unhealthy';
      color = '#ef4444';
      healthAdvice = 'Everyone may begin to experience health effects. Sensitive groups more serious.';
    } else if (aqi <= 300) {
      category = 'Very Unhealthy';
      color = '#8b5cf6';
      healthAdvice = 'Health alert: everyone may experience more serious health effects.';
    } else {
      category = 'Hazardous';
      color = '#7f1d1d';
      healthAdvice = 'Health warning of emergency conditions. Entire population is at risk.';
    }

    // Dominant pollutant
    const dominant = Object.entries(subIndices).reduce((a, b) => b[1] > a[1] ? b : a);
    const pollutantLabels = { pm25: 'PM2.5', pm10: 'PM10', so2: 'SO₂', no2: 'NO₂' };

    res.json({
      aqi,
      category,
      color,
      healthAdvice,
      dominantPollutant: pollutantLabels[dominant[0]] || dominant[0],
      pollutants: {
        pm25: { value: Math.round(pm25 * 10) / 10, unit: 'µg/m³', subIndex: subIndices.pm25 },
        pm10: { value: Math.round(pm10 * 10) / 10, unit: 'µg/m³', subIndex: subIndices.pm10 },
        so2: { value: Math.round(so2 * 10) / 10, unit: 'ppb', subIndex: subIndices.so2 },
        no2: { value: Math.round(no2 * 10) / 10, unit: 'ppb', subIndex: subIndices.no2 },
        co: { value: Math.round(co * 100) / 100, unit: 'ppm' },
        o3: { value: Math.round(o3 * 10) / 10, unit: 'ppb' },
      },
      mine: {
        name: mine.name,
        location: mine.location,
        state: mine.state,
        coordinates: mine.coordinates,
      },
      dataPoints: n,
      lastUpdated: emissions[0]?.date || new Date(),
    });

  } catch (err) {
    console.error('AQI route error:', err.message);
    res.status(500).json({ error: 'Failed to calculate AQI' });
  }
});

module.exports = router;
