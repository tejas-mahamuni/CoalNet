
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000 // 30 second timeout
})
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.log(err));

// Define a schema for our data
const dataSchema = new mongoose.Schema({
  name: String,
  data: mongoose.Schema.Types.Mixed,
});

// Create a model
const Data = mongoose.model('Data', dataSchema);

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

// API endpoint to get data
app.get('/api/data', async (req, res) => {
  try {
    const lineChart = await Data.findOne({ name: 'lineChart' });
    const barChart = await Data.findOne({ name: 'barChart' });
    res.json({ lineChart: lineChart.data, barChart: barChart.data });
  } catch (err) {
    res.status(500).send(err);
  }
});

// Start the server
app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);

  // Check if data already exists
  const count = await Data.countDocuments();
  if (count === 0) {
    console.log('No data found. Seeding database...');
    Data.insertMany(visualizationData)
      .then(() => console.log('Database seeded!'))
      .catch(err => console.log('Error seeding database:', err));
  }
});
