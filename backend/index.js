
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { generateDummyData } = require('./migrateData');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 second timeout
    });
    console.log('✅ MongoDB connected successfully!');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

connectDB();

// Mine Schema (remains the same)
const mineSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  location: { type: String, required: true },
  state: { type: String, required: true },
  coordinates: {
    lat: Number,
    lng: Number,
  },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
});

const Mine = mongoose.models.Mine || mongoose.model('Mine', mineSchema);

// New Daily Emission Schema for mine-specific collections
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

// Function to get or create a model for a mine's emission data
const getMineEmissionModel = (mineName) => {
  // Sanitize mineName to be a valid collection name
  const collectionName = mineName.replace(/\s+/g, '_').toLowerCase();
  return mongoose.models[collectionName] || mongoose.model(collectionName, dailyEmissionSchema);
};

// POST /api/emissions - Add new emission data to a specific mine's collection
app.post('/api/emissions', async (req, res) => {
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
    // Emission Calculations
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

// GET /api/mines - Get all mines (remains the same)
app.get('/api/mines', async (req, res) => {
  try {
    const mines = await Mine.find({ status: 'active' }).select('name location state coordinates').sort({ name: 1 });
    res.json(mines);
  } catch (err) {
    console.error('Error fetching mines:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard - Updated to fetch from mine-specific collections
app.get('/api/dashboard', async (req, res) => {
  try {
    const { mineName, period = 'daily' } = req.query;
    let mineNamesToFetch = [];

    if (!mineName || mineName === 'all') { // Handle missing mineName the same as 'all'
      // Fetch names of all active mines
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
          // Fetch last 4 weeks of daily data
          startDate.setDate(today.getDate() - 28);
          data = await MineEmission.find({ date: { $gte: startDate, $lte: today } }).sort({ date: 1 });
          break;
        case 'monthly':
          // Fetch last 6 months of daily data
          startDate.setMonth(today.getMonth() - 6);
          data = await MineEmission.find({ date: { $gte: startDate, $lte: today } }).sort({ date: 1 });
          break;
        default:
          return res.status(400).json({ error: 'Invalid period specified' });
      }

      // Add mine name to each data point
      data = data.map(item => ({ ...item.toObject(), mineName: currentMineName }));
      allData = allData.concat(data);
    }

    // Calculate overview stats
    const totalMines = mineNamesToFetch.length;
    const activeMines = totalMines; // All fetched mines are active
    const totalEmissions = allData.reduce((sum, item) => sum + ((item.scope1 || 0) + (item.scope2 || 0) + (item.scope3 || 0)), 0); // Keep in kg
    const targetReduction = 100; // Placeholder
    const currentReduction = totalEmissions > 0 ? Math.min(50, (totalEmissions / 1000) * 100) : 0; // Placeholder calculation

    // Format data for the dashboard
    const chartData = allData.map(item => ({
      date: item.date.toISOString().split('T')[0],
      totalEmissions: item.total_carbon_emission || 0,
      scope1: item.scope1 || 0,
      scope2: item.scope2 || 0,
      scope3: item.scope3 || 0,
      mineName: item.mineName,
    }));

    const scopeBreakdown = allData.reduce((acc, item) => {
        acc.scope1 += (item.scope1 || 0);
        acc.scope2 += (item.scope2 || 0);
        acc.scope3 += (item.scope3 || 0);
        acc.methane += (item.methane_emissions_co2e || 0);
        return acc;
    }, { scope1: 0, scope2: 0, scope3: 0, methane: 0 });

    // Group data based on period
    let periodEmissions = [];
    if (period === 'daily') {
      // For daily, show individual days with dates
      periodEmissions = allData.map(item => ({
        period: item.date.toISOString().split('T')[0], // YYYY-MM-DD
        emissions: (item.total_carbon_emission || 0) / 1000, // Convert kg to tonnes
        methane: (item.methane_emissions_ch4 || 0) / 1000, // Convert kg to tonnes CH4
        methane_co2e: (item.methane_emissions_co2e || 0) / 1000, // Convert kg to tonnes CO2e
        target: 0
      }));
    } else if (period === 'weekly') {
      // Group by week and label as Week 1, Week 2, etc.
      const weeklyEmissions = allData.reduce((acc, item) => {
        const date = new Date(item.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
        const weekKey = weekStart.toISOString().slice(0, 10); // YYYY-MM-DD format

        if (!acc[weekKey]) {
          acc[weekKey] = { emissions: 0, methane: 0, methane_co2e: 0, target: 0 };
        }
        acc[weekKey].emissions += (item.total_carbon_emission || 0) / 1000; // Convert kg to tonnes
        acc[weekKey].methane += (item.methane_emissions_ch4 || 0) / 1000; // Convert kg to tonnes CH4
        acc[weekKey].methane_co2e += (item.methane_emissions_co2e || 0) / 1000; // Convert kg to tonnes CO2e
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
      // Group by month for monthly period
      const monthlyEmissions = allData.reduce((acc, item) => {
        const month = item.date.toISOString().slice(0, 7); // YYYY-MM
        if (!acc[month]) {
          acc[month] = { emissions: 0, methane: 0, methane_co2e: 0, target: 0 };
        }
        acc[month].emissions += (item.total_carbon_emission || 0) / 1000; // Convert kg to tonnes
        acc[month].methane += (item.methane_emissions_ch4 || 0) / 1000; // Convert kg to tonnes CH4
        acc[month].methane_co2e += (item.methane_emissions_co2e || 0) / 1000; // Convert kg to tonnes CO2e
        return acc;
      }, {});

      // Generate all months in the last 7 months range (to include all months with data)
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

    // Placeholder for recent activities and alerts
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

// POST /api/migrate - Trigger migration process
app.post('/api/migrate', async (req, res) => {
  try {
    console.log('🚀 Starting migration from API...');
    await generateDummyData();
    console.log('✅ Migration completed successfully!');
    res.json({ message: 'Migration completed successfully!' });
  } catch (err) {
    console.error('❌ Migration error:', err);
    res.status(500).json({ error: 'Migration failed: ' + err.message });
  }
});

// Seeding initial mine data (if needed)
const seedMines = async () => {
  try {
    const mineCount = await Mine.countDocuments();
    if (mineCount === 0) {
      const allMinesData = [
  // Jharkhand
  { name: 'Jharia, Dhanbad', location: 'Dhanbad', state: 'Jharkhand', coordinates: { lat: 23.75, lng: 86.42 } },
  { name: 'Bokaro', location: 'Bokaro', state: 'Jharkhand', coordinates: { lat: 23.78, lng: 85.82 } },
  { name: 'Jayanti', location: 'Jayanti', state: 'Jharkhand', coordinates: { lat: 23.7, lng: 86.6 } },
  { name: 'Godda', location: 'Godda', state: 'Jharkhand', coordinates: { lat: 24.83, lng: 87.21 } },
  { name: 'Giridih (Karbhari Coal Field)', location: 'Giridih', state: 'Jharkhand', coordinates: { lat: 24.18, lng: 86.3 } },
  { name: 'Ramgarh', location: 'Ramgarh', state: 'Jharkhand', coordinates: { lat: 23.63, lng: 85.51 } },
  { name: 'Karanpura', location: 'Karanpura', state: 'Jharkhand', coordinates: { lat: 23.7, lng: 85.25 } },
  { name: 'Daltonganj', location: 'Daltonganj', state: 'Jharkhand', coordinates: { lat: 24.03, lng: 84.07 } },
  
  // West Bengal
  { name: 'Raniganj Coalfield', location: 'Raniganj', state: 'West Bengal', coordinates: { lat: 23.6, lng: 87.12 } },
  { name: 'Dalingkot (Darjeeling)', location: 'Darjeeling', state: 'West Bengal', coordinates: { lat: 27.05, lng: 88.6 } },
  { name: 'Birbhum', location: 'Birbhum', state: 'West Bengal', coordinates: { lat: 23.9, lng: 87.6 } },
  { name: 'Chinakuri', location: 'Chinakuri', state: 'West Bengal', coordinates: { lat: 23.6, lng: 86.8 } },
  
  // Chhattisgarh
  { name: 'Korba', location: 'Korba', state: 'Chhattisgarh', coordinates: { lat: 22.35, lng: 82.68 } },
  { name: 'Bishrampur', location: 'Bishrampur', state: 'Chhattisgarh', coordinates: { lat: 23.18, lng: 83.18 } },
  { name: 'Sonhat', location: 'Sonhat', state: 'Chhattisgarh', coordinates: { lat: 23.5, lng: 82.5 } },
  { name: 'Jhilmil', location: 'Jhilmil', state: 'Chhattisgarh', coordinates: { lat: 23.3, lng: 83.2 } },
  { name: 'Hasdo-Arand', location: 'Hasdo-Arand', state: 'Chhattisgarh', coordinates: { lat: 22.8, lng: 82.8 } },
  
  // Odisha
  { name: 'Jharsuguda', location: 'Jharsuguda', state: 'Odisha', coordinates: { lat: 21.85, lng: 84.03 } },
  { name: 'Himgiri', location: 'Himgiri', state: 'Odisha', coordinates: { lat: 22.0, lng: 83.7 } },
  { name: 'Rampur', location: 'Rampur', state: 'Odisha', coordinates: { lat: 20.7, lng: 83.9 } },
  { name: 'Talcher', location: 'Talcher', state: 'Odisha', coordinates: { lat: 20.95, lng: 85.22 } },
  
  // Telangana/Andhra Pradesh
  { name: 'Singareni', location: 'Singareni', state: 'Telangana', coordinates: { lat: 17.5, lng: 80.3 } },
  { name: 'Kothagudem', location: 'Kothagudem', state: 'Telangana', coordinates: { lat: 17.55, lng: 80.63 } },
  { name: 'Kantapalli', location: 'Kantapalli', state: 'Andhra Pradesh', coordinates: { lat: 17.4, lng: 81.9 } },
  
  // Tamil Nadu
  { name: 'Neyveli', location: 'Neyveli', state: 'Tamil Nadu', coordinates: { lat: 11.53, lng: 79.48 } },
  
  // Maharashtra
  { name: 'Kamptee (Nagpur)', location: 'Nagpur', state: 'Maharashtra', coordinates: { lat: 21.25, lng: 79.18 } },
  { name: 'Wun field', location: 'Wun', state: 'Maharashtra', coordinates: { lat: 20.0, lng: 79.0 } },
  { name: 'Wardha', location: 'Wardha', state: 'Maharashtra', coordinates: { lat: 20.74, lng: 78.6 } },
  { name: 'Ghughus', location: 'Ghughus', state: 'Maharashtra', coordinates: { lat: 19.93, lng: 79.13 } },
  { name: 'Warora', location: 'Warora', state: 'Maharashtra', coordinates: { lat: 20.23, lng: 79.0 } },
  
  // Assam
  { name: 'Ledo', location: 'Ledo', state: 'Assam', coordinates: { lat: 27.29, lng: 95.73 } },
  { name: 'Makum', location: 'Makum', state: 'Assam', coordinates: { lat: 27.3, lng: 95.7 } },
  { name: 'Najira', location: 'Najira', state: 'Assam', coordinates: { lat: 26.9, lng: 94.7 } },
  { name: 'Janji', location: 'Janji', state: 'Assam', coordinates: { lat: 26.7, lng: 94.3 } },
  { name: 'Jaipur', location: 'Jaipur', state: 'Assam', coordinates: { lat: 27.2, lng: 95.5 } },
  
  // Meghalaya
  { name: 'Darrangiri (Garo hills)', location: 'Garo Hills', state: 'Meghalaya', coordinates: { lat: 25.5, lng: 90.7 } },
  { name: 'Cherrapunji', location: 'Cherrapunji', state: 'Meghalaya', coordinates: { lat: 25.3, lng: 91.7 } },
  { name: 'Liotryngew', location: 'Liotryngew', state: 'Meghalaya', coordinates: { lat: 25.3, lng: 91.7 } },
  { name: 'Maolong', location: 'Maolong', state: 'Meghalaya', coordinates: { lat: 25.2, lng: 91.7 } },
  { name: 'Langrin coalfields (Khasi & Jaintia Hills)', location: 'Khasi & Jaintia Hills', state: 'Meghalaya', coordinates: { lat: 25.3, lng: 91.6 } },
  
  // Madhya Pradesh
  { name: 'Singrauli', location: 'Singrauli', state: 'Madhya Pradesh', coordinates: { lat: 24.2, lng: 82.67 } },
  { name: 'Sohagpur', location: 'Sohagpur', state: 'Madhya Pradesh', coordinates: { lat: 23.3, lng: 78.2 } },
  { name: 'Johila', location: 'Johila', state: 'Madhya Pradesh', coordinates: { lat: 23.3, lng: 81.0 } },
  { name: 'Umaria', location: 'Umaria', state: 'Madhya Pradesh', coordinates: { lat: 23.5, lng: 80.8 } },
  { name: 'Satpura coalfield', location: 'Satpura', state: 'Madhya Pradesh', coordinates: { lat: 22.2, lng: 78.1 } },
];
      await Mine.insertMany(allMinesData);
      console.log('✅ Mines seeded!');
    }
  } catch (err) {
    console.error('❌ Error seeding mines:', err);
  }
};

app.listen(port, async () => {
  console.log(`🚀 Server is running on port ${port}`);
  await seedMines();
});
