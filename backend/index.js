
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
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

const Mine = mongoose.model('Mine', mineSchema);

// New Daily Emission Schema for mine-specific collections
const dailyEmissionSchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true },
  fuel_used: { type: Number, required: true },
  electricity_used: { type: Number, required: true },
  explosives_used: { type: Number, required: true },
  transport_fuel_used: { type: Number, required: true },
  methane_emissions: { type: Number, required: true },
  carbon_emissions: { type: Number, required: true },
  scope1: { type: Number, required: true },
  scope2: { type: Number, required: true },
  scope3: { type: Number, required: true },
  total_emissions: { type: Number, required: true },
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

    // Emission Calculations
    const fuel_co2e = parseFloat(fuel_used) * 2.68;
    const explosives_co2e = parseFloat(explosives_used) * 0.5;
    const electricity_co2e = parseFloat(electricity_used) * 0.82;
    const transport_co2e = parseFloat(transport_fuel_used) * 2.68;
    const methane_emissions_ch4 = parseFloat(fuel_used) * 0.02;
    const methane_emissions_co2e = methane_emissions_ch4 * 25;

    const scope1 = fuel_co2e + explosives_co2e + methane_emissions_co2e;
    const scope2 = electricity_co2e;
    const scope3 = transport_co2e;
    const carbon_emissions = fuel_co2e + explosives_co2e + transport_co2e + electricity_co2e;
    const total_emissions = scope1 + scope2 + scope3;

    const MineEmission = getMineEmissionModel(mine.name);

    const newEmission = new MineEmission({
      date,
      fuel_used: parseFloat(fuel_used),
      electricity_used: parseFloat(electricity_used),
      explosives_used: parseFloat(explosives_used),
      transport_fuel_used: parseFloat(transport_fuel_used),
      methane_emissions: methane_emissions_co2e,
      carbon_emissions,
      scope1,
      scope2,
      scope3,
      total_emissions,
    });

    await newEmission.save();
    res.status(201).json(newEmission);
  } catch (err) {
    if (err.code === 11000) { // Handle duplicate date entry
      return res.status(409).json({ error: 'Emission data for this date already exists for this mine.' });
    }
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

    if (!mineName) {
      return res.status(400).json({ error: 'mineName query parameter is required' });
    }

    let data = [];
    const today = new Date();
    let startDate = new Date();

    if (mineName === 'all') {
      // Aggregation for all mines is a complex operation and will be implemented in a future update.
      return res.status(501).json({ message: 'Aggregation for all mines is not yet implemented.' });
    } else {
      const MineEmission = getMineEmissionModel(mineName);
      switch (period) {
        case 'daily':
          startDate.setDate(today.getDate() - 7);
          data = await MineEmission.find({ date: { $gte: startDate, $lte: today } }).sort({ date: 1 });
          break;
        case 'weekly':
          // Simplified: fetch last 4 weeks of daily data for now.
          startDate.setDate(today.getDate() - 28);
          data = await MineEmission.find({ date: { $gte: startDate, $lte: today } }).sort({ date: 1 });
          break;
        case 'monthly':
          // Simplified: fetch last 6 months of daily data for now.
          startDate.setMonth(today.getMonth() - 6);
          data = await MineEmission.find({ date: { $gte: startDate, $lte: today } }).sort({ date: 1 });
          break;
        default:
          return res.status(400).json({ error: 'Invalid period specified' });
      }
    }

    // Format data for the dashboard
    const chartData = data.map(item => ({
      date: item.date.toISOString().split('T')[0],
      totalEmissions: item.total_emissions,
      scope1: item.scope1,
      scope2: item.scope2,
      scope3: item.scope3,
    }));

    const scopeBreakdown = data.reduce((acc, item) => {
        acc.scope1 += item.scope1;
        acc.scope2 += item.scope2;
        acc.scope3 += item.scope3;
        return acc;
    }, { scope1: 0, scope2: 0, scope3: 0 });

    res.json({ 
        chartData, 
        scopeBreakdown: [
            { name: 'Scope 1', value: scopeBreakdown.scope1 },
            { name: 'Scope 2', value: scopeBreakdown.scope2 },
            { name: 'Scope 3', value: scopeBreakdown.scope3 },
        ]
    });

  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    res.status(500).json({ error: err.message });
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
