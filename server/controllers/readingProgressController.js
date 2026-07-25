const ReadingProgress = require('../models/ReadingProgress');
const Club = require('../models/Club');
const Book = require('../models/Book');

const recalculateBookRating = async (bookId) => {
  const ratingStats = await ReadingProgress.aggregate([
    {
      $match: {
        book: bookId,
        rating: { $ne: null },
        status: 'completed',
        isCompleted: true,
      },
    },
    {
      $group: {
        _id: '$book',
        averageRating: { $avg: '$rating' },
        ratingsCount: { $sum: 1 },
      },
    },
  ]);

  const stats = ratingStats[0];

  const averageRating = stats
    ? Math.round(stats.averageRating * 10) / 10
    : 0;

  const ratingsCount = stats ? stats.ratingsCount : 0;

  await Book.findByIdAndUpdate(
    bookId,
    {
      averageRating,
      ratingsCount,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  return {
    averageRating,
    ratingsCount,
  };
};

const upsertMyProgress = async (req, res, next) => {
  try {
    const { club: clubId, book: bookId, currentChapter } = req.body;
    const userId = req.user._id;

    const club = await Club.findById(clubId);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    /*
     * Check whether the user already has progress for this exact
     * user + club + book combination.
     *
     * For archived clubs:
     * - existing progress may still be updated
     * - new progress must not be created
     */
    const existingProgress = await ReadingProgress.findOne({
      user: userId,
      club: clubId,
      book: bookId,
    });

    if (club.isArchived) {
      if (!existingProgress) {
        return res.status(404).json({
          success: false,
          message: 'Reading progress not found',
        });
      }
    } else {
      const isMember = club.members.some(
        (memberId) => memberId.toString() === userId.toString()
      );

      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'You must be a club member to update reading progress',
        });
      }
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
        message: 'This book does not belong to the selected club',
      });
    }

    if (currentChapter > book.totalChapters) {
      return res.status(400).json({
        success: false,
        message: `Current chapter cannot be greater than total chapters (${book.totalChapters})`,
      });
    }

    const isCompleted = currentChapter >= book.totalChapters;

    const status = isCompleted ? 'completed' : 'reading';

    const updateData = {
      currentChapter,
      isCompleted,
      status,
    };

    const progress = await ReadingProgress.findOneAndUpdate(
      {
        user: userId,
        club: clubId,
        book: bookId,
      },
      {
        $set: updateData,
        $setOnInsert: {
          user: userId,
          club: clubId,
          book: bookId,
        },
      },
      {
        new: true,
        upsert: !club.isArchived,
        runValidators: true,
      }
    )
      .populate('user', 'username email profileImage')
      .populate('club', 'name image isArchived')
      .populate(
        'book',
        'title author coverImage totalChapters description averageRating ratingsCount'
      )
    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

const getMyProgress = async (req, res, next) => {
  try {
    const { club, book } = req.query;

    const filter = {
      user: req.user._id,
    };

    if (club) {
      filter.club = club;
    }

    if (book) {
      filter.book = book;
    }

    const progressList = await ReadingProgress.find(filter)
      .populate('club', 'name image isArchived')
      .populate(
        'book',
        'title author coverImage totalChapters description averageRating ratingsCount'
      ).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: progressList.length,
      data: progressList,
    });
  } catch (error) {
    next(error);
  }
};

const getMyProgressById = async (req, res, next) => {
  try {
    const progress = await ReadingProgress.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate('club', 'name image isArchived')
      .populate(
        'book',
        'title author coverImage totalChapters description averageRating ratingsCount'
      );

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Reading progress not found',
      });
    }

    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

const markMyProgressAsDnf = async (req, res, next) => {
  try {
    const progress = await ReadingProgress.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Reading progress not found',
      });
    }

    if (progress.isCompleted || progress.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Completed books cannot be marked as DNF',
      });
    }

    if (progress.currentChapter <= 0) {
      return res.status(400).json({
        success: false,
        message: 'You can only mark a book as DNF after starting it',
      });
    }

    progress.status = 'dnf';
    progress.isCompleted = false;

    await progress.save();

    const updatedProgress = await ReadingProgress.findById(progress._id)
      .populate('user', 'username email profileImage')
      .populate('club', 'name image isArchived')
      .populate(
        'book',
        'title author coverImage totalChapters description averageRating ratingsCount'
      )
    res.status(200).json({
      success: true,
      message: 'Book marked as DNF',
      data: updatedProgress,
    });
  } catch (error) {
    next(error);
  }
};

const rateMyCompletedBook = async (req, res, next) => {
  try {
    const { rating } = req.body;

    if (rating === undefined || rating === null) {
      return res.status(400).json({
        success: false,
        message: 'Rating is required',
      });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5',
      });
    }

    const progress = await ReadingProgress.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Reading progress not found',
      });
    }

    if (!progress.isCompleted || progress.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'You can only rate books you have completed',
      });
    }

    progress.rating = rating;
    await progress.save();

    const ratingStats = await recalculateBookRating(progress.book);

    const updatedProgress = await ReadingProgress.findById(progress._id)
      .populate('user', 'username email profileImage')
      .populate('club', 'name image isArchived')
      .populate(
        'book',
        'title author coverImage totalChapters description averageRating ratingsCount'
      );

    res.status(200).json({
      success: true,
      message: 'Book rating saved successfully',
      data: updatedProgress,
      bookRating: ratingStats,
    });
  } catch (error) {
    next(error);
  }
};

const deleteMyProgress = async (req, res, next) => {
  try {
    const progress = await ReadingProgress.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Reading progress not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reading progress deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upsertMyProgress,
  getMyProgress,
  getMyProgressById,
  markMyProgressAsDnf,
  rateMyCompletedBook,
  deleteMyProgress,
};
