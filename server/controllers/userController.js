const User = require('../models/User');
const Club = require('../models/Club');
const ReadingProgress = require('../models/ReadingProgress');

/**
 * Get user profile by id.
 * This route is protected, so only logged-in users can view profiles.
 * If the logged-in user views their own profile:
 * - return email too
 * If the logged-in user views another user's profile:
 * - do NOT return email
 * - return only public profile fields
 */
const getUserProfile = async (req, res, next) => {
  try {
    const isOwnProfile = req.user._id.toString() === req.params.id;

    const fieldsToSelect = isOwnProfile
      ? 'username email profileImage favoriteGenres favoriteBooks createdAt updatedAt'
      : 'username profileImage favoriteGenres favoriteBooks createdAt';

    const user = await User.findById(req.params.id).select(fieldsToSelect);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      isOwnProfile,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search users by username.
 * This is useful for search bars, member search, or finding users.
 * The search is case-insensitive.
 * Email is never returned here because this is public user-search data.
 */
const searchUsers = async (req, res, next) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username search query is required',
      });
    }

    const users = await User.find({
      username: { $regex: username, $options: 'i' },
    })
      .select('username profileImage favoriteGenres favoriteBooks createdAt')
      .limit(20);

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get clubs that a user is a member of.
 * This can be used on a user profile page to show
 * the book clubs this user belongs to.
 * Email and private user data are not returned.
 */
const getUserClubs = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('_id username');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const clubs = await Club.find({
      members: req.params.id,
    })
      .populate('creator', 'username profileImage')
      .populate('currentBook', 'title author coverImage totalChapters')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: clubs.length,
      data: clubs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get books the user is currently reading.
 * This uses ReadingProgress because reading status belongs to:
 * user + club + book
 * A book is considered currently reading if:
 * - isCompleted is false
 */
const getUserCurrentlyReading = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('_id username');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const progressList = await ReadingProgress.find({
      user: req.params.id,
      isCompleted: false,
    })
      .populate('club', 'name image')
      .populate('book', 'title author coverImage totalChapters')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: progressList.length,
      data: progressList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get books the user has completed.
 * This can be used later for a "past books read" section
 * on the user profile.
 * It returns the user's ReadingProgress documents with:
 * - completed book
 * - club where they read it
 * - rating if the user added one
 */
const getUserCompletedBooks = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('_id username');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const completedBooks = await ReadingProgress.find({
      user: req.params.id,
      isCompleted: true,
    })
      .populate('club', 'name image')
      .populate('book', 'title author coverImage totalChapters')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: completedBooks.length,
      data: completedBooks,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  searchUsers,
  getUserClubs,
  getUserCurrentlyReading,
  getUserCompletedBooks,
};