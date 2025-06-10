const express = require('express');
const User = require('../models/user.model');
const Device = require('../models/device.model');
const { auth, adminAuth } = require('../middleware/auth.middleware');
const mongoose = require('mongoose');

const router = express.Router();

// Get all users (admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
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

module.exports = router; 