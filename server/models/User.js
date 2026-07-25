const mongoose = require('mongoose');
const GENRES = require('../utils/genres');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**             user schema:
* username
* email
* password
* profile image
* favorite genres
* favorite books
* */
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      minlength: [2, 'Username must be at least 2 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },

    password: {
      type: String,
      required: function () {
        return this.authProvider === 'local';
      },
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },

    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },

    googleId: {
      type: String,
      default: '',
    },

    profileImage: {
      type: String,
      default: '',
    },

    profileImagePublicId: {
      type: String,
      default: '',
    },

    favoriteGenres: {
      type: [String],
      default: [],
    },
    favoriteBooks: {
      type: [String],
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
    deletedEmailHash: {
      type: String,
      default: '',
      select: false,
    },
  },
  {
    timestamps: true,
  }
);
// encryption:
userSchema.pre('save', async function () {
  if (!this.password || !this.isModified('password')) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
