const express = require('express');

const {
    createPoll,
    getCurrentPoll,
    voteInPoll,
    closePoll,
    deletePoll,
    announcePollWinner,
    setWinnerBookAsCurrent,
    getClubPolls,
    getMyActivePolls,
} = require('../controllers/pollController');

const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const {
    createPollSchema,
    voteInPollSchema,
    announcePollWinnerSchema,
} = require('../validation/pollValidation');

const router = express.Router({ mergeParams: true });
const userPollRouter = express.Router();

userPollRouter.get('/my-active-polls', protect, getMyActivePolls);

/**
 * Protected poll routes:
 * Every poll route requires a logged-in user.
 *
 * Important:
 * - mergeParams: true allows this router to access :clubId
 *   from the parent route /api/clubs/:clubId/polls.
 */
router.use(protect);

/**
 * Get all polls for a specific club.
 *
 * Example:
 * GET /api/clubs/:clubId/polls
 *
 * Access:
 * - Club members only.
 */
router.get('/', getClubPolls);

/**
 * Create a new next-read poll for a club.
 *
 * Example:
 * POST /api/clubs/:clubId/polls
 *
 * Access:
 * - Club creator only.
 *
 * Body:
 * {
 *   question,
 *   closesAt,
 *   options: [{ title, author, coverImage, description }]
 * }
 */
router.post('/', validate(createPollSchema), createPoll);

/**
 * Get the current open poll for a club.
 *
 * Example:
 * GET /api/clubs/:clubId/polls/current
 *
 * Access:
 * - Club members only.
 */
router.get('/current', getCurrentPoll);

/**
 * Vote in a poll.
 *
 * Example:
 * POST /api/clubs/:clubId/polls/:pollId/vote
 *
 * Access:
 * - Club members only.
 *
 * Body:
 * {
 *   optionId
 * }
 */
router.post('/:pollId/vote', validate(voteInPollSchema), voteInPoll);

/**
 * Announce the winner of a poll and create a real Book from it.
 *
 * Example:
 * POST /api/clubs/:clubId/polls/:pollId/announce-winner
 *
 * Access:
 * - Club creator only.
 */
router.post(
    '/:pollId/announce-winner',
    validate(announcePollWinnerSchema),
    announcePollWinner
);

/**
 * Set the already announced winner book as the club current book.
 *
 * Example:
 * PATCH /api/clubs/:clubId/polls/:pollId/set-winner-current
 *
 * Access:
 * - Club creator only.
 */
router.patch('/:pollId/set-winner-current', setWinnerBookAsCurrent);

/**
 * Close a poll manually.
 *
 * Example:
 * PATCH /api/clubs/:clubId/polls/:pollId/close
 *
 * Access:
 * - Club creator only.
 */
router.patch('/:pollId/close', closePoll);

/**
 * Completely delete a poll and all of its votes.
 *
 * Example:
 * DELETE /api/clubs/:clubId/polls/:pollId
 *
 * Access:
 * - Club creator only.
 *
 * Rules:
 * - The poll may be open or closed.
 * - It cannot be deleted after a winner was announced.
 */
router.delete('/:pollId', deletePoll);

module.exports = router;
module.exports.userPollRouter = userPollRouter;
