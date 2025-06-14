const Device = require('../models/device.model');
const mongoose = require('mongoose');

class DeviceService {
  static async getAvailableDevices(deviceIds, session = null) {
    return Device.find({
      _id: { $in: deviceIds },
      assignedTo: { $exists: false }
    }).session(session);
  }

  static async assignDevices(deviceIds, userId, session = null) {
    return Device.updateMany(
      { _id: { $in: deviceIds } },
      { $set: { assignedTo: userId } },
      { session }
    );
  }

  static async unassignDevices(deviceIds, userId, session = null) {
    return Device.updateMany(
      { _id: { $in: deviceIds }, assignedTo: userId },
      { $unset: { assignedTo: 1 } },
      { session }
    );
  }

  // Add more device-related methods as needed
}

module.exports = DeviceService;
