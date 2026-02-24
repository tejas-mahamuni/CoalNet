const mongoose = require('mongoose');

const dailyEmissionSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  fuel_used: { type: Number, required: true }, // litres
  electricity_used: { type: Number, required: true }, // kWh
  explosives_used: { type: Number, default: 0 }, // kg, optional
  methane_emissions_ch4: { type: Number, required: true }, // kg CH4
  transport_fuel_used: { type: Number, required: true }, // litres/km
  fuel_emission: { type: Number, required: true }, // calculated
  electricity_emission: { type: Number, required: true }, // calculated
  explosives_emission: { type: Number, required: true }, // calculated
  methane_emissions_co2e: { type: Number, required: true }, // calculated
  transport_emission: { type: Number, required: true }, // calculated
  scope1: { type: Number, required: true },
  scope2: { type: Number, required: true },
  scope3: { type: Number, required: true },
  total_carbon_emission: { type: Number, required: true },
});

const getMineEmissionModel = (mineName) => {
  const collectionName = mineName.replace(/\s+/g, '_').toLowerCase();
  return mongoose.models[collectionName] || mongoose.model(collectionName, dailyEmissionSchema);
};

module.exports = { dailyEmissionSchema, getMineEmissionModel };
