const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const config = require('../config/config');

const auth = async (req, res, next) => {
  try {
    console.log('Auth middleware - Headers:', req.headers);
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Auth middleware - Token:', token);
    
    if (!token) {
      console.log('Auth middleware - No token provided');
      throw new Error();
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    console.log('Auth middleware - Decoded token:', decoded);
    
    const user = await User.findOne({ _id: decoded.userId });
    console.log('Auth middleware - Found user:', user ? 'Yes' : 'No');

    if (!user) {
      console.log('Auth middleware - User not found');
      throw new Error();
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware - Error:', error);
    res.status(401).json({ message: 'Please authenticate.' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role === 'admin' || req.user.role === 'super-admin') {
        return next();
      }
      res.status(403).json({ message: 'Admin access required' });
    });
  } catch (error) {
    console.error('Admin auth - Error:', error);
    res.status(401).json({ message: 'Please authenticate.' });
  }
};

function superAdminAuth(req, res, next) {
  if (req.user.role === 'super-admin') {
    return next();
  }
  res.status(403).json({ message: 'Super admin access required' });
}

module.exports = {
  auth,
  adminAuth,
  superAdminAuth
};