const express = require('express');

const {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
} = require('../controllers/bookController');

const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const {
  createBookSchema,
  updateBookSchema,
} = require('../validation/bookValidation');

const router = express.Router();

router.get('/', getAllBooks);
router.get('/:id', getBookById);

router.post('/', protect, validate(createBookSchema), createBook);
router.patch('/:id', protect, validate(updateBookSchema), updateBook);
router.delete('/:id', protect, deleteBook);

module.exports = router;