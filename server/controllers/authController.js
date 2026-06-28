const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
};

const sendRefreshTokenCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

const buildUserResponse = (user) => {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    profileImage: user.profileImage,
    favoriteGenres: user.favoriteGenres,
    favoriteBooks: user.favoriteBooks,
    authProvider: user.authProvider,
  };
};

const register = async (req, res, next) => {
  try {
    const { username, email, password, favoriteGenres, favoriteBooks } = req.body;

    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered',
      });
    }

    const existingUsername = await User.findOne({ username });

    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: 'Username is already taken',
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      favoriteGenres,
      favoriteBooks,
    });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    sendRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      accessToken,
      data: buildUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter email and password',
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isPasswordCorrect = await user.matchPassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    sendRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      data: buildUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required',
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google account data',
      });
    }

    const email = payload.email.toLowerCase();
    const googleId = payload.sub;
    const username =
      payload.name ||
      email.split('@')[0];

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        username,
        email,
        profileImage: payload.picture || '',
        authProvider: 'google',
        googleId,
        favoriteGenres: [],
        favoriteBooks: [],
      });
    } else {
      let shouldSave = false;

      if (!user.googleId) {
        user.googleId = googleId;
        shouldSave = true;
      }

      if (user.authProvider !== 'google') {
        user.authProvider = 'google';
        shouldSave = true;
      }

      if (!user.profileImage && payload.picture) {
        user.profileImage = payload.picture;
        shouldSave = true;
      }

      if (shouldSave) {
        await user.save();
      }
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    sendRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      message: 'Google login successful',
      accessToken,
      data: buildUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided',
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists',
      });
    }

    const newAccessToken = generateAccessToken(user._id);

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
    });
  }
};

const logout = (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: buildUserResponse(req.user),
  });
};

const updateMe = async (req, res, next) => {
  try {
    const allowedFields = [
      'username',
      'profileImage',
      'favoriteGenres',
      'favoriteBooks',
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: buildUserResponse(updatedUser),
    });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  register,
  login,
  googleLogin,
  refreshAccessToken,
  logout,
  getMe,
  updateMe,
};