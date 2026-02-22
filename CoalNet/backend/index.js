const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db.js');
const Mine = require('./models/Mine');

// Initialize app
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to Database
connectDB();

// Routes
const mineRoutes = require('./routes/mines');
const emissionRoutes = require('./routes/emissions');
const dashboardRoutes = require('./routes/dashboard');
const systemRoutes = require('./routes/system');
const forecastRoutes = require('./routes/forecast');

app.use('/api/mines', mineRoutes);
app.use('/api/emissions', emissionRoutes);
app.use('/api', dashboardRoutes); // handles /api/dashboard and /api/visualization
app.use('/api', systemRoutes);    // handles /api/upload, /api/export, /api/migrate
app.use('/api/forecast', forecastRoutes); // handles /api/forecast/:mineId

// Seeding initial mine data (maintained for startup)
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
        { name: 'Birbhum', location: 'Birbhum', state: 'West Bengal', coordinates: { lat: 23.9, lng: 87.6 } },
        { name: 'Korba', location: 'Korba', state: 'Chhattisgarh', coordinates: { lat: 22.35, lng: 82.68 } },
        { name: 'Singrauli', location: 'Singrauli', state: 'Madhya Pradesh', coordinates: { lat: 24.2, lng: 82.67 } },
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
