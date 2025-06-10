# My App Backend

This is the backend server for the My App application, built with Node.js, Express, and MongoDB.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/my_app
JWT_SECRET=your-secret-key
```

3. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user

### Users
- GET `/api/users` - Get all users (admin only)
- GET `/api/users/:id` - Get user by ID (admin only)
- PUT `/api/users/:id` - Update user (admin only)
- DELETE `/api/users/:id` - Delete user (admin only)
- PUT `/api/users/profile/update` - Update user profile
- PUT `/api/users/profile/password` - Change password

### Devices
- GET `/api/devices` - Get all devices (admin only)
- GET `/api/devices/my-devices` - Get user's assigned devices
- POST `/api/devices` - Create new device (admin only)
- PUT `/api/devices/:id` - Update device (admin only)
- DELETE `/api/devices/:id` - Delete device (admin only)
- POST `/api/devices/:id/readings` - Add reading to device
- GET `/api/devices/:id/readings` - Get device readings

## Error Handling

The API uses standard HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Security

- Passwords are hashed using bcrypt
- JWT authentication is used for protected routes
- Admin-only routes are protected
- Input validation and sanitization
- CORS enabled 