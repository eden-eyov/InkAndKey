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

    coverImagePublicId: {
      type: String,
      trim: true,
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

    averageRating: {
      type: Number,
      min: [0, 'Average rating cannot be negative'],
      max: [5, 'Average rating cannot exceed 5'],
      default: 0,
    },

    ratingsCount: {
      type: Number,
      min: [0, 'Ratings count cannot be negative'],
      default: 0,
    },

    googleBooksId: {
      type: String,
      trim: true,
      default: '',
    },

    pageCount: {
      type: Number,
      min: [0, 'Page count cannot be negative'],
      default: null,
    },

    publishedDate: {
      type: String,
      trim: true,
      default: '',
    },

    language: {
      type: String,
      trim: true,
      default: '',
    },

    infoLink: {
      type: String,
      trim: true,
      default: '',
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
