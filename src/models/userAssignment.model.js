const mongoose = require('mongoose');

const userAssignmentSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    index: true
  },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device', 
    required: true,
    index: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { 
  timestamps: true,
  index: [{ userId: 1, deviceId: 1 }, { unique: true }] 
});

module.exports = mongoose.model('UserAssignment', userAssignmentSchema);
