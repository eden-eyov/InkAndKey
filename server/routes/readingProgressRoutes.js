const express = require('express');

const {
  upsertMyProgress,
  getMyProgress,
  getMyProgressById,
  markMyProgressAsDnf,
  deleteMyProgress,
} = require('../controllers/readingProgressController');

const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const {
  upsertReadingProgressSchema,
} = require('../validation/readingProgressValidation');

const router = express.Router();

router.use(protect);

router.get('/', getMyProgress);
router.get('/:id', getMyProgressById);
router.post('/', validate(upsertReadingProgressSchema), upsertMyProgress);
router.patch('/:id/dnf', markMyProgressAsDnf);
router.delete('/:id', deleteMyProgress);

module.exports = router;