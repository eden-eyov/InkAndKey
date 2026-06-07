const mongoose = require('mongoose');
const GENRES = require('../utils/genres');
/**         Book schema:
 * title
 * author
 * cover image
 * description
 * genres
 * total chapters
 * club - FK
 */
const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
      minlength: [1, 'Book title is required'],
      maxlength: [150, 'Book title cannot exceed 150 characters'],
    },

    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
      maxlength: [100, 'Author name cannot exceed 100 characters'],
    },

    coverImage: {
      type: String,
      default: '',
    },

    description: {
      type: String,
      trim: true,
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
      default: '',
    },

    genres: {
      type: [String],
      enum: GENRES,
      default: [],
    },

    totalChapters: {
      type: Number,
      required: [true, 'Total chapters is required'],
      min: [1, 'Book must have at least 1 chapter'],
    },

    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Book', bookSchema);