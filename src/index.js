const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config/config');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const deviceRoutes = require('./routes/device.routes');

const app = express();

// Security Middleware
app.use(helmet()); // Adds various HTTP headers for security
app.use(cors({
  origin: config.security.corsOrigin,
  methods: config.security.corsMethods,
  allowedHeaders: config.security.corsAllowedHeaders,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindow,
  max: config.security.rateLimitMax,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Basic Middleware
app.use(express.json({ limit: '10kb' })); // Limit body size
app.use(morgan(config.logging.format));

// Routes
app.use(`${config.api.prefix}/${config.api.version}/auth`, authRoutes);
app.use(`${config.api.prefix}/${config.api.version}/users`, userRoutes);
app.use(`${config.api.prefix}/${config.api.version}/devices`, deviceRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    environment: config.nodeEnv,
    version: config.api.version,
    mongodb: {
      connected: mongoose.connection.readyState === 1,
      state: mongoose.connection.readyState
    }
  });
});

// Database test endpoint (only in development)
if (config.nodeEnv === 'development') {
  app.get(`${config.api.prefix}/test-db`, async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        return res.status(500).json({ message: 'Database not connected' });
      }

      const User = require('./models/user.model');
      const testUser = new User({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        isAdmin: false
      });

      await testUser.save();
      await User.deleteOne({ email: 'test@example.com' }); // Clean up test user

      res.json({
        message: 'Database test successful',
        connection: 'Connected'
      });
    } catch (error) {
      console.error('Database test error:', error);
      res.status(500).json({
        message: 'Database test failed',
        error: error.message
      });
    }
  });
}

// MongoDB connection with retry and secure options
const connectWithRetry = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', config.mongodb.uri);
    
    const options = {
      ...config.mongodb.options,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    };

    await mongoose.connect(config.mongodb.uri, options);
    console.log('Successfully connected to MongoDB');
    
    // Log connection details
    console.log('MongoDB Connection Details:');
    console.log('- Database:', mongoose.connection.name);
    console.log('- Host:', mongoose.connection.host);
    console.log('- Port:', mongoose.connection.port);
    console.log('- State:', mongoose.connection.readyState);
  } catch (err) {
    console.error('MongoDB connection error:', err);
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
  // Attempt to reconnect
  setTimeout(connectWithRetry, 5000);
});

// Handle application shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error during MongoDB disconnection:', err);
    process.exit(1);
  }
});

// Start server
const startServer = async () => {
  try {
    // First connect to MongoDB
    await connectWithRetry();
    
    // Then start the server
    app.listen(config.port, () => {
      console.log(`Server is running on port ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
      console.log(`API Version: ${config.api.version}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: config.nodeEnv === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
}); 