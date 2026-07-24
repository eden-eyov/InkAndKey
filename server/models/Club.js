const mongoose = require('mongoose');
const GENRES = require('../utils/genres');
/**            Club schema:
 * club name
 * description
 * image
 * creator - FK
 * members
 * current book - FK
 * previous books
 * genres
 */
const clubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Club name is required'],
      trim: true,
      minlength: [2, 'Club name must be at least 2 characters'],
      maxlength: [80, 'Club name cannot exceed 80 characters'],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },

    image: {
      type: String,
      default: '',
    },

    coverImage: {
      type: String,
      default: '',
    },

    coverImagePublicId: {
      type: String,
      default: '',
    },

    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    currentBook: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      default: null,
    },

    previousBooks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
      },
    ],

    genres: {
        type: [String],
        enum: GENRES,
        default: [],
    },

  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Club', clubSchema);
