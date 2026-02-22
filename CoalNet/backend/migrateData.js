const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
    });
    console.log('✅ MongoDB connected successfully!');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

const Mine = require('./models/Mine');
const { getMineEmissionModel } = require('./models/Emission');

// Migration function
const migrateExistingData = async () => {
  try {
    console.log('🔄 Starting data migration...');

    // Get all mines
    const mines = await Mine.find({ status: 'active' });
    console.log(`📊 Found ${mines.length} active mines`);

    // Get existing emission data (assuming it's in a collection called 'emissions' or similar)
    // You might need to adjust this based on your actual collection name
    const Emission = mongoose.model('Emission', dailyEmissionSchema);
    const existingData = await Emission.find({}).limit(1000); // Limit for safety

    console.log(`📦 Found ${existingData.length} existing emission records`);

    if (existingData.length === 0) {
      console.log('⚠️ No existing data found to migrate');
      return;
    }

    // Group data by mine (you might need to adjust this logic based on how mines are linked)
    // For now, we'll distribute existing data across mines
    const dataPerMine = Math.floor(existingData.length / mines.length);
    const remainder = existingData.length % mines.length;

    for (let i = 0; i < mines.length; i++) {
      const mine = mines[i];
      const startIndex = i * dataPerMine;
      const endIndex = startIndex + dataPerMine + (i < remainder ? 1 : 0);

      const mineData = existingData.slice(startIndex, endIndex);
      const MineEmission = getMineEmissionModel(mine.name);

      console.log(`🚚 Migrating ${mineData.length} records to ${mine.name} collection`);

      for (const record of mineData) {
        try {
          const newRecord = new MineEmission({
            date: record.date,
            fuel_used: record.fuel_used,
            electricity_used: record.electricity_used,
            explosives_used: record.explosives_used || 0,
            methane_emissions_ch4: record.methane_emissions_ch4,
            transport_fuel_used: record.transport_fuel_used,
            fuel_emission: record.fuel_emission,
            electricity_emission: record.electricity_emission,
            explosives_emission: record.explosives_emission,
            methane_emissions_co2e: record.methane_emissions_co2e,
            transport_emission: record.transport_emission,
            scope1: record.scope1,
            scope2: record.scope2,
            scope3: record.scope3,
            total_carbon_emission: record.total_carbon_emission,
          });

          await newRecord.save();
        } catch (err) {
          if (err.code === 11000) {
            console.log(`⚠️ Duplicate date for ${mine.name}, skipping...`);
          } else {
            console.error(`❌ Error saving record for ${mine.name}:`, err.message);
          }
        }
      }
    }

    console.log('✅ Migration completed!');
  } catch (err) {
    console.error('❌ Migration error:', err);
    throw err; // Re-throw to handle in API
  }
};

// Generate dummy data for better visualization
const generateDummyData = async () => {
  try {
    console.log('🎲 Generating dummy data for visualization...');

    const mines = await Mine.find({ status: 'active' });
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 6); // Past 6 months

    // Target total emissions per mine: 4,000 - 11,000 tonnes (for ~180 days, ~22-61 tonnes/day)
    // Based on real Indian coal mine emissions: 72k-593k tonnes annually
    const targetEmissionsPerMine = Math.random() * 7000 + 4000; // 4k-11k tonnes for 6 months

    for (const mine of mines) {
      const MineEmission = getMineEmissionModel(mine.name);

      // Always clear existing data and regenerate fresh data for past 6 months
      await MineEmission.deleteMany({});
      console.log(`🗑️ Cleared existing data for ${mine.name}`);

      // Calculate records needed for past 6 months
      const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const recordsNeeded = totalDays;

      // Calculate average emissions per day to reach target
      const avgEmissionsPerDay = targetEmissionsPerMine / totalDays;

      console.log(`🎯 Generating ${recordsNeeded} records for ${mine.name} (target: ${targetEmissionsPerMine.toFixed(0)} tonnes over ${totalDays} days)`);

      let currentDate = new Date(startDate);
      let generatedRecords = 0;

      while (currentDate <= endDate && generatedRecords < recordsNeeded) {
        try {
          // Skip if record already exists
          const existing = await MineEmission.findOne({ date: currentDate });
          if (existing) {
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
          }

          // Generate realistic emission data for 200-500 tonnes/day per mine
          // Based on real Indian coal mine data: 72k-593k tonnes annually per mine
          const baseFuel = Math.random() * 400 + 100; // 100-500 litres (realistic scale)
          const baseElectricity = Math.random() * 200 + 50; // 50-250 kWh (realistic scale)
          const baseExplosives = Math.random() * 10 + 1; // 1-11 kg (realistic scale)
          const baseTransport = Math.random() * 200 + 50; // 50-250 litres/km (realistic scale)

          // Add some variation to reach target emissions
          const variationFactor = Math.random() * 0.4 + 0.8; // 0.8-1.2
          const fuel_used = baseFuel * variationFactor;
          const electricity_used = baseElectricity * variationFactor;
          const explosives_used = baseExplosives * variationFactor;
          const transport_fuel_used = baseTransport * variationFactor;

          // Emission calculations (in kg CO2e, consistent with index.js)
          const fuel_emission = fuel_used * 2.68;
          const explosives_emission = explosives_used * 1.5; // Fixed to match index.js
          const electricity_emission = electricity_used * 0.82;
          const transport_emission = transport_fuel_used * 2.68;
          const methane_emissions_ch4 = fuel_used * 0.02;
          const methane_emissions_co2e = methane_emissions_ch4 * 28; // Updated to 28 as per index.js

          const scope1 = fuel_emission + explosives_emission + methane_emissions_co2e;
          const scope2 = electricity_emission;
          const scope3 = transport_emission;
          const total_carbon_emission = scope1 + scope2 + scope3;

          const newRecord = new MineEmission({
            date: new Date(currentDate),
            fuel_used,
            electricity_used,
            explosives_used,
            methane_emissions_ch4,
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

          await newRecord.save();
          generatedRecords++;

          if (generatedRecords % 50 === 0) {
            console.log(`📝 Generated ${generatedRecords}/${recordsNeeded} records for ${mine.name}`);
          }

        } catch (err) {
          if (err.code === 11000) {
            console.log(`⚠️ Duplicate date for ${mine.name}, skipping...`);
          } else {
            console.error(`❌ Error generating data for ${mine.name}:`, err.message);
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      console.log(`✅ Generated ${generatedRecords} records for ${mine.name}`);
    }

    console.log('🎉 Dummy data generation completed!');
  } catch (err) {
    console.error('❌ Dummy data generation error:', err);
    throw err; // Re-throw to handle in API
  }
};

// Main execution
const runMigration = async () => {
  await connectDB();

  console.log('🚀 Starting migration process...');

  // First migrate existing data
  await migrateExistingData();

  // Then generate dummy data
  await generateDummyData();

  console.log('🎯 Migration process completed successfully!');
  process.exit(0);
};

// Export functions for use in API
module.exports = {
  migrateExistingData,
  generateDummyData,
  runMigration
};
