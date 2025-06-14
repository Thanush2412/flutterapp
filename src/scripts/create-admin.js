const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const adminUser = {
  name: 'Admin User',
  email: 'admin@jsw.com',
  password: 'admin123',
  isAdmin: true,
};

async function createAdminUser() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      retryWrites: true,
      w: 'majority'
    });
    console.log('Connected to MongoDB');

    // Check if admin already exists
    console.log('Checking for existing admin user...');
    const existingAdmin = await User.findOne({ email: adminUser.email });
    if (existingAdmin) {
      console.log('Admin user already exists, deleting...');
      await User.deleteOne({ email: adminUser.email });
      console.log('Existing admin user deleted');
    }

    // Hash password
    console.log('Hashing password...');
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10));
    const hashedPassword = await bcrypt.hash(adminUser.password, salt);
    console.log('Password hashed successfully');

    // Create admin user directly in the database
    console.log('Creating new admin user...');
    await User.collection.insertOne({
      name: adminUser.name,
      email: adminUser.email,
      password: hashedPassword,
      isAdmin: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Admin user created successfully');
    console.log('Email:', adminUser.email);
    console.log('Password:', adminUser.password);

    // Verify the user was created
    const savedAdmin = await User.findOne({ email: adminUser.email });
    console.log('Verification - Admin user found:', {
      id: savedAdmin._id,
      email: savedAdmin.email,
      isAdmin: savedAdmin.isAdmin,
      hasPassword: !!savedAdmin.password
    });

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdminUser(); 