const User = require('../models/User');
const { validateObjectId } = require('../utils/validation');

// Get all sub-users for a specific user
exports.getSubUsers = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate user ID
    if (!validateObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Check if the requesting user has permission
    if (req.user._id.toString() !== userId && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view these sub-users' });
    }

    // Find all users where parentUserId matches the given userId
    const subUsers = await User.find({ parentUserId: userId })
      .select('-password') // Exclude password from response
      .lean();

    res.json(subUsers);
  } catch (error) {
    console.error('Error fetching sub-users:', error);
    res.status(500).json({ message: 'Error fetching sub-users' });
  }
};

// Create a new sub-user
exports.createSubUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, password } = req.body;

    // Validate user ID
    if (!validateObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Check if the requesting user has permission
    if (req.user._id.toString() !== userId && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to create sub-users' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create new sub-user
    const subUser = new User({
      name,
      email,
      password,
      parentUserId: userId,
      isAdmin: false, // Sub-users cannot be admins
    });

    await subUser.save();

    // Return user without password
    const userResponse = subUser.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error creating sub-user:', error);
    res.status(500).json({ message: 'Error creating sub-user' });
  }
};

// Delete a sub-user
exports.deleteSubUser = async (req, res) => {
  try {
    const { userId, subUserId } = req.params;

    // Validate user IDs
    if (!validateObjectId(userId) || !validateObjectId(subUserId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Check if the requesting user has permission
    if (req.user._id.toString() !== userId && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete sub-users' });
    }

    // Find and delete the sub-user
    const subUser = await User.findOneAndDelete({
      _id: subUserId,
      parentUserId: userId
    });

    if (!subUser) {
      return res.status(404).json({ message: 'Sub-user not found' });
    }

    res.json({ message: 'Sub-user deleted successfully' });
  } catch (error) {
    console.error('Error deleting sub-user:', error);
    res.status(500).json({ message: 'Error deleting sub-user' });
  }
}; 