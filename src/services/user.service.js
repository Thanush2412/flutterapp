const User = require('../models/user.model');
const mongoose = require('mongoose');

class UserService {
  static async addDevicesToUser(userId, deviceIds, session = null) {
    return User.findByIdAndUpdate(
      userId,
      { $addToSet: { assignedDevices: { $each: deviceIds } } },
      { session }
    );
  }

  static async removeDevicesFromUser(userId, deviceIds, session = null) {
    return User.findByIdAndUpdate(
      userId,
      { $pull: { assignedDevices: { $in: deviceIds } } },
      { session }
    );
  }

  static async getUserWithDevices(userId, session = null) {
    return User.findById(userId)
      .populate('assignedDevices')
      .session(session);
  }

  // Add more user-related methods as needed
}

module.exports = UserService;
