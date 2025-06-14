const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');
const subUsersController = require('../controllers/subUsersController');

// User routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/profile', auth, userController.getProfile);
router.put('/profile/update', auth, userController.updateProfile);
router.put('/profile/password', auth, userController.changePassword);

// Admin routes
router.post('/', auth, userController.createUser);
router.get('/', auth, userController.getAllUsers);
router.get('/:userId', auth, userController.getUserById);
router.put('/:userId', auth, userController.updateUser);
router.delete('/:userId', auth, userController.deleteUser);

// Device assignment routes
router.post('/:userId/devices/:deviceId', auth, userController.assignDevice);
router.delete('/:userId/devices/:deviceId', auth, userController.removeDevice);

// Sub-user routes
router.get('/:userId/sub-users', auth, subUsersController.getSubUsers);
router.post('/:userId/sub-users', auth, subUsersController.createSubUser);
router.delete('/:userId/sub-users/:subUserId', auth, subUsersController.deleteSubUser);

module.exports = router; 