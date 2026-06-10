const express = require('express');

const {
  createComment,
  getCommentsByBook,
  getPublicSpoilerFreeComments,
  getCommentById,
  updateComment,
  deleteComment,
  toggleLikeComment,
} = require('../controllers/commentController');

const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const {
  createCommentSchema,
  updateCommentSchema,
} = require('../validation/commentValidation');

const router = express.Router();

/**
 * Public route:
 * Returns only spoiler-free reviews/comments.
 * This is useful for guests who are not logged in.
 */
router.get('/public', getPublicSpoilerFreeComments);

/**
 * Protected routes:
 * From here down, every route requires a valid access token.
 */
router.use(protect);

/**
 * Get all comments for a specific club + book.
 * Returns all comments, but locked comments are returned without text.
 *
 * Example:
 * GET /api/comments?club=CLUB_ID&book=BOOK_ID
 */
router.get('/', getCommentsByBook);

/**
 * Create a new comment or reply.
 */
router.post('/', validate(createCommentSchema), createComment);

/**
 * Get one comment by id.
 */
router.get('/:id', getCommentById);

/**
 * Update one comment.
 * Only the comment author can update it.
 */
router.patch('/:id', validate(updateCommentSchema), updateComment);

/**
 * Delete one comment.
 * If it has replies, it becomes a deleted placeholder.
 * If it has no replies, it is permanently deleted.
 */
router.delete('/:id', deleteComment);

/**
 * Like / unlike one comment.
 */
router.post('/:id/like', toggleLikeComment);

module.exports = router;