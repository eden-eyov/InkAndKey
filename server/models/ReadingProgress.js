const mongoose = require('mongoose');
/**         reading progress schema:
 * user - FK
 * club - FK
 * book - FK
 * current chapter
 * is compleated
 * rating
 */
const readingProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      required: true,
    },

    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },

    currentChapter: {
      type: Number,
      default: 0,
      min: [0, 'Current chapter cannot be negative'],
    },

    isCompleted: {
      type: Boolean,
      default: false,
    },

    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);
// preventing duplicates of user progress in a specific book
// for example, can't be:
    // Maya + Fantasy Club + Fourth Wing
    // Maya + Fantasy Club + Fourth Wing
readingProgressSchema.index(
  { user: 1, club: 1, book: 1 },
  { unique: true }
);

module.exports = mongoose.model('ReadingProgress', readingProgressSchema);