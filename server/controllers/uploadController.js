const {
  BOOK_COVER_FOLDER,
  deleteManagedBookCover,
  isManagedBookCoverPublicId,
  uploadBufferToCloudinary,
} = require('../utils/cloudinaryImages');

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

    res.status(201).json({
      success: true,
      data: {
        url: uploadedImage.secure_url,
        publicId: uploadedImage.public_id,
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

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Image public id is required',
      });
    }

    if (!isManagedBookCoverPublicId(publicId)) {
      return res.status(400).json({
        success: false,
        message: 'Image public id is not managed by this upload endpoint',
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
