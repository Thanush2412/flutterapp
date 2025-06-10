require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config/config');
const app = require('./app');

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

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  tls: true,
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false,
  retryWrites: true,
  w: 'majority'
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Error handling for unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`API URL: http://localhost:${PORT}${config.api.prefix}/${config.api.version}`);
});

// Export for Vercel
module.exports = app;

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: config.nodeEnv === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
}); 