const ReadingProgress = require('../models/readingProgress');
const Club = require('../models/club');
const Book = require('../models/book');

const upsertMyProgress = async (req, res, next) => {
  try {
    const { club: clubId, book: bookId, currentChapter, rating } = req.body;
    const userId = req.user._id;

    const club = await Club.findById(clubId);

    if (!club) {
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
        message: 'You must be a club member to update reading progress',
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

    const updateData = {
      currentChapter,
      isCompleted,
    };

    if (rating !== undefined) {
      updateData.rating = rating;
    }

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
        upsert: true,
        runValidators: true,
      }
    )
      .populate('user', 'username email profileImage')
      .populate('club', 'name image')
      .populate('book', 'title author coverImage totalChapters');

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
      .populate('club', 'name image')
      .populate('book', 'title author coverImage totalChapters')
      .sort({ updatedAt: -1 });

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
      .populate('club', 'name image')
      .populate('book', 'title author coverImage totalChapters');

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
  deleteMyProgress,
};