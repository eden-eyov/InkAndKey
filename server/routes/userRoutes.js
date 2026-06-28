const express = require('express');

const {
  getUserProfile,
  searchUsers,
  updateMyProfileImage,
  getUserClubs,
  getUserCurrentlyReading,
  getUserCompletedBooks,
} = require('../controllers/userController');

const { protect } = require('../middleware/authMiddleware');
const uploadImage = require('../middleware/uploadImage');

const router = express.Router();

/**
 * All user routes are protected.
 * Guests cannot view user profiles or user activity.
 */
router.use(protect);

/**
 * Search users by username.
 * Example:
 * GET /api/users/search?username=maya
 * IMPORTANT:
 * This route must be before "/:id",
 * otherwise Express will treat "search" as a user id.
 */
router.get('/search', searchUsers);

/**
 * Update the logged-in user's profile image.
 * Example:
 * PUT /api/users/me/profile-image
 */
router.put(
  '/me/profile-image',
  uploadImage.single('image'),
  updateMyProfileImage
);

/**
 * Get all clubs that this user is a member of.
 * Example:
 * GET /api/users/USER_ID/clubs
 */
router.get('/:id/clubs', getUserClubs);

/**
 * Get books this user is currently reading.
 * Example:
 * GET /api/users/USER_ID/currently-reading
 */
router.get('/:id/currently-reading', getUserCurrentlyReading);

/**
 * Get books this user has completed.
 * Example:
 * GET /api/users/USER_ID/completed-books
 */
router.get('/:id/completed-books', getUserCompletedBooks);

/**
 * Get a user's public/private profile.
 * If the logged-in user asks for their own profile:
 * - email is included
 * If the logged-in user asks for another user's profile:
 * - email is not included
 * IMPORTANT:
 * Keep this route last, because "/:id" can catch many paths.
 */
router.get('/:id', getUserProfile);

module.exports = router;
