const express = require('express');
const router = express.Router();
const Mine = require('../models/Mine');
const { getMineEmissionModel } = require('../models/Emission');

// GET /api/dashboard - Dashboard summary data
router.get('/dashboard', async (req, res) => {
  try {
    const { mineName, period = 'daily' } = req.query;
    let mineNamesToFetch = [];

    if (!mineName || mineName === 'all') {
      const activeMines = await Mine.find({ status: 'active' }).select('name');
      mineNamesToFetch = activeMines.map(mine => mine.name);
    } else {
      mineNamesToFetch = [mineName];
    }

    if (mineNamesToFetch.length === 0) {
      return res.status(200).json({
        overview: { totalMines: 0, activeMines: 0, totalEmissions: 0, targetReduction: 100, currentReduction: 0 },
        chartData: [],
        scopeBreakdown: [],
        monthlyEmissions: [],
        recentActivities: [],
        alerts: []
      });
    }

    let allData = [];
    const today = new Date();

    for (const currentMineName of mineNamesToFetch) {
      const MineEmission = getMineEmissionModel(currentMineName);
      let data = [];
      let startDate = new Date(today);

      switch (period) {
        case 'daily':
          startDate.setDate(today.getDate() - 7);
          data = await MineEmission.find({ date: { $gte: startDate, $lte: today } }).sort({ date: 1 });
          break;
        case 'weekly':
          startDate.setDate(today.getDate() - 28);
          data = await MineEmission.find({ date: { $gte: startDate, $lte: today } }).sort({ date: 1 });
          break;
        case 'monthly':
          startDate.setMonth(today.getMonth() - 6);
          data = await MineEmission.find({ date: { $gte: startDate, $lte: today } }).sort({ date: 1 });
          break;
        default:
          return res.status(400).json({ error: 'Invalid period specified' });
      }

      data = data.map(item => ({ ...item.toObject(), mineName: currentMineName }));
      allData = allData.concat(data);
    }

    const totalMines = mineNamesToFetch.length;
    const activeMines = totalMines;
    const totalEmissions = allData.reduce((sum, item) => sum + ((item.scope1 || 0) + (item.scope2 || 0) + (item.scope3 || 0)), 0);
    const targetReduction = 100;
    const currentReduction = totalEmissions > 0 ? Math.min(50, (totalEmissions / 1000) * 100) : 0;

    const chartData = allData.map(item => {
      const fuel = item.fuel_emission || (item.fuel_used * 2.68) || 0;
      const electricity = item.electricity_emission || (item.electricity_used * 0.82) || 0;
      const explosives = item.explosives_emission || (item.explosives_used * 2) || 0;
      const transport = item.transport_emission || (item.transport_fuel_used * 2.68) || 0;
      const methane = item.methane_emissions_co2e || ((item.fuel_used * 0.02) * 28) || 0;

      return {
        date: item.date.toISOString().split('T')[0],
        totalEmissions: item.total_carbon_emission || (fuel + electricity + explosives + transport + methane),
        scope1: item.scope1 || (fuel + explosives + methane),
        scope2: item.scope2 || electricity,
        scope3: item.scope3 || transport,
        mineName: item.mineName,
        fuel_emission: fuel,
        electricity_emission: electricity,
        explosives_emission: explosives,
        transport_emission: transport,
        methane_emissions_co2e: methane,
      };
    });

    const scopeBreakdown = chartData.reduce((acc, item) => {
        acc.scope1 += (item.scope1 || 0);
        acc.scope2 += (item.scope2 || 0);
        acc.scope3 += (item.scope3 || 0);
        acc.methane += (item.methane_emissions_co2e || 0);
        return acc;
    }, { scope1: 0, scope2: 0, scope3: 0, methane: 0 });

    let periodEmissions = [];
    if (period === 'daily') {
      periodEmissions = allData.map(item => ({
        period: item.date.toISOString().split('T')[0],
        emissions: (item.total_carbon_emission || 0) / 1000,
        methane: (item.methane_emissions_ch4 || 0) / 1000,
        methane_co2e: (item.methane_emissions_co2e || 0) / 1000,
        target: 0
      }));
    } else if (period === 'weekly') {
      const weeklyEmissions = allData.reduce((acc, item) => {
        const date = new Date(item.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().slice(0, 10);

        if (!acc[weekKey]) {
          acc[weekKey] = { emissions: 0, methane: 0, methane_co2e: 0, target: 0 };
        }
        acc[weekKey].emissions += (item.total_carbon_emission || 0) / 1000;
        acc[weekKey].methane += (item.methane_emissions_ch4 || 0) / 1000;
        acc[weekKey].methane_co2e += (item.methane_emissions_co2e || 0) / 1000;
        return acc;
      }, {});

      const sortedWeeks = Object.keys(weeklyEmissions).sort();
      periodEmissions = sortedWeeks.map((weekKey, index) => ({
        period: `Week ${index + 1}`,
        emissions: weeklyEmissions[weekKey].emissions,
        methane: weeklyEmissions[weekKey].methane,
        methane_co2e: weeklyEmissions[weekKey].methane_co2e,
        target: 0
      }));
    } else {
      const monthlyEmissions = allData.reduce((acc, item) => {
        const month = item.date.toISOString().slice(0, 7);
        if (!acc[month]) {
          acc[month] = { emissions: 0, methane: 0, methane_co2e: 0, target: 0 };
        }
        acc[month].emissions += (item.total_carbon_emission || 0) / 1000;
        acc[month].methane += (item.methane_emissions_ch4 || 0) / 1000;
        acc[month].methane_co2e += (item.methane_emissions_co2e || 0) / 1000;
        return acc;
      }, {});

      const allMonths = [];
      let current = new Date(today.getFullYear(), today.getMonth() - 6, 1);
      for (let i = 0; i < 7; i++) {
        allMonths.push(current.toISOString().slice(0, 7));
        current.setMonth(current.getMonth() + 1);
      }

      periodEmissions = allMonths.map(month => ({
        period: month,
        emissions: monthlyEmissions[month]?.emissions || 0,
        methane: monthlyEmissions[month]?.methane || 0,
        methane_co2e: monthlyEmissions[month]?.methane_co2e || 0,
        target: monthlyEmissions[month]?.target || 0
      }));
    }

    const recentActivities = allData.slice(-5).map((item, index) => ({
      id: index + 1,
      type: 'Emission Data Entry',
      mine: item.mineName,
      date: item.date.toISOString().split('T')[0],
      status: 'verified'
    }));

    const alerts = totalEmissions === 0 ? [{
      id: 1,
      type: 'info',
      message: 'No emission data found. Please add emission data to view dashboard.',
      time: 'Now'
    }] : [];

    res.json({
        overview: { totalMines, activeMines, totalEmissions, targetReduction, currentReduction },
        chartData,
        scopeBreakdown: [
            { name: 'Scope 1', value: scopeBreakdown.scope1 / 1000 },
            { name: 'Scope 2', value: scopeBreakdown.scope2 / 1000 },
            { name: 'Scope 3', value: scopeBreakdown.scope3 / 1000 },
            { name: 'Methane', value: scopeBreakdown.methane / 1000 },
        ],
        monthlyEmissions: periodEmissions,
        recentActivities,
        alerts
    });
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/visualization/:mineId - Visualization data for a specific mine
router.get('/visualization/:mineId', async (req, res) => {
  try {
    const { mineId } = req.params;

    const mine = await Mine.findById(mineId);
    if (!mine) {
      return res.status(404).json({ error: 'Mine not found' });
    }

    const MineEmission = getMineEmissionModel(mine.name);
    const emissions = await MineEmission.find({}).sort({ date: 1 });

    if (emissions.length === 0) {
      return res.status(404).json({ error: 'No emission data found for this mine' });
    }

    const emissionsTrend = emissions.map(emission => ({
      date: emission.date.toISOString().split('T')[0],
      totalEmissions: emission.total_carbon_emission || 0,
      scope1: emission.scope1 || 0,
      scope2: emission.scope2 || 0,
      scope3: emission.scope3 || 0
    }));

    const totalScope1 = emissions.reduce((sum, e) => sum + (e.scope1 || 0), 0);
    const totalScope2 = emissions.reduce((sum, e) => sum + (e.scope2 || 0), 0);
    const totalScope3 = emissions.reduce((sum, e) => sum + (e.scope3 || 0), 0);
    const totalMethane = emissions.reduce((sum, e) => sum + (e.methane_emissions_co2e || 0), 0);

    const scopeBreakdown = [
      { name: 'Scope 1', value: totalScope1 },
      { name: 'Scope 2', value: totalScope2 },
      { name: 'Scope 3', value: totalScope3 },
      { name: 'Methane', value: totalMethane }
    ].filter(item => item.value > 0);

    const totalFuel = emissions.reduce((sum, e) => sum + (e.fuel_used || 0), 0);
    const totalElectricity = emissions.reduce((sum, e) => sum + (e.electricity_used || 0), 0);

    const usageStats = [{
      category: 'Total Usage',
      fuel: totalFuel,
      electricity: totalElectricity
    }];

    const recentEmissions = emissions.slice(-30);
    const forecast = [];

    if (recentEmissions.length >= 7) {
      const n = recentEmissions.length;
      const sumX = recentEmissions.reduce((sum, _, i) => sum + i, 0);
      const sumY = recentEmissions.reduce((sum, e) => sum + (e.total_carbon_emission || 0), 0);
      const sumXY = recentEmissions.reduce((sum, e, i) => sum + i * (e.total_carbon_emission || 0), 0);
      const sumXX = recentEmissions.reduce((sum, _, i) => sum + i * i, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      const lastDate = new Date(recentEmissions[recentEmissions.length - 1].date);
      for (let i = 1; i <= 90; i++) {
        const forecastDate = new Date(lastDate);
        forecastDate.setDate(lastDate.getDate() + i);
        const dayIndex = n + i - 1;
        const forecastedValue = slope * dayIndex + intercept;
        const variance = Math.abs(slope * 0.1);

        forecast.push({
          month: forecastDate.toISOString().slice(0, 7),
          forecastedEmissions: Math.max(0, forecastedValue),
          upperBound: Math.max(0, forecastedValue + variance),
          lowerBound: Math.max(0, forecastedValue - variance)
        });
      }

      const monthlyForecast = forecast.reduce((acc, item) => {
        if (!acc[item.month]) {
          acc[item.month] = { month: item.month, forecastedEmissions: 0, upperBound: 0, lowerBound: 0, count: 0 };
        }
        acc[item.month].forecastedEmissions += item.forecastedEmissions;
        acc[item.month].upperBound += item.upperBound;
        acc[item.month].lowerBound += item.lowerBound;
        acc[item.month].count += 1;
        return acc;
      }, {});

      const groupedForecast = Object.values(monthlyForecast).map((item) => ({
        month: item.month,
        forecastedEmissions: item.forecastedEmissions / item.count,
        upperBound: item.upperBound / item.count,
        lowerBound: item.lowerBound / item.count
      }));
    }

    const totalEmissions = emissions.reduce((sum, e) => sum + (e.total_carbon_emission || 0), 0);
    const averageEmissions = totalEmissions / emissions.length;

    const summary = {
      totalEmissions,
      averageEmissions,
      totalFuel,
      totalElectricity,
      recordCount: emissions.length
    };

    res.json({
      emissionsTrend,
      forecast: forecast.length > 0 ? forecast.slice(0, 3) : [],
      scopeBreakdown,
      usageStats,
      summary
    });
  } catch (err) {
    console.error('Error fetching visualization data:', err);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

module.exports = router;
