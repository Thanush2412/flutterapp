const mongoose = require('mongoose');

exports.validateDeviceAssignment = async (req, res, next) => {
  try {
    const { deviceIds } = req.body;
    
    // Validate device IDs format
    if (!deviceIds || !Array.isArray(deviceIds)) {
      return res.status(400).json({ 
        success: false,
        message: 'Device IDs must be provided as an array'
      });
    }
    
    // Validate each ID
    const invalidIds = deviceIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid device IDs',
        invalidIds
      });
    }
    
    // Validate at least one device
    if (deviceIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one device must be provided'
      });
    }
    
    next();
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Validation failed'
    });
  }
};
