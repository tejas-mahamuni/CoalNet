const mongoose = require('mongoose');

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

module.exports = mongoose.models.Mine || mongoose.model('Mine', mineSchema);
