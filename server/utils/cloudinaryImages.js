const cloudinary = require('../config/cloudinary');

const BOOK_COVER_FOLDER = 'InkAndKey/book-covers';
const BOOK_COVER_PUBLIC_ID_PREFIX = `${BOOK_COVER_FOLDER}/`;

const uploadBufferToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
};

const isManagedBookCoverPublicId = (publicId) => {
  return (
    typeof publicId === 'string' &&
    publicId.startsWith(BOOK_COVER_PUBLIC_ID_PREFIX)
  );
};

const deleteManagedBookCover = async (publicId) => {
  if (!isManagedBookCoverPublicId(publicId)) {
    const error = new Error('Invalid managed book cover public id');
    error.statusCode = 400;
    throw error;
  }

  return cloudinary.uploader.destroy(publicId);
};

const safelyDeleteManagedBookCover = async (publicId, context = 'book cover') => {
  if (!publicId) return;

  if (!isManagedBookCoverPublicId(publicId)) {
    console.error(
      `Skipped Cloudinary cleanup for unmanaged ${context}:`,
      publicId
    );
    return;
  }

  try {
    await deleteManagedBookCover(publicId);
  } catch (cleanupError) {
    console.error(
      `Failed to delete ${context} from Cloudinary:`,
      cleanupError.message
    );
  }
};

module.exports = {
  BOOK_COVER_FOLDER,
  BOOK_COVER_PUBLIC_ID_PREFIX,
  uploadBufferToCloudinary,
  isManagedBookCoverPublicId,
  deleteManagedBookCover,
  safelyDeleteManagedBookCover,
};
