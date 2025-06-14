# JSW Smart Save Backend

Backend API for the JSW Smart Save IoT Monitoring System.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=your_mongodb_uri

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# Security Configuration
CORS_ORIGIN=http://localhost:3000
BCRYPT_SALT_ROUNDS=10
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# API Configuration
API_PREFIX=/api
API_VERSION=v1

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=dev
```

3. Run the development server:
```bash
npm run dev
```

## Scripts

- `npm start`: Start the production server
- `npm run dev`: Start the development server with hot reload
- `npm run create-admin`: Create an admin user
- `npm run create-devices`: Create sample devices
- `npm run test-db`: Test MongoDB connection

## API Endpoints

### Authentication
- POST `/api/v1/auth/login`: User login
- POST `/api/v1/auth/register`: User registration
- POST `/api/v1/auth/refresh`: Refresh access token

### Users
- GET `/api/v1/users`: Get all users (admin only)
- GET `/api/v1/users/:id`: Get user by ID
- PUT `/api/v1/users/:id`: Update user
- DELETE `/api/v1/users/:id`: Delete user

### Devices
- GET `/api/v1/devices`: Get all devices
- GET `/api/v1/devices/:id`: Get device by ID
- POST `/api/v1/devices`: Create device
- PUT `/api/v1/devices/:id`: Update device
- DELETE `/api/v1/devices/:id`: Delete device

## Deployment

### Vercel Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. For production deployment:
```bash
vercel --prod
```

### Environment Variables in Vercel

Set the following environment variables in your Vercel project settings:

- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CORS_ORIGIN`
- `NODE_ENV`

## Security

- JWT authentication
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation
- Error handling

## License

MIT 