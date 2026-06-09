const express = require('express');

const {
  createClub,
  getAllClubs,
  getClubById,
  updateClub,
  deleteClub,
  joinClub,
  leaveClub,
} = require('../controllers/clubController');

const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const {
  createClubSchema,
  updateClubSchema,
} = require('../validation/clubValidation');

const router = express.Router();

router.get('/', getAllClubs);
router.get('/:id', getClubById);

router.post('/', protect, validate(createClubSchema), createClub);
router.patch('/:id', protect, validate(updateClubSchema), updateClub);
router.delete('/:id', protect, deleteClub);

router.post('/:id/join', protect, joinClub);
router.post('/:id/leave', protect, leaveClub);

module.exports = router;