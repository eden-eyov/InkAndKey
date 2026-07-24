const jwt = require('jsonwebtoken');

const {
  BOOK_COVER_FOLDER,
  deleteManagedBookCover,
  isManagedBookCoverPublicId,
  uploadBufferToCloudinary,
} = require('../utils/cloudinaryImages');

const UPLOAD_DELETE_TOKEN_EXPIRES_IN = '1h';

const getUploadDeleteTokenSecret = () => {
  const secret =
    process.env.UPLOAD_DELETE_TOKEN_SECRET || process.env.JWT_SECRET;

  if (!secret) {
    const error = new Error('Upload delete token secret is not configured');
    error.statusCode = 500;
    throw error;
  }

  return secret;
};

const createUploadDeleteToken = ({ userId, publicId }) => {
  return jwt.sign(
    {
      type: 'temporary-book-cover',
      userId,
      publicId,
    },
    getUploadDeleteTokenSecret(),
    {
      expiresIn: UPLOAD_DELETE_TOKEN_EXPIRES_IN,
    }
  );
};

const verifyUploadDeleteToken = (token) => {
  return jwt.verify(token, getUploadDeleteTokenSecret());
};

const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required',
      });
    }

    const uploadedImage = await uploadBufferToCloudinary(req.file.buffer, {
      folder: BOOK_COVER_FOLDER,
    });

    const deleteToken = createUploadDeleteToken({
      userId: req.user._id.toString(),
      publicId: uploadedImage.public_id,
    });

    res.status(201).json({
      success: true,
      data: {
        url: uploadedImage.secure_url,
        publicId: uploadedImage.public_id,
        deleteToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteImage = async (req, res, next) => {
  try {
    const publicId =
      typeof req.body.publicId === 'string' ? req.body.publicId.trim() : '';

    const deleteToken =
      typeof req.body.deleteToken === 'string'
        ? req.body.deleteToken.trim()
        : '';

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Image public id is required',
      });
    }

    if (!deleteToken) {
      return res.status(400).json({
        success: false,
        message: 'Image delete token is required',
      });
    }

    if (!isManagedBookCoverPublicId(publicId)) {
      return res.status(400).json({
        success: false,
        message: 'Image public id is not managed by this upload endpoint',
      });
    }

    let decodedToken;

    try {
      decodedToken = verifyUploadDeleteToken(deleteToken);
    } catch {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired image delete token',
      });
    }

    const tokenBelongsToCurrentUser =
      decodedToken.userId === req.user._id.toString();

    const tokenMatchesImage = decodedToken.publicId === publicId;

    const tokenHasCorrectType =
      decodedToken.type === 'temporary-book-cover';

    if (
      !tokenBelongsToCurrentUser ||
      !tokenMatchesImage ||
      !tokenHasCorrectType
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this image',
      });
    }

    await deleteManagedBookCover(publicId);

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadImage,
  deleteImage,
};