const express = require('express');
const User = require('../models/user.model');
const Device = require('../models/device.model');
const { auth, adminAuth } = require('../middleware/auth.middleware');
const mongoose = require('mongoose');

const router = express.Router();

// Create new user (admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, email, password, isAdmin, parentUserId } = req.body;

    // Check if user with email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // If parentUserId is provided, verify parent user exists
    let parentUser = null;
    if (parentUserId) {
      parentUser = await User.findById(parentUserId);
      if (!parentUser) {
        return res.status(404).json({ message: 'Parent user not found' });
      }
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      isAdmin: isAdmin || false,
      parentUser: parentUserId
    });

    await user.save();

    // If parent user exists, add this user to parent's subUsers
    if (parentUser) {
      parentUser.subUsers.push(user._id);
      await parentUser.save();
    }

    // Return created user without password
    const createdUser = await User.findById(user._id).select('-password');
    res.status(201).json(createdUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
});

// Get all users (admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('parentUser', 'name email')
      .populate('subUsers', 'name email');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Get user by ID (admin only)
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('assignedDevices');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// Assign device to user
router.post('/:id/devices/:deviceId', adminAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    const deviceId = req.params.deviceId;

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    // Validate device ID
    if (!mongoose.Types.ObjectId.isValid(deviceId)) {
      return res.status(400).json({ message: 'Invalid device ID format' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if device exists
    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Update device's assignedUserId
    device.assignedUserId = userId;
    await device.save();

    // Add device to user's assignedDevices if not already present
    if (!user.assignedDevices.includes(deviceId)) {
      user.assignedDevices.push(deviceId);
      await user.save();
    }

    // Return updated user with populated devices
    const updatedUser = await User.findById(userId)
      .select('-password')
      .populate('assignedDevices');

    res.json(updatedUser);
  } catch (error) {
    console.error('Error assigning device:', error);
    res.status(500).json({ message: 'Error assigning device' });
  }
});

// Remove device from user
router.delete('/:id/devices/:deviceId', adminAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    const deviceId = req.params.deviceId;

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    // Validate device ID
    if (!mongoose.Types.ObjectId.isValid(deviceId)) {
      return res.status(400).json({ message: 'Invalid device ID format' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if device exists
    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Remove device from user's assignedDevices
    user.assignedDevices = user.assignedDevices.filter(id => id.toString() !== deviceId);
    await user.save();

    // Clear device's assignedUserId
    device.assignedUserId = null;
    await device.save();

    res.json({ message: 'Device removed successfully' });
  } catch (error) {
    console.error('Error removing device:', error);
    res.status(500).json({ message: 'Error removing device' });
  }
});

// Update user (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password; // Prevent password update through this route
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user' });
  }
});

// Delete user (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// Update user profile (authenticated user)
router.put('/profile/update', auth, async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password; // Prevent password update through this route
    delete updates.isAdmin; // Prevent admin status update through this route
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Change password (authenticated user)
router.put('/profile/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating password' });
  }
});

// Get sub-users for a specific user
router.get('/:userId/sub-users', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if the requesting user has permission
    if (req.user._id.toString() !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view these sub-users'
      });
    }

    // Find all users where parentUser matches the given userId
    const subUsers = await User.find({ parentUser: userId })
      .select('-password')
      .lean();

    res.json({
      status: 'success',
      data: subUsers
    });
  } catch (error) {
    console.error('Error fetching sub-users:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Create a new sub-user
router.post('/:userId/sub-users', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, password } = req.body;

    // Check if the requesting user has permission
    if (req.user._id.toString() !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to create sub-users'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already registered'
      });
    }

    // Create new sub-user
    const subUser = new User({
      name,
      email,
      password,
      parentUser: userId,
      isAdmin: false
    });

    await subUser.save();

    // Return user without password
    const userResponse = subUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      status: 'success',
      data: userResponse
    });
  } catch (error) {
    console.error('Error creating sub-user:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Delete a sub-user
router.delete('/:userId/sub-users/:subUserId', auth, async (req, res) => {
  try {
    const { userId, subUserId } = req.params;

    // Check if the requesting user has permission
    if (req.user._id.toString() !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete sub-users'
      });
    }

    // Find and delete the sub-user
    const subUser = await User.findOneAndDelete({
      _id: subUserId,
      parentUser: userId
    });

    if (!subUser) {
      return res.status(404).json({
        status: 'error',
        message: 'Sub-user not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Sub-user deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sub-user:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Bulk assign devices to user
router.post('/:userId/assign-devices', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { userId } = req.params;
    const { deviceIds } = req.body;

    // Validate input
    if (!deviceIds || !Array.isArray(deviceIds) || deviceIds.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid device IDs provided'
      });
    }

    // Validate all IDs are valid MongoDB IDs
    const invalidIds = deviceIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid device IDs',
        invalidIds
      });
    }

    // Check user exists
    const user = await User.findById(userId).session(session);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Get available devices
    const availableDevices = await Device.find({
      _id: { $in: deviceIds },
      $or: [
        { assignedTo: { $exists: false } },
        { assignedTo: null }
      ]
    }).session(session);

    if (availableDevices.length !== deviceIds.length) {
      const assignedDevices = deviceIds.filter(id => 
        !availableDevices.some(d => d._id.toString() === id)
      );
      return res.status(400).json({
        success: false,
        message: 'Some devices are already assigned',
        assignedDevices
      });
    }

    // Assign devices
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { assignedDevices: { $each: deviceIds } } },
      { session }
    );

    await Device.updateMany(
      { _id: { $in: deviceIds } },
      { $set: { assignedTo: userId } },
      { session }
    );

    await session.commitTransaction();
    res.json({ 
      success: true,
      message: 'Devices assigned successfully',
      count: deviceIds.length
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Bulk assignment error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during device assignment'
    });
  } finally {
    session.endSession();
  }
});

module.exports = router; 