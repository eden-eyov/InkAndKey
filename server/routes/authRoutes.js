const express = require('express');
const {
  register,
  login,
  googleLogin,
  refreshAccessToken,
  logout,
  getMe,
  updateMe,
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const {
  registerSchema,
  loginSchema,
  updateMeSchema,
} = require('../validation/authValidation');

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/google', googleLogin);

router.post('/refresh-token', refreshAccessToken);
router.post('/logout', logout);

router.get('/me', protect, getMe);
router.patch('/me', protect, validate(updateMeSchema), updateMe);

module.exports = router;