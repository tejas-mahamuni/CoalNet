
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
  serverSelectionTimeoutMS: 30000 // 30 second timeout
    });
    
    console.log('✅ MongoDB connected successfully!');
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('\n💡 Make sure:');
    console.error('   1. MongoDB is running (check MongoDB Compass or service)');
    console.error('   2. MONGODB_URI is set in .env file');
    console.error('   3. Connection string format is correct');
    console.error('\n   Example connection string:');
    console.error('   mongodb://localhost:27017/coalnet');
    console.error('   or');
    console.error('   mongodb+srv://username:password@cluster.mongodb.net/coalnet');
    process.exit(1);
  }
};

connectDB();

// MongoDB connection event handlers
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

// Define schemas
const dataSchema = new mongoose.Schema({
  name: String,
  data: mongoose.Schema.Types.Mixed,
});

// Mine Schema
const mineSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  location: { type: String, required: true },
  state: { type: String, required: true },
  coordinates: {
    lat: Number,
    lng: Number
  },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

// Emission Schema
const emissionSchema = new mongoose.Schema({
  mineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mine', required: true },
  mineName: { type: String, required: true },
  date: { type: Date, required: true },
  period: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
  scope1: { type: Number, default: 0 }, // Direct emissions
  scope2: { type: Number, default: 0 }, // Indirect emissions (electricity)
  scope3: { type: Number, default: 0 }, // Other indirect emissions
  totalEmissions: { type: Number, required: true },
  fuelConsumption: { type: Number, default: 0 },
  electricityUsage: { type: Number, default: 0 },
  methaneEmission: { type: Number, default: 0 },
  transportEmissions: { type: Number, default: 0 },
  targetEmissions: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'pending', 'verified'], default: 'draft' },
  uploadedBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create models
const Data = mongoose.model('Data', dataSchema);
const Mine = mongoose.model('Mine', mineSchema);
const Emission = mongoose.model('Emission', emissionSchema);

// Sample data for visualization
const visualizationData = [
  {
    name: 'lineChart',
    data: {
      labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
      datasets: [
        {
          label: 'Coal Production (in tons)',
          data: [65, 59, 80, 81, 56, 55, 40],
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
        },
      ],
    },
  },
  {
    name: 'barChart',
    data: {
      labels: ['Jharia', 'Raniganj', 'Talcher', 'Singrauli', 'Neyveli'],
      datasets: [
        {
          label: 'Reserve (in million tons)',
          data: [19400, 12200, 38650, 22300, 6460],
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(153, 102, 255, 0.2)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1,
        },
      ],
    },
  },
];

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// API endpoint to get data
app.get('/api/data', async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const lineChart = await Data.findOne({ name: 'lineChart' });
    const barChart = await Data.findOne({ name: 'barChart' });
    
    if (!lineChart || !barChart) {
      return res.status(404).json({ error: 'Data not found. Please wait for database seeding.' });
    }

    res.json({ lineChart: lineChart.data, barChart: barChart.data });
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all mines
app.get('/api/mines', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const mines = await Mine.find({ status: 'active' }).select('name location state coordinates').sort({ name: 1 });
    res.json(mines);
  } catch (err) {
    console.error('Error fetching mines:', err);
    res.status(500).json({ error: err.message });
  }
});

// Dashboard API with filters
app.get('/api/dashboard', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const { mineId, mineName, period, startDate, endDate } = req.query;

    // Build query filters
    const emissionQuery = {};
    if (mineId) {
      emissionQuery.mineId = mineId;
    }
    if (mineName && mineName !== 'all') {
      // Exact match for mineName (names are stored exactly as in database)
      emissionQuery.mineName = mineName;
    }
    if (period && period !== 'all') {
      emissionQuery.period = period;
    }

    // Date range filter
    if (startDate || endDate) {
      emissionQuery.date = {};
      if (startDate) emissionQuery.date.$gte = new Date(startDate);
      if (endDate) emissionQuery.date.$lte = new Date(endDate);
    }

    // Calculate overview metrics
    const totalMines = await Mine.countDocuments({ status: 'active' });
    const activeMines = totalMines;
    
    // Get all emissions matching the query (without limit for accurate totals)
    const allEmissions = await Emission.find(emissionQuery);
    
    // Get recent emissions for activities (with limit)
    const emissions = await Emission.find(emissionQuery)
      .sort({ date: -1 })
      .limit(100);
    
    const totalEmissions = allEmissions.reduce((sum, e) => sum + (e.totalEmissions || 0), 0);
    
    // Calculate average target reduction
    const emissionsWithTarget = allEmissions.filter(e => e.targetEmissions > 0);
    const avgReduction = emissionsWithTarget.length > 0
      ? emissionsWithTarget.reduce((sum, e) => {
          const reduction = ((e.targetEmissions - e.totalEmissions) / e.targetEmissions) * 100;
          return sum + Math.max(0, reduction);
        }, 0) / emissionsWithTarget.length
      : 0;

    // Monthly emissions trend (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const monthlyEmissions = await Emission.aggregate([
      { $match: { ...emissionQuery, date: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { 
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalEmissions: { $sum: '$totalEmissions' },
          avgTarget: { $avg: '$targetEmissions' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = monthlyEmissions.map(item => ({
      month: monthNames[item._id.month - 1],
      emissions: Math.round(item.totalEmissions),
      target: Math.round(item.avgTarget || 1000)
    }));

    // Scope breakdown
    const scopeBreakdown = await Emission.aggregate([
      { $match: emissionQuery },
      {
        $group: {
          _id: null,
          scope1: { $sum: '$scope1' },
          scope2: { $sum: '$scope2' },
          scope3: { $sum: '$scope3' }
        }
      }
    ]);

    const scopeData = scopeBreakdown[0] || { scope1: 0, scope2: 0, scope3: 0 };
    const scopeTotal = scopeData.scope1 + scopeData.scope2 + scopeData.scope3;
    
    // Only show scopes with data, or show empty state if no data
    let scopeBreakdownData = [];
    if (scopeTotal > 0) {
      scopeBreakdownData = [
        { name: 'Scope 1', value: Math.round(scopeData.scope1), color: '#3B82F6' },
        { name: 'Scope 2', value: Math.round(scopeData.scope2), color: '#10B981' },
        { name: 'Scope 3', value: Math.round(scopeData.scope3), color: '#F59E0B' }
      ].filter(item => item.value > 0);
    }

    // Recent activities
    const recentActivities = await Emission.find(emissionQuery)
      .sort({ date: -1 })
      .limit(10)
      .select('mineName date status createdAt')
      .lean();

    const activities = recentActivities.map(e => {
      const typeMap = {
        'Fuel Consumption': 'Fuel Consumption',
        'Electricity': 'Electricity',
        'Transport': 'Transport',
        'Equipment': 'Equipment'
      };
      
      return {
        id: e._id,
        type: 'Emission Data', // You can customize this based on your data
        mine: e.mineName,
        date: e.date.toISOString().split('T')[0],
        status: e.status || 'draft'
      };
    });

    // Alerts (mock for now - you can customize based on your logic)
    const alerts = [];
    if (allEmissions.length > 0) {
      // Find the latest emission record
      const sortedEmissions = [...allEmissions].sort((a, b) => new Date(b.date) - new Date(a.date));
      const latestEmission = sortedEmissions[0];
      if (latestEmission.targetEmissions && latestEmission.totalEmissions > latestEmission.targetEmissions * 1.15) {
        alerts.push({
          id: 1,
          type: 'warning',
          message: `${latestEmission.mineName} exceeded target emissions by ${Math.round(((latestEmission.totalEmissions - latestEmission.targetEmissions) / latestEmission.targetEmissions) * 100)}%`,
          time: '2 hours ago'
        });
      }
    }
    
    // Debug logging
    console.log('Dashboard Query Debug:', {
      filters: emissionQuery,
      totalEmissionsCount: allEmissions.length,
      totalEmissions: totalEmissions,
      scopeBreakdownData: scopeBreakdownData.length > 0 ? scopeBreakdownData : 'No data'
    });

    // Build response
    const dashboardData = {
      overview: {
        totalMines,
        activeMines,
        totalEmissions: Math.round(totalEmissions),
        targetReduction: 15, // Default target
        currentReduction: Math.round(avgReduction * 10) / 10
      },
      monthlyEmissions: monthlyData.length > 0 ? monthlyData : [
        { month: 'Jul', emissions: 1200, target: 1000 },
        { month: 'Aug', emissions: 1350, target: 1000 },
        { month: 'Sep', emissions: 1180, target: 1000 },
        { month: 'Oct', emissions: 1420, target: 1000 },
        { month: 'Nov', emissions: 1380, target: 1000 },
        { month: 'Dec', emissions: 1250, target: 1000 }
      ],
      scopeBreakdown: scopeBreakdownData.length > 0 ? scopeBreakdownData : [
        // Show empty state with zero values when filtered data has no results
        { name: 'Scope 1', value: 0, color: '#3B82F6' },
        { name: 'Scope 2', value: 0, color: '#10B981' },
        { name: 'Scope 3', value: 0, color: '#F59E0B' }
      ],
      recentActivities: activities.length > 0 ? activities : [
        { id: 1, type: 'Fuel Consumption', mine: 'Mine A', date: '2024-01-15', status: 'verified' },
        { id: 2, type: 'Electricity', mine: 'Mine B', date: '2024-01-14', status: 'pending' },
        { id: 3, type: 'Transport', mine: 'Mine C', date: '2024-01-13', status: 'verified' }
      ],
      alerts: alerts.length > 0 ? alerts : [
        { id: 1, type: 'info', message: 'New data uploaded', time: '4 hours ago' },
        { id: 2, type: 'success', message: 'Mine A achieved monthly reduction target', time: '1 day ago' }
      ]
    };

    res.json(dashboardData);
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    res.status(500).json({ error: err.message });
  }
});

// All 45 mines from the map
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

// Seed initial data
const seedData = async () => {
  try {
    // Seed all 45 mines if the collection is empty
    const mineCount = await Mine.countDocuments();
    if (mineCount < allMinesData.length) {
      const existingMines = await Mine.find().select('name');
      const existingNames = existingMines.map(m => m.name);
      const missingMines = allMinesData.filter(m => !existingNames.includes(m.name));
      
      if (missingMines.length > 0) {
        const minesToInsert = missingMines.map(mine => ({
          ...mine,
          status: 'active'
        }));
        await Mine.insertMany(minesToInsert);
        console.log(`✅ Added ${missingMines.length} missing mines!`);
      }
    }

    // Clear existing emission data
    await Emission.deleteMany({});
    console.log('🧹 Cleared existing emission data.');

    // Seed emissions data - month-wise for all mines (last 12 months)
    const mines = await Mine.find();
    if (mines.length > 0) {
      const allEmissions = [];
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      
      const getEmissionBase = (mineIndex) => {
        if (mineIndex < 15) return 1500 + (mineIndex * 100) + Math.random() * 500;
        if (mineIndex < 30) return 1000 + ((mineIndex - 15) * 80) + Math.random() * 400;
        return 600 + ((mineIndex - 30) * 50) + Math.random() * 300;
      };

      mines.forEach((mine, mineIndex) => {
        for (let month = 0; month < 12; month++) {
          const date = new Date(twelveMonthsAgo);
          date.setMonth(date.getMonth() + month);
          date.setDate(1);
          
          const baseEmission = getEmissionBase(mineIndex);
          const seasonalFactor = [1.1, 1.05, 1.0, 0.95, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15, 1.1, 1.05][month];
          const monthlyEmission = baseEmission * seasonalFactor * (0.9 + Math.random() * 0.2);
          
          const scope1 = monthlyEmission * 0.55;
          const scope2 = monthlyEmission * 0.27;
          const scope3 = monthlyEmission * 0.18;
          
          const totalEmissions = Math.round(scope1 + scope2 + scope3);
          const targetEmissions = Math.round(totalEmissions * (0.85 + Math.random() * 0.1));
          
          allEmissions.push({
            mineId: mine._id,
            mineName: mine.name,
            date: date,
            period: 'monthly',
            scope1: Math.round(scope1),
            scope2: Math.round(scope2),
            scope3: Math.round(scope3),
            totalEmissions: totalEmissions,
            fuelConsumption: Math.round(scope1 * 0.6),
            electricityUsage: Math.round(scope2 * 1.2),
            methaneEmission: Math.round(scope1 * 0.4),
            transportEmissions: Math.round(scope3 * 0.5),
            targetEmissions: targetEmissions,
            status: month < 10 ? 'verified' : (month < 11 ? 'pending' : 'draft'),
            uploadedBy: 'system',
            createdAt: new Date(date.getTime() + 86400000),
            updatedAt: new Date()
          });
        }
      });

      const batchSize = 100;
      for (let i = 0; i < allEmissions.length; i += batchSize) {
        const batch = allEmissions.slice(i, i + batchSize);
        await Emission.insertMany(batch);
      }
      
      console.log(`✅ ${allEmissions.length} monthly emission records seeded for ${mines.length} mines!`);
      console.log(`   Data range: ${twelveMonthsAgo.toLocaleDateString()} to ${new Date().toLocaleDateString()}`);
    }

    // Seed visualization data if empty
    const count = await Data.countDocuments();
    if (count === 0) {
      await Data.insertMany(visualizationData);
      console.log('✅ Visualization data seeded!');
    }
  } catch (err) {
    console.error('❌ Error seeding database:', err);
  }
};

// Start the server
app.listen(port, async () => {
  console.log(`🚀 Server is running on port ${port}`);
  console.log(`📊 API endpoints available at http://localhost:${port}/api`);

  // Seed initial data
  await seedData();
});
