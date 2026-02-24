const express = require('express');
const router = express.Router();
const Mine = require('../models/Mine');
const { getMineEmissionModel } = require('../models/Emission');

// POST /api/emissions - Add new emission data to a specific mine's collection
router.post('/', async (req, res) => {
  try {
    const { mineId, date, fuel_used, electricity_used, explosives_used, transport_fuel_used } = req.body;

    if (!mineId || !date || fuel_used === undefined || electricity_used === undefined || explosives_used === undefined || transport_fuel_used === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const mine = await Mine.findById(mineId);
    if (!mine) {
      return res.status(404).json({ error: 'Mine not found' });
    }

    const MineEmission = getMineEmissionModel(mine.name);

    // Check if data already exists for this date
    const existingEmission = await MineEmission.findOne({ date: new Date(date) });

    if (existingEmission) {
      // Add to existing data
      const updatedFuelUsed = existingEmission.fuel_used + parseFloat(fuel_used);
      const updatedElectricityUsed = existingEmission.electricity_used + parseFloat(electricity_used);
      const updatedExplosivesUsed = existingEmission.explosives_used + parseFloat(explosives_used);
      const updatedTransportFuelUsed = existingEmission.transport_fuel_used + parseFloat(transport_fuel_used);

      // Recalculate emissions based on new totals
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

      // Update existing record
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
      res.status(200).json(existingEmission);
    } else {
      // Create new record
      const fuel_emission = parseFloat(fuel_used) * 2.68;
      const explosives_emission = parseFloat(explosives_used) * 1.5;
      const electricity_emission = parseFloat(electricity_used) * 0.82;
      const transport_emission = parseFloat(transport_fuel_used) * 2.68;
      const methane_emissions_co2e = 0.02 * parseFloat(fuel_used) * 28;

      const carbon_emission = fuel_emission + electricity_emission + transport_emission + explosives_emission;
      const total_carbon_emission = carbon_emission + methane_emissions_co2e;

      const scope1 = fuel_emission + explosives_emission + methane_emissions_co2e;
      const scope2 = electricity_emission;
      const scope3 = transport_emission;

      const newEmission = new MineEmission({
        date,
        fuel_used: parseFloat(fuel_used),
        electricity_used: parseFloat(electricity_used),
        explosives_used: parseFloat(explosives_used),
        methane_emissions_ch4: 0.02 * parseFloat(fuel_used),
        transport_fuel_used: parseFloat(transport_fuel_used),
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
      res.status(201).json(newEmission);
    }
  } catch (err) {
    console.error('Error adding emission data:', err);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

// GET /api/emissions/:mineId - Get emission data for a specific mine
router.get('/:mineId', async (req, res) => {
  try {
    const { mineId } = req.params;

    const mine = await Mine.findById(mineId);
    if (!mine) {
      return res.status(404).json({ error: 'Mine not found' });
    }

    const MineEmission = getMineEmissionModel(mine.name);
    const emissions = await MineEmission.find({}).sort({ date: -1 }); // Most recent first

    res.json(emissions);
  } catch (err) {
    console.error('Error fetching mine emissions:', err);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

module.exports = router;
