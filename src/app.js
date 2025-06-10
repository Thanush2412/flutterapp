const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config/config');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const deviceRoutes = require('./routes/device.routes');
const healthRoutes = require('./routes/health.routes');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.security.corsOrigin,
  methods: config.security.corsMethods,
  allowedHeaders: config.security.corsAllowedHeaders,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindow,
  max: config.security.rateLimitMax
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan(config.logging.format));

// Health check route (no auth required)
app.use('/api/v1/health', healthRoutes);

// API routes
app.use(`${config.api.prefix}/${config.api.version}/auth`, authRoutes);
app.use(`${config.api.prefix}/${config.api.version}/users`, userRoutes);
app.use(`${config.api.prefix}/${config.api.version}/devices`, deviceRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

module.exports = app; 