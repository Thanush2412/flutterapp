const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Device = require('../models/device.model');
const { auth, adminAuth } = require('../middleware/auth.middleware');

// Helper function to validate and convert ObjectId
const validateObjectId = (id) => {
  if (!id) return null;
  try {
    return mongoose.Types.ObjectId(id);
  } catch (error) {
    return null;
  }
};

// Debug middleware to log all requests
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Get all devices (admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    console.log('=== GET /api/devices ===');
    console.log('User:', req.user.email);
    
    const devices = await Device.find().populate('assignedUserId', 'name email');
    console.log(`Found ${devices.length} devices`);
    
    // Transform the response
    const transformedDevices = devices.map(device => {
      const deviceObj = device.toJSON();
      console.log('Transformed device:', deviceObj);
      return deviceObj;
    });

    console.log('Sending response with', transformedDevices.length, 'devices');
    res.json(transformedDevices);
  } catch (error) {
    console.error('Error in GET /api/devices:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Error fetching devices',
      error: error.message
    });
  }
});

// Get user's assigned devices
router.get('/my-devices', auth, async (req, res) => {
  try {
    console.log('=== GET /api/devices/my-devices ===');
    console.log('User:', req.user.email);
    
    const devices = await Device.find({ assignedUserId: req.user._id })
      .populate('assignedUserId', 'name email');
    console.log(`Found ${devices.length} devices for user`);
    
    // Transform the response
    const transformedDevices = devices.map(device => {
      const deviceObj = device.toJSON();
      console.log('Transformed device:', deviceObj);
      return deviceObj;
    });

    console.log('Sending response with', transformedDevices.length, 'devices');
    res.json(transformedDevices);
  } catch (error) {
    console.error('Error in GET /api/devices/my-devices:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Error fetching devices',
      error: error.message
    });
  }
});

// Bulk import devices (admin only) - MUST be before /:id route
router.post('/bulk-import', adminAuth, async (req, res) => {
  try {
    console.log('=== POST /api/devices/bulk-import ===');
    console.log('User:', req.user.email);
    console.log('Request body:', req.body);

    const { devices } = req.body;

    if (!Array.isArray(devices)) {
      return res.status(400).json({ 
        message: 'Invalid request format. Expected an array of devices.' 
      });
    }

    // Validate each device
    const validationErrors = [];
    devices.forEach((device, index) => {
      if (!device.deviceId || !device.name || !device.type || !device.macAddress || !device.location) {
        validationErrors.push(`Device at index ${index} is missing required fields`);
      }
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }

    // Check for duplicate deviceIds
    const deviceIds = devices.map(d => d.deviceId);
    const existingDevices = await Device.find({ deviceId: { $in: deviceIds } });
    if (existingDevices.length > 0) {
      return res.status(400).json({ 
        message: 'Some deviceIds already exist', 
        existingDevices: existingDevices.map(d => d.deviceId) 
      });
    }

    // Create devices
    const createdDevices = await Device.insertMany(devices);
    console.log(`Created ${createdDevices.length} devices`);

    // Transform the response
    const transformedDevices = createdDevices.map(device => device.toJSON());
    console.log('Transformed devices:', transformedDevices);

    res.status(201).json({
      message: `Successfully imported ${createdDevices.length} devices`,
      devices: transformedDevices
    });
  } catch (error) {
    console.error('Error in bulk import:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Error importing devices',
      error: error.message
    });
  }
});

// Get device by ID
router.get('/:id', auth, async (req, res) => {
  try {
    console.log(`=== GET /api/devices/${req.params.id} ===`);
    console.log('User:', req.user.email);
    
    const device = await Device.findById(req.params.id).populate('assignedUserId', 'name email');
    if (!device) {
      console.log('Device not found');
      return res.status(404).json({ message: 'Device not found' });
    }

    console.log('Device found:', {
      id: device.id,
      deviceId: device.deviceId,
      name: device.name,
      status: device.status
    });

    const transformedDevice = device.toJSON();
    console.log('Transformed device:', transformedDevice);
    res.json(transformedDevice);
  } catch (error) {
    console.error(`Error in GET /api/devices/${req.params.id}:`, error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Error fetching device',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Create new device (admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    console.log('=== POST /api/devices ===');
    console.log('User:', req.user.email);
    console.log('Request body:', req.body);

    // Convert assignedUserId to ObjectId if provided
    if (req.body.assignedUserId) {
      const objectId = validateObjectId(req.body.assignedUserId);
      if (!objectId) {
        return res.status(400).json({ 
          message: 'Invalid assignedUserId format',
          value: req.body.assignedUserId
        });
      }
      req.body.assignedUserId = objectId;
    }

    const device = new Device(req.body);
    await device.save();
    
    console.log('Device created:', {
      id: device.id,
      deviceId: device.deviceId,
      name: device.name,
      status: device.status
    });

    const transformedDevice = device.toJSON();
    console.log('Transformed device:', transformedDevice);
    res.status(201).json(transformedDevice);
  } catch (error) {
    console.error('Error in POST /api/devices:', error);
    console.error('Stack trace:', error.stack);
    res.status(400).json({ 
      message: 'Error creating device',
      error: error.message
    });
  }
});

// Update device (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    console.log(`=== PUT /api/devices/${req.params.id} ===`);
    console.log('User:', req.user.email);
    console.log('Request body:', req.body);

    // Validate device ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        message: 'Invalid device ID format',
        value: req.params.id
      });
    }

    // Convert assignedUserId to ObjectId if provided
    if (req.body.assignedUserId) {
      const objectId = validateObjectId(req.body.assignedUserId);
      if (!objectId) {
        return res.status(400).json({ 
          message: 'Invalid assignedUserId format',
          value: req.body.assignedUserId
        });
      }
      req.body.assignedUserId = objectId;
    }

    const device = await Device.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('assignedUserId', 'name email');

    if (!device) {
      console.log('Device not found');
      return res.status(404).json({ message: 'Device not found' });
    }

    console.log('Device updated:', {
      id: device.id,
      deviceId: device.deviceId,
      name: device.name,
      status: device.status
    });

    const transformedDevice = device.toJSON();
    console.log('Transformed device:', transformedDevice);
    res.json(transformedDevice);
  } catch (error) {
    console.error(`Error in PUT /api/devices/${req.params.id}:`, error);
    console.error('Stack trace:', error.stack);
    res.status(400).json({ 
      message: 'Error updating device',
      error: error.message
    });
  }
});

// Delete device (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    console.log(`=== DELETE /api/devices/${req.params.id} ===`);
    console.log('User:', req.user.email);

    // Validate device ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        message: 'Invalid device ID format',
        value: req.params.id
      });
    }

    const device = await Device.findByIdAndDelete(req.params.id);
    if (!device) {
      console.log('Device not found');
      return res.status(404).json({ message: 'Device not found' });
    }

    console.log('Device deleted:', {
      id: device.id,
      deviceId: device.deviceId,
      name: device.name
    });

    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    console.error(`Error in DELETE /api/devices/${req.params.id}:`, error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Error deleting device',
      error: error.message
    });
  }
});

// Add reading to device
router.post('/:id/readings', auth, async (req, res) => {
  try {
    console.log(`=== POST /api/devices/${req.params.id}/readings ===`);
    console.log('User:', req.user.email);
    console.log('Request body:', req.body);

    const { temperature, humidity } = req.body;
    const device = await Device.findById(req.params.id);
    
    if (!device) {
      console.log('Device not found');
      return res.status(404).json({ message: 'Device not found' });
    }

    await device.addReading(temperature, humidity);
    console.log('Reading added successfully');

    const transformedDevice = device.toJSON();
    console.log('Transformed device:', transformedDevice);
    res.json(transformedDevice);
  } catch (error) {
    console.error(`Error in POST /api/devices/${req.params.id}/readings:`, error);
    console.error('Stack trace:', error.stack);
    res.status(400).json({ 
      message: 'Error adding reading',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get device readings
router.get('/:id/readings', auth, async (req, res) => {
  try {
    console.log(`=== GET /api/devices/${req.params.id}/readings ===`);
    console.log('User:', req.user.email);
    console.log('Query params:', req.query);

    const device = await Device.findById(req.params.id);
    
    if (!device) {
      console.log('Device not found');
      return res.status(404).json({ message: 'Device not found' });
    }

    const limit = parseInt(req.query.limit) || 10;
    const readings = device.getLatestReadings(limit);
    console.log(`Found ${readings.length} readings`);

    res.json(readings);
  } catch (error) {
    console.error(`Error in GET /api/devices/${req.params.id}/readings:`, error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Error fetching readings',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router; 