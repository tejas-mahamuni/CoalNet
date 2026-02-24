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

// Generate demonstration data with distinct emission profiles per mine
const generateDummyData = async () => {
  try {
    console.log('🎲 Generating demonstration data with distinct mine profiles...');

    const mines = await Mine.find({ status: 'active' });
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 6); // Past 6 months

    // Profiles cycle for each mine
    const profiles = ['uptrend', 'downtrend', 'anomaly', 'seasonal', 'stable'];

    for (let mi = 0; mi < mines.length; mi++) {
      const mine = mines[mi];
      const profile = profiles[mi % profiles.length];
      const MineEmission = getMineEmissionModel(mine.name);

      // Always clear existing data and regenerate
      await MineEmission.deleteMany({});
      console.log(`🗑️ Cleared data for ${mine.name}`);

      const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

      // Base emission level varies per mine (800-1500 kg CO₂e/day)
      const baseEmission = 800 + Math.random() * 700;

      console.log(`🎯 [${profile.toUpperCase()}] Generating ${totalDays} days for ${mine.name} (base: ${baseEmission.toFixed(0)} kg CO₂e/day)`);

      let currentDate = new Date(startDate);
      let generatedRecords = 0;

      // Pre-compute anomaly spike dates (for 'anomaly' profile)
      const anomalyDays = new Set();
      if (profile === 'anomaly') {
        // 4-5 random spike days spread across the timeline
        for (let s = 0; s < 5; s++) {
          anomalyDays.add(Math.floor(Math.random() * totalDays * 0.7) + Math.floor(totalDays * 0.15));
        }
      }

      while (currentDate <= endDate) {
        try {
          const dayIndex = Math.ceil((currentDate - startDate) / (1000 * 60 * 60 * 24));
          const dayOfWeek = currentDate.getDay(); // 0=Sun, 6=Sat

          // ---- Calculate emission multiplier based on profile ----
          let multiplier = 1.0;

          switch (profile) {
            case 'uptrend':
              // Steady +0.5% daily growth compounded → ~2.5x over 180 days
              multiplier = Math.pow(1.005, dayIndex);
              // Add small daily noise
              multiplier *= (0.92 + Math.random() * 0.16);
              break;

            case 'downtrend':
              // Steady -0.3% daily decline → ~0.58x over 180 days
              multiplier = Math.pow(0.997, dayIndex);
              multiplier *= (0.92 + Math.random() * 0.16);
              break;

            case 'anomaly':
              // Stable base with random spike days (3x-5x normal)
              multiplier = 0.90 + Math.random() * 0.20; // normal noise
              if (anomalyDays.has(dayIndex)) {
                multiplier *= (3.0 + Math.random() * 2.0); // spike 3x-5x
              }
              break;

            case 'seasonal':
              // Strong weekday/weekend pattern
              if (dayOfWeek === 0 || dayOfWeek === 6) {
                multiplier = 0.55 + Math.random() * 0.15; // Weekend: 55-70% of normal
              } else {
                multiplier = 0.95 + Math.random() * 0.20; // Weekday: 95-115%
              }
              // Add mild overall growth
              multiplier *= (1 + dayIndex * 0.0005);
              break;

            case 'stable':
            default:
              // Pure random variation around base
              multiplier = 0.80 + Math.random() * 0.40; // 80-120%
              break;
          }

          const totalTarget = baseEmission * multiplier;

          // Distribute into sub-emissions (proportional breakdown)
          const fuelPct = 0.35 + Math.random() * 0.05;      // ~35-40%
          const electricityPct = 0.15 + Math.random() * 0.05; // ~15-20%
          const explosivesPct = 0.02 + Math.random() * 0.01;  // ~2-3%
          const transportPct = 0.20 + Math.random() * 0.05;   // ~20-25%
          const methanePct = 1 - fuelPct - electricityPct - explosivesPct - transportPct; // ~15-25%

          const fuel_emission = totalTarget * fuelPct;
          const electricity_emission = totalTarget * electricityPct;
          const explosives_emission = totalTarget * explosivesPct;
          const transport_emission = totalTarget * transportPct;
          const methane_emissions_co2e = totalTarget * methanePct;

          // Back-calculate usage from emission factors
          const fuel_used = fuel_emission / 2.68;
          const electricity_used = electricity_emission / 0.82;
          const explosives_used = explosives_emission / 1.5;
          const transport_fuel_used = transport_emission / 2.68;
          const methane_emissions_ch4 = methane_emissions_co2e / 28;

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
            console.log(`📝 ${mine.name}: ${generatedRecords}/${totalDays} records`);
          }

        } catch (err) {
          if (err.code === 11000) {
            // duplicate — skip
          } else {
            console.error(`❌ Error for ${mine.name}:`, err.message);
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      console.log(`✅ [${profile.toUpperCase()}] ${generatedRecords} records for ${mine.name}`);
    }

    console.log('🎉 Demonstration data generation completed!');
  } catch (err) {
    console.error('❌ Data generation error:', err);
    throw err;
  }
};

// Main execution
const runMigration = async () => {
  await connectDB();

  console.log('🚀 Starting data generation process...');

  // Generate demonstration data with distinct mine profiles
  await generateDummyData();

  console.log('🎯 Data generation completed successfully!');
  process.exit(0);
};

// Export functions for use in API
module.exports = {
  migrateExistingData,
  generateDummyData,
  runMigration
};
