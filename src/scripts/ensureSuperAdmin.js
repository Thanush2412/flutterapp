const mongoose = require('mongoose');
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const config = require('../config/config');

async function ensureSuperAdmin() {
  try {
    // Check if super admin already exists
    const superAdmin = await User.findOne({ email: config.superAdmin.email });
    
    if (!superAdmin) {
      // Create super admin
      const hashedPassword = await bcrypt.hash(config.superAdmin.password, 10);
      
      await User.create({
        name: 'Super Admin',
        email: config.superAdmin.email,
        password: hashedPassword,
        role: 'super-admin',
        isVerified: true,
        isActive: true
      });
      
      console.log('Super admin created successfully');
    } else {
      console.log('Super admin already exists');
    }
  } catch (err) {
    console.error('Error ensuring super admin:', err);
    process.exit(1);
  }
}

module.exports = ensureSuperAdmin;
