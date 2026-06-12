const mongoose = require('mongoose');
/** Comment schema:
 * club - FK
 * book - FK
 * user - FK
 * text
 * chapter number
 * is spoiler free review
 * parent comment - null if its the first and different comment_ID if its not
 * likes
 * is deleted - a deleted comment will act as deleted but will stay in the db for the nested comments
 * deleted at
 */

const commentSchema = new mongoose.Schema(
  {
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

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      minlength: [1, 'Comment cannot be empty'],
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },

    chapterNumber: {
      type: Number,
      required: [true, 'Chapter number is required'],
      min: [0, 'Chapter number cannot be negative'],
    },

    isSpoilerFreeReview: {
      type: Boolean,
      default: false,
    },

    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: [],
      },
    ],

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Comment', commentSchema);