const Comment = require('../models/Comment');
const Club = require('../models/Club');
const Book = require('../models/Book');
const ReadingProgress = require('../models/ReadingProgress');

const formatCommentAuthor = (user) => {
  if (!user || user.isDeleted) {
    return {
      _id: user?._id || null,
      username: 'Deleted user',
      profileImage: '',
      isDeleted: true,
    };
  }

  return {
    _id: user._id,
    username: user.username,
    profileImage: user.profileImage,
    isDeleted: false,
  };
};

const formatCommentForUser = (comment, currentChapter, userId) => {
  const isLocked =
    !comment.isSpoilerFreeReview &&
    !comment.isDeleted &&
    comment.chapterNumber > currentChapter;

  return {
    _id: comment._id,
    club: comment.club,
    book: comment.book,
    user: formatCommentAuthor(comment.user),
    title: isLocked ? null : comment.title,
    text: isLocked ? null : comment.text,
    chapterNumber: comment.chapterNumber,
    isSpoilerFreeReview: comment.isSpoilerFreeReview,
    parentComment: comment.parentComment,
    isDeleted: comment.isDeleted,
    deletedAt: comment.deletedAt,
    isLocked,
    unlockChapter: isLocked ? comment.chapterNumber : null,
    likesCount: comment.likes.length,
    isLikedByMe: comment.likes.some(
      (likeUserId) => likeUserId.toString() === userId.toString()
    ),
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };
};

const formatPublicComment = (comment) => {
  return {
    _id: comment._id,
    club: comment.club,
    book: comment.book,
    user: formatCommentAuthor(comment.user),
    title: comment.title,
    text: comment.text,
    chapterNumber: comment.chapterNumber,
    isSpoilerFreeReview: comment.isSpoilerFreeReview,
    parentComment: comment.parentComment,
    isDeleted: comment.isDeleted,
    deletedAt: comment.deletedAt,
    likesCount: comment.likes.length,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };
};

// creating a comment:
const createComment = async (req, res, next) => {
  try {
    const {
      club: clubId,
      book: bookId,
      title,
      text,
      chapterNumber,
      isSpoilerFreeReview,
      parentComment,
    } = req.body;

    let effectiveChapterNumber = chapterNumber;
    let effectiveIsSpoilerFreeReview = isSpoilerFreeReview ?? false;

    const userId = req.user._id;

    const club = await Club.findById(clubId);

    if (!club || club.isArchived) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    const isMember = club.members.some(
      (memberId) => memberId.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You must be a club member to comment',
      });
    }

    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    if (book.club.toString() !== club._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'This book does not belong to this club',
      });
    }

    if (parentComment) {
      const parent = await Comment.findById(parentComment);

      if (!parent) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found',
        });
      }
      if (parent.isDeleted) {
        return res.status(400).json({
          success: false,
          message: 'You cannot reply to a deleted comment',
        });
      }

      if (
        parent.club.toString() !== clubId.toString() ||
        parent.book.toString() !== bookId.toString()
      ) {
        return res.status(400).json({
          success: false,
          message: 'Parent comment must belong to the same club and book',
        });
      }

      effectiveChapterNumber =
        chapterNumber ?? parent.chapterNumber;

      if (effectiveChapterNumber < parent.chapterNumber) {
        return res.status(400).json({
          success: false,
          message:
            `A reply cannot be assigned to a chapter earlier than its parent comment ` +
            `(chapter ${parent.chapterNumber})`,
        });
      }

      effectiveIsSpoilerFreeReview = false;
    }

    if (effectiveChapterNumber > book.totalChapters) {
      return res.status(400).json({
        success: false,
        message: `Chapter number cannot be greater than total chapters (${book.totalChapters})`,
      });
    }


    const comment = await Comment.create({
      club: clubId,
      book: bookId,
      user: userId,
      title,
      text,
      chapterNumber: effectiveChapterNumber,
      isSpoilerFreeReview: effectiveIsSpoilerFreeReview,
      parentComment,
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'username profileImage isDeleted')
      .populate('club', 'name')
      .populate('book', 'title author coverImage');

    res.status(201).json({
      success: true,
      data: populatedComment,
    });
  } catch (error) {
    next(error);
  }
};

// returns all comments by book: if the comment has spoilers it is classified as locked
const getCommentsByBook = async (req, res, next) => {
  try {
    const { club: clubId, book: bookId } = req.query;
    const userId = req.user._id;

    if (!clubId || !bookId) {
      return res.status(400).json({
        success: false,
        message: 'Club id and book id are required',
      });
    }

    const club = await Club.findById(clubId);

    if (!club || club.isArchived) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    const isMember = club.members.some(
      (memberId) => memberId.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You must be a club member to view these comments',
      });
    }

    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    if (book.club.toString() !== club._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'This book does not belong to this club',
      });
    }

    const progress = await ReadingProgress.findOne({
      user: userId,
      club: clubId,
      book: bookId,
    });

    const currentChapter = progress ? progress.currentChapter : 0;

    const comments = await Comment.find({
      club: clubId,
      book: bookId,
    })
      .populate('user', 'username profileImage isDeleted')
      .populate('club', 'name')
      .populate('book', 'title author coverImage')
      .sort({ createdAt: 1 });

    const formattedComments = comments.map((comment) =>
      formatCommentForUser(comment, currentChapter, userId)
    );

    res.status(200).json({
      success: true,
      count: formattedComments.length,
      currentChapter,
      data: formattedComments,
    });
  } catch (error) {
    next(error);
  }
};

// returns all public spoiler free comments by book so guests could see it
const getPublicSpoilerFreeComments = async (req, res, next) => {
  try {
    const { club: clubId, book: bookId } = req.query;

    if (!clubId || !bookId) {
      return res.status(400).json({
        success: false,
        message: 'Club id and book id are required',
      });
    }

    const club = await Club.findById(clubId);

    if (!club || club.isArchived) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    if (book.club.toString() !== clubId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'This book does not belong to this club',
      });
    }

    const comments = await Comment.find({
      club: clubId,
      book: bookId,
      isSpoilerFreeReview: true,
      parentComment: null,
    })
      .populate('user', 'username profileImage isDeleted')
      .populate('club', 'name')
      .populate('book', 'title author coverImage')
      .sort({ createdAt: -1 });

    const formattedComments = comments.map((comment) =>
      formatPublicComment(comment)
    );

    res.status(200).json({
      success: true,
      count: formattedComments.length,
      data: formattedComments,
    });
  } catch (error) {
    next(error);
  }
};

// returns one comment by id, checks if it should be locked
const getCommentById = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const comment = await Comment.findById(req.params.id)
      .populate('user', 'username profileImage isDeleted')
      .populate('club', 'name members isArchived')
      .populate('book', 'title author coverImage totalChapters');

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    if (!comment.club || comment.club.isArchived) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    const isMember = comment.club.members.some(
      (memberId) => memberId.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You must be a club member to view this comment',
      });
    }

    const progress = await ReadingProgress.findOne({
      user: userId,
      club: comment.club._id,
      book: comment.book._id,
    });

    const currentChapter = progress ? progress.currentChapter : 0;

    const formattedComment = formatCommentForUser(
      comment,
      currentChapter,
      userId
    );

    res.status(200).json({
      success: true,
      currentChapter,
      data: formattedComment,
    });
  } catch (error) {
    next(error);
  }
};

// only comment creator can edit the comment
const updateComment = async (req, res, next) => {
  try {
    const { text, chapterNumber, isSpoilerFreeReview } = req.body;

    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    if (comment.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Deleted comments cannot be edited',
      });
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can update only your own comments',
      });
    }

    const club = await Club.findById(comment.club);

    if (!club || club.isArchived) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    let parent = null;

    if (comment.parentComment) {
      parent = await Comment.findById(comment.parentComment);

      if (!parent) {
        return res.status(409).json({
          success: false,
          message: 'The parent comment no longer exists',
        });
      }

      if (isSpoilerFreeReview !== undefined) {
        return res.status(400).json({
          success: false,
          message:
            'A reply cannot be marked or updated as a spoiler-free review',
        });
      }

      if (
        chapterNumber !== undefined &&
        chapterNumber < parent.chapterNumber
      ) {
        return res.status(400).json({
          success: false,
          message:
            `A reply cannot be assigned to a chapter earlier than its parent comment ` +
            `(chapter ${parent.chapterNumber})`,
        });
      }
    }

    const book = await Book.findById(comment.book);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    if (chapterNumber !== undefined && chapterNumber > book.totalChapters) {
      return res.status(400).json({
        success: false,
        message: `Chapter number cannot be greater than total chapters (${book.totalChapters})`,
      });
    }

    if (text !== undefined) {
      comment.text = text;
    }

    if (chapterNumber !== undefined) {
      comment.chapterNumber = chapterNumber;
    }

    if (isSpoilerFreeReview !== undefined) {
      comment.isSpoilerFreeReview = isSpoilerFreeReview;
    }

    if (comment.parentComment) {
      comment.isSpoilerFreeReview = false;
    }

    await comment.save();

    const updatedComment = await Comment.findById(comment._id)
      .populate('user', 'username profileImage isDeleted')
      .populate('club', 'name')
      .populate('book', 'title author coverImage');

    res.status(200).json({
      success: true,
      data: updatedComment,
    });
  } catch (error) {
    next(error);
  }
};

// only comment creator can delete the comment.
// if the comment we want to delete has comments of its own:
//           mark the comment as deleted, 
//           the text changes to "This comment was deleted"
//           likes = 0 
// if it dosen't we delete it from the db
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can delete only your own comments',
      });
    }

    const club = await Club.findById(comment.club);

    if (!club || club.isArchived) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    if (comment.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Comment is already deleted',
      });
    }

    const repliesCount = await Comment.countDocuments({
      parentComment: comment._id,
    });

    if (repliesCount === 0) {
      await Comment.findByIdAndDelete(comment._id);

      return res.status(200).json({
        success: true,
        message: 'Comment permanently deleted',
        data: {
          _id: comment._id,
          deletedPermanently: true,
        },
      });
    }

    comment.text = 'This comment was deleted';
    comment.isDeleted = true;
    comment.deletedAt = new Date();
    comment.likes = [];

    await comment.save();

    res.status(200).json({
      success: true,
      message: 'Comment deleted but kept as placeholder because it has replies',
      data: {
        _id: comment._id,
        text: comment.text,
        isDeleted: comment.isDeleted,
        deletedAt: comment.deletedAt,
        deletedPermanently: false,
        repliesCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// adds or deletes a like from a comment
const toggleLikeComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    if (comment.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Deleted comments cannot be liked',
      });
    }

    const club = await Club.findById(comment.club);

    if (!club || club.isArchived) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    const isMember = club.members.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You must be a club member to like comments',
      });
    }

    const alreadyLiked = comment.likes.some(
      (userId) => userId.toString() === req.user._id.toString()
    );

    if (alreadyLiked) {
      comment.likes = comment.likes.filter(
        (userId) => userId.toString() !== req.user._id.toString()
      );
    } else {
      comment.likes.push(req.user._id);
    }

    await comment.save();

    res.status(200).json({
      success: true,
      message: alreadyLiked ? 'Comment unliked' : 'Comment liked',
      data: {
        _id: comment._id,
        likesCount: comment.likes.length,
        isLikedByMe: !alreadyLiked,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComment,
  getCommentsByBook,
  getPublicSpoilerFreeComments,
  getCommentById,
  updateComment,
  deleteComment,
  toggleLikeComment,
};