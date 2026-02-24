const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  uid: {
    type: String,
    unique: true,
    sparse: true // Allow multiple nulls/missing values
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String
  },
  role: {
    type: String,
    enum: ['observer', 'operator'],
    default: 'observer'
  },
  assignedMines: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mine'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
