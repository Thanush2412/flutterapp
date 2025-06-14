require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

// Validate required environment variables
const requiredEnvVars = [
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'NODE_ENV',
  'CORS_ORIGIN',
  'JWT_EXPIRES_IN'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Error: Missing required environment variables:');
  missingEnvVars.forEach(envVar => console.error(`- ${envVar}`));
  process.exit(1);
}

// Log environment variables (without sensitive data)
console.log('Environment Configuration:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not Set');
console.log('- CORS_ORIGIN:', process.env.CORS_ORIGIN);

const config = {
  // Server Configuration
  port: parseInt(process.env.PORT, 10),
  nodeEnv: process.env.NODE_ENV,
  
  // MongoDB Configuration
  mongodb: {
    uri: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      retryWrites: true,
      w: 'majority',
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      family: 4,
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 60000,
      waitQueueTimeoutMS: 30000
    }
  },
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN
  },
  
  // Security Configuration
  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    corsOrigin: process.env.CORS_ORIGIN,
    corsMethods: process.env.CORS_METHODS?.split(',') || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    corsAllowedHeaders: process.env.CORS_ALLOWED_HEADERS?.split(',') || ['Content-Type', 'Authorization']
  },

  // API Configuration
  api: {
    prefix: process.env.API_PREFIX || '/api',
    version: process.env.API_VERSION || 'v1'
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'dev'
  },
  
  // Super Admin Configuration
  superAdmin: {
    email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@example.com',
    password: process.env.SUPER_ADMIN_PASSWORD || 'changeme123'
  }
};

// Freeze the config object to prevent modifications
Object.freeze(config);

module.exports = {
  ...config,
  superAdmin: {
    email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@example.com',
    password: process.env.SUPER_ADMIN_PASSWORD || 'changeme123'
  }
};