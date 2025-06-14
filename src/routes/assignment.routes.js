const express = require('express');
const UserAssignment = require('../models/userAssignment.model');
const { auth } = require('../middleware/auth.middleware');
const mongoose = require('mongoose');

const router = express.Router();

// Assign device to user
router.post('/', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { userId, deviceId } = req.body;
    
    const assignment = await UserAssignment.create([{
      userId,
      deviceId,
      assignedBy: req.user._id
    }], { session });
    
    await session.commitTransaction();
    res.status(201).json(assignment[0]);
  } catch (err) {
    await session.abortTransaction();
    
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'Device already assigned to user'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Assignment failed',
      error: err.message
    });
  } finally {
    session.endSession();
  }
});

// Get all assignments for a user
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const assignments = await UserAssignment.find({ userId: req.params.userId })
      .populate('deviceId', 'name type status')
      .populate('assignedBy', 'name email');
      
    res.json({ 
      success: true,
      data: assignments
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to get assignments'
    });
  }
});

// Unassign device from user
router.delete('/:assignmentId', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const assignment = await UserAssignment.findByIdAndDelete(
      req.params.assignmentId,
      { session }
    );
    
    if (!assignment) {
      return res.status(404).json({ 
        success: false,
        message: 'Assignment not found'
      });
    }
    
    await session.commitTransaction();
    res.json({ 
      success: true,
      message: 'Device unassigned successfully'
    });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ 
      success: false,
      message: 'Unassignment failed'
    });
  } finally {
    session.endSession();
  }
});

module.exports = router;
