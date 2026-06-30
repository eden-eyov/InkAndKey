const express = require('express');

const {
  uploadImage,
  deleteImage,
} = require('../controllers/uploadController');

const { protect } = require('../middleware/authMiddleware');
const uploadImageMiddleware = require('../middleware/uploadImage');

const router = express.Router();

router.post('/image', protect, uploadImageMiddleware.single('image'), uploadImage);
router.delete('/image', protect, deleteImage);

module.exports = router;
