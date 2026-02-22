const mongoose = require('mongoose');

const forecastSchema = new mongoose.Schema({
  mine_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Mine', required: true },
  mine_name: { type: String, required: true },
  generated_at: { type: Date, default: Date.now },
  expires_at: { type: Date, required: true },
  horizon_days: { type: Number, required: true, enum: [7, 14, 30] },
  forecast_data: [{
    date: { type: String, required: true },
    predicted: { type: Number, required: true },
    upper_bound: { type: Number, required: true },
    lower_bound: { type: Number, required: true },
  }],
  model_params: {
    order: [Number],
    aic: Number,
  },
  model_accuracy: {
    mae: Number,
    rmse: Number,
  },
  data_points_used: { type: Number },
});

// TTL index: auto-delete expired forecasts
forecastSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

// Compound index for cache lookups
forecastSchema.index({ mine_id: 1, horizon_days: 1 });

module.exports = mongoose.models.Forecast || mongoose.model('Forecast', forecastSchema);
