const express = require('express');
const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

// Health check route
router.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router; 