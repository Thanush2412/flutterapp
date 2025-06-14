const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['super-admin', 'admin', 'user'],
    default: 'user'
  },
  profileImageUrl: {
    type: String
  },
  parentUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  subUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      ret.uid = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      return ret;
    }
  }
});

// Log before save
userSchema.pre('save', async function(next) {
  console.log('User pre-save hook - Document:', this.toObject());
  
  if (!this.isModified('password')) {
    console.log('Password not modified, skipping hash');
    return next();
  }
  
  try {
    console.log('Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    console.log('Password hashed successfully');
    this.password = hashedPassword;
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    next(error);
  }
});

// Log after save
userSchema.post('save', function(doc) {
  console.log('User saved successfully:', doc.toObject());
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  console.log('Comparing passwords...');
  console.log('Candidate password:', candidatePassword);
  console.log('Stored password hash:', this.password);
  
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('Password match result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    throw error;
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User; 