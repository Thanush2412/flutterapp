const mongoose = require('mongoose');
const Device = require('../models/device.model');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const sampleDevices = [
  {
    deviceId: 'DVC001',
    macAddress: '48:27:E2:80:2D:F8',
    timeStamp: 1723470723,
    temperature: 28.93,
    humidity: 60.96,
    location: 'Endoscopy Room',
    triggerTime: 900,
    name: 'Endoscopy Device 1',
    type: 'Temperature Sensor',
    status: 'active'
  },
  {
    deviceId: 'DVC002',
    macAddress: '48:27:E2:80:2D:F9',
    timeStamp: 1723470724,
    temperature: 27.85,
    humidity: 58.32,
    location: 'Operation Theater',
    triggerTime: 900,
    name: 'OT Device 1',
    type: 'Temperature Sensor',
    status: 'active'
  },
  {
    deviceId: 'DVC003',
    macAddress: '48:27:E2:80:2D:FA',
    timeStamp: 1723470725,
    temperature: 29.12,
    humidity: 62.45,
    location: 'ICU Room 1',
    triggerTime: 900,
    name: 'ICU Device 1',
    type: 'Temperature Sensor',
    status: 'active'
  },
  {
    deviceId: 'DVC004',
    macAddress: '48:27:E2:80:2D:FB',
    timeStamp: 1723470726,
    temperature: 26.78,
    humidity: 55.67,
    location: 'Emergency Room',
    triggerTime: 900,
    name: 'ER Device 1',
    type: 'Temperature Sensor',
    status: 'active'
  },
  {
    deviceId: 'DVC005',
    macAddress: '48:27:E2:80:2D:FC',
    timeStamp: 1723470727,
    temperature: 28.45,
    humidity: 59.23,
    location: 'Laboratory',
    triggerTime: 900,
    name: 'Lab Device 1',
    type: 'Temperature Sensor',
    status: 'active'
  },
  {
    deviceId: 'DVC006',
    macAddress: '48:27:E2:80:2D:FD',
    timeStamp: 1723470728,
    temperature: 27.92,
    humidity: 57.89,
    location: 'X-Ray Room',
    triggerTime: 900,
    name: 'X-Ray Device 1',
    type: 'Temperature Sensor',
    status: 'active'
  },
  {
    deviceId: 'DVC007',
    macAddress: '48:27:E2:80:2D:FE',
    timeStamp: 1723470729,
    temperature: 28.67,
    humidity: 61.12,
    location: 'Pharmacy',
    triggerTime: 900,
    name: 'Pharmacy Device 1',
    type: 'Temperature Sensor',
    status: 'active'
  },
  {
    deviceId: 'DVC008',
    macAddress: '48:27:E2:80:2D:FF',
    timeStamp: 1723470730,
    temperature: 26.34,
    humidity: 54.78,
    location: 'Storage Room',
    triggerTime: 900,
    name: 'Storage Device 1',
    type: 'Temperature Sensor',
    status: 'active'
  },
  {
    deviceId: 'DVC009',
    macAddress: '48:27:E2:80:2D:F0',
    timeStamp: 1723470731,
    temperature: 29.45,
    humidity: 63.21,
    location: 'Ward 1',
    triggerTime: 900,
    name: 'Ward Device 1',
    type: 'Temperature Sensor',
    status: 'active'
  },
  {
    deviceId: 'DVC010',
    macAddress: '48:27:E2:80:2D:F1',
    timeStamp: 1723470732,
    temperature: 28.23,
    humidity: 60.45,
    location: 'Reception',
    triggerTime: 900,
    name: 'Reception Device 1',
    type: 'Temperature Sensor',
    status: 'active'
  }
];

async function createSampleDevices() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      retryWrites: true,
      w: 'majority'
    });
    console.log('Connected to MongoDB successfully');

    // Clear existing devices
    console.log('Clearing existing devices...');
    await Device.deleteMany({});
    console.log('Cleared existing devices');

    // Insert sample devices
    console.log('Creating sample devices...');
    const devices = await Device.insertMany(sampleDevices);
    console.log(`Successfully created ${devices.length} sample devices`);

    // Log each created device
    devices.forEach(device => {
      console.log(`Created device: ${device.deviceId} in ${device.location}`);
    });

  } catch (error) {
    console.error('Error creating sample devices:', error);
    if (error.name === 'MongoServerError') {
      console.error('MongoDB Error:', error.message);
    } else if (error.name === 'MongooseError') {
      console.error('Mongoose Error:', error.message);
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  }
}

// Run the script
createSampleDevices(); 