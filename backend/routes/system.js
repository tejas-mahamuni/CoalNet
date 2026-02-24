const express = require('express');
const router = express.Router();
const multer = require('multer');
const Mine = require('../models/Mine');
const { getMineEmissionModel } = require('../models/Emission');
const Forecast = require('../models/Forecast');
const { generateDummyData } = require('../migrateData');

const upload = multer({ storage: multer.memoryStorage() });

// POST /api/upload - CSV upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { mineId } = req.body;

    if (!req.file || !mineId) {
      return res.status(400).json({ error: 'File and mineId are required' });
    }

    const mine = await Mine.findById(mineId);
    if (!mine) {
      return res.status(404).json({ error: 'Mine not found' });
    }

    const MineEmission = getMineEmissionModel(mine.name);

    const csvContent = req.file.buffer.toString('utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());

    const requiredColumns = ['Date', 'Fuel Used (L)', 'Electricity Used (kWh)', 'Explosives Used (kg)', 'Transport Fuel Used (L)'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));

    if (missingColumns.length > 0) {
      return res.status(400).json({
        error: `Missing required columns: ${missingColumns.join(', ')}`
      });
    }

    let recordsProcessed = 0;
    let totalFuel = 0;
    let totalElectricity = 0;
    let totalExplosives = 0;
    let totalTransport = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length !== headers.length) continue;

      const rowData = {};
      headers.forEach((header, index) => {
        rowData[header] = values[index];
      });

      try {
        const date = new Date(rowData['Date']);
        const fuel_used = parseFloat(rowData['Fuel Used (L)']) || 0;
        const electricity_used = parseFloat(rowData['Electricity Used (kWh)']) || 0;
        const explosives_used = parseFloat(rowData['Explosives Used (kg)']) || 0;
        const transport_fuel_used = parseFloat(rowData['Transport Fuel Used (L)']) || 0;

        const existingEmission = await MineEmission.findOne({ date });

        if (existingEmission) {
          const updatedFuelUsed = existingEmission.fuel_used + fuel_used;
          const updatedElectricityUsed = existingEmission.electricity_used + electricity_used;
          const updatedExplosivesUsed = existingEmission.explosives_used + explosives_used;
          const updatedTransportFuelUsed = existingEmission.transport_fuel_used + transport_fuel_used;

          const fuel_emission = updatedFuelUsed * 2.68;
          const explosives_emission = updatedExplosivesUsed * 1.5;
          const electricity_emission = updatedElectricityUsed * 0.82;
          const transport_emission = updatedTransportFuelUsed * 2.68;
          const methane_emissions_co2e = 0.02 * updatedFuelUsed * 28;

          const carbon_emission = fuel_emission + electricity_emission + transport_emission + explosives_emission;
          const total_carbon_emission = carbon_emission + methane_emissions_co2e;

          const scope1 = fuel_emission + explosives_emission + methane_emissions_co2e;
          const scope2 = electricity_emission;
          const scope3 = transport_emission;

          existingEmission.fuel_used = updatedFuelUsed;
          existingEmission.electricity_used = updatedElectricityUsed;
          existingEmission.explosives_used = updatedExplosivesUsed;
          existingEmission.transport_fuel_used = updatedTransportFuelUsed;
          existingEmission.fuel_emission = fuel_emission;
          existingEmission.electricity_emission = electricity_emission;
          existingEmission.explosives_emission = explosives_emission;
          existingEmission.methane_emissions_co2e = methane_emissions_co2e;
          existingEmission.transport_emission = transport_emission;
          existingEmission.scope1 = scope1;
          existingEmission.scope2 = scope2;
          existingEmission.scope3 = scope3;
          existingEmission.total_carbon_emission = total_carbon_emission;

          await existingEmission.save();
        } else {
          const fuel_emission = fuel_used * 2.68;
          const explosives_emission = explosives_used * 1.5;
          const electricity_emission = electricity_used * 0.82;
          const transport_emission = transport_fuel_used * 2.68;
          const methane_emissions_co2e = 0.02 * fuel_used * 28;

          const carbon_emission = fuel_emission + electricity_emission + transport_emission + explosives_emission;
          const total_carbon_emission = carbon_emission + methane_emissions_co2e;

          const scope1 = fuel_emission + explosives_emission + methane_emissions_co2e;
          const scope2 = electricity_emission;
          const scope3 = transport_emission;

          const newEmission = new MineEmission({
            date,
            fuel_used,
            electricity_used,
            explosives_used,
            methane_emissions_ch4: 0.02 * fuel_used,
            transport_fuel_used,
            fuel_emission,
            electricity_emission,
            explosives_emission,
            methane_emissions_co2e,
            transport_emission,
            scope1,
            scope2,
            scope3,
            total_carbon_emission,
          });

          await newEmission.save();
        }

        totalFuel += fuel_used;
        totalElectricity += electricity_used;
        totalExplosives += explosives_used;
        totalTransport += transport_fuel_used;
        recordsProcessed++;
      } catch (parseError) {
        console.error(`Error processing row ${i}:`, parseError);
        continue;
      }
    }

    const totalEmissions = (totalFuel * 2.68) + (totalElectricity * 0.82) + (totalExplosives * 1.5) + (totalTransport * 2.68) + (0.02 * totalFuel * 28);

    res.json({
      message: 'CSV uploaded and processed successfully',
      recordsProcessed,
      totalFuel,
      totalElectricity,
      totalExplosives,
      totalTransport,
      totalEmissions
    });
  } catch (err) {
    console.error('Error uploading CSV:', err);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

// GET /api/export/:mineId - CSV Export
router.get('/export/:mineId', async (req, res) => {
  try {
    const { mineId } = req.params;

    const mine = await Mine.findById(mineId);
    if (!mine) {
      return res.status(404).json({ error: 'Mine not found' });
    }

    const MineEmission = getMineEmissionModel(mine.name);
    const emissions = await MineEmission.find({}).sort({ date: -1 });

    const csvHeader = 'Date,Fuel Used (L),Electricity Used (kWh),Explosives Used (kg),Methane Emissions (kg CH4),Transport Fuel Used (L),Fuel Emission (kg CO2e),Electricity Emission (kg CO2e),Explosives Emission (kg CO2e),Methane Emissions (kg CO2e),Transport Emission (kg CO2e),Scope 1 (kg CO2e),Scope 2 (kg CO2e),Scope 3 (kg CO2e),Total Carbon Emission (kg CO2e)\n';

    const csvRows = emissions.map(emission => {
      return [
        emission.date.toISOString().split('T')[0],
        emission.fuel_used || 0,
        emission.electricity_used || 0,
        emission.explosives_used || 0,
        emission.methane_emissions_ch4 || 0,
        emission.transport_fuel_used || 0,
        emission.fuel_emission || 0,
        emission.electricity_emission || 0,
        emission.explosives_emission || 0,
        emission.methane_emissions_co2e || 0,
        emission.transport_emission || 0,
        emission.scope1 || 0,
        emission.scope2 || 0,
        emission.scope3 || 0,
        emission.total_carbon_emission || 0
      ].join(',');
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${mine.name.replace(/\s+/g, '_').toLowerCase()}_emissions.csv"`);
    res.send(csvContent);
  } catch (err) {
    console.error('Error exporting mine emissions:', err);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

// POST /api/migrate - Migration trigger
router.post('/migrate', async (req, res) => {
  try {
    console.log('🚀 Starting migration from API...');
    // Clear all cached forecasts so stale predictions don't persist
    const deleted = await Forecast.deleteMany({});
    console.log(`🗑️ Cleared ${deleted.deletedCount} cached forecasts`);
    await generateDummyData();
    console.log('✅ Migration completed successfully!');
    res.json({ message: 'Migration completed successfully! All cached forecasts cleared.' });
  } catch (err) {
    console.error('❌ Migration error:', err);
    res.status(500).json({ error: 'Migration failed: ' + err.message });
  }
});

module.exports = router;
