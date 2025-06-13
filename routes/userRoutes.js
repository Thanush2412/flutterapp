const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');
const subUsersController = require('../controllers/subUsersController');

// User routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await require('../models/User').findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
});
router.put('/profile/update', auth, async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await require('../models/User').findByIdAndUpdate(
      req.user._id,
      { name, email },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile' });
  }
});
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