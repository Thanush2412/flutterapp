const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  macAddress: {
    type: String,
    required: true
  },
  timeStamp: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000)
  },
  temperature: {
    type: Number,
    default: 0
  },
  humidity: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    required: true
  },
  triggerTime: {
    type: Number,
    default: 900
  },
  readings: {
    type: Array,
    default: []
  },
  lastReading: {
    type: Date,
    default: Date.now
  },
  assignedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    validate: {
      validator: function(v) {
        return v === null || mongoose.Types.ObjectId.isValid(v);
      },
      message: props => `${props.value} is not a valid ObjectId!`
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      // Convert _id to id
      ret.id = ret._id;
      delete ret._id;
      
      // Remove version key
      delete ret.__v;
      
      // Ensure readings is always an array
      if (!ret.readings) {
        ret.readings = [];
      }
      
      // Ensure lastReading is a valid date string
      if (ret.lastReading) {
        ret.lastReading = new Date(ret.lastReading).toISOString();
      }
      
      // Ensure timeStamp is a number
      if (ret.timeStamp) {
        ret.timeStamp = Number(ret.timeStamp);
      }
      
      // Ensure temperature and humidity are numbers
      ret.temperature = Number(ret.temperature || 0);
      ret.humidity = Number(ret.humidity || 0);

      // Convert assignedUserId to string if it exists
      if (ret.assignedUserId) {
        ret.assignedUserId = ret.assignedUserId.toString();
      }
      
      return ret;
    }
  }
});

// Add index for faster queries
deviceSchema.index({ deviceId: 1 });
deviceSchema.index({ assignedUserId: 1 });

// Pre-save middleware to validate ObjectId
deviceSchema.pre('save', function(next) {
  if (this.assignedUserId && !mongoose.Types.ObjectId.isValid(this.assignedUserId)) {
    next(new Error('Invalid assignedUserId format'));
  }
  next();
});

// Add method to add a reading
deviceSchema.methods.addReading = async function(temperature, humidity) {
  this.readings.push({
    temperature,
    humidity,
    timestamp: new Date()
  });
  this.lastReading = new Date();
  this.temperature = temperature;
  this.humidity = humidity;
  this.timeStamp = Math.floor(Date.now() / 1000);
  return this.save();
};

// Add method to get latest readings
deviceSchema.methods.getLatestReadings = function(limit = 10) {
  return this.readings
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
};

const Device = mongoose.model('Device', deviceSchema);

module.exports = Device; 