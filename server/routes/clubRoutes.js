const express = require('express');

const {
  createClub,
  getAllClubs,
  getMyClubs,
  getClubById,
  updateClub,
  updateClubCoverImage,
  deleteClub,
  joinClub,
  leaveClub,
  setCurrentBook,
  removeCurrentBook,
} = require('../controllers/clubController');

const { protect } = require('../middleware/authMiddleware');
const uploadImage = require('../middleware/uploadImage');
const validate = require('../middleware/validate');

const {
  createClubSchema,
  updateClubSchema,
  setCurrentBookSchema,
} = require('../validation/clubValidation');

const router = express.Router();

router.get('/', getAllClubs);
router.get('/my-clubs', protect, getMyClubs);
router.get('/:id', getClubById);

router.post('/', protect, validate(createClubSchema), createClub);
router.patch('/:id', protect, validate(updateClubSchema), updateClub);
router.put(
  '/:id/cover-image',
  protect,
  uploadImage.single('image'),
  updateClubCoverImage
);
router.delete('/:id', protect, deleteClub);

router.post('/:id/join', protect, joinClub);
router.post('/:id/leave', protect, leaveClub);

router.patch(
  '/:id/current-book',
  protect,
  validate(setCurrentBookSchema),
  setCurrentBook
);

router.delete(
  '/:id/current-book',
  protect,
  removeCurrentBook
);

module.exports = router;
