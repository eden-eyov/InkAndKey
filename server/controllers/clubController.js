const Club = require('../models/Club');
const Book = require('../models/Book');
const ReadingProgress = require('../models/ReadingProgress');
const cloudinary = require('../config/cloudinary');

const {
  finalizeOldBookProgress,
} = require('../utils/currentBookTransition');

const populateClub = (clubId) =>
  Club.findById(clubId)
    .populate('creator', 'username email profileImage')
    .populate('members', 'username profileImage')
    .populate('currentBook', 'title author coverImage totalChapters description averageRating ratingsCount')
    .populate('previousBooks', 'title author coverImage totalChapters description averageRating ratingsCount');

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

const createClub = async (req, res, next) => {
  try {
    const club = await Club.create({
      ...req.body,
      creator: req.user._id,
      members: [req.user._id],
    });

    res.status(201).json({
      success: true,
      data: club,
    });
  } catch (error) {
    next(error);
  }
};

const getAllClubs = async (req, res, next) => {
  try {
    const { search, genre, creator } = req.query;

    const filter = {};

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    if (genre) {
      filter.genres = genre;
    }

    let clubs = await Club.find(filter)
      .populate('creator', 'username email profileImage')
      .populate('members', 'username profileImage')
      .populate('currentBook', 'title author coverImage totalChapters description averageRating ratingsCount')
      .populate('previousBooks', 'title author coverImage totalChapters description averageRating ratingsCount')
      .sort({ createdAt: -1 });

    if (creator) {
      clubs = clubs.filter((club) =>
        club.creator?.username
          ?.toLowerCase()
          .includes(creator.toLowerCase())
      );
    }

    const discoverClubs = clubs.map((club) => ({
      _id: club._id,
      name: club.name,
      description: club.description,
      image: club.image,
      coverImage: club.coverImage,
      genres: club.genres,
      creator: club.creator,
      members: club.members,
      currentBook: club.currentBook,
      currentBookTitle: club.currentBook?.title || null,
      totalChapters: club.currentBook?.totalChapters || 0,
      previousBooks: club.previousBooks,
      createdAt: club.createdAt,
      updatedAt: club.updatedAt,
    }));

    res.status(200).json({
      success: true,
      count: discoverClubs.length,
      data: discoverClubs,
    });
  } catch (error) {
    next(error);
  }
};

const getMyClubs = async (req, res, next) => {
  try {
    const clubs = await Club.find({
      members: req.user._id,
    })
      .populate('creator', 'username email profileImage')
      .populate('members', 'username profileImage')
      .populate('currentBook', 'title author coverImage totalChapters description averageRating ratingsCount')
      .sort({ updatedAt: -1 });

    const dashboardClubs = await Promise.all(
      clubs.map(async (club) => {
        let userCurrentChapter = 0;
        let totalChapters = 0;
        let currentBookTitle = null;

        if (club.currentBook) {
          totalChapters = club.currentBook.totalChapters || 0;
          currentBookTitle = club.currentBook.title;

          const progress = await ReadingProgress.findOne({
            user: req.user._id,
            club: club._id,
            book: club.currentBook._id,
          });

          userCurrentChapter = progress ? progress.currentChapter : 0;
        }

        return {
          _id: club._id,
          name: club.name,
          description: club.description,
          image: club.image,
          coverImage: club.coverImage,
          genres: club.genres,
          creator: club.creator,
          members: club.members,
          currentBook: club.currentBook,
          currentBookTitle,
          totalChapters,
          userCurrentChapter,
          createdAt: club.createdAt,
          updatedAt: club.updatedAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: dashboardClubs.length,
      data: dashboardClubs,
    });
  } catch (error) {
    next(error);
  }
};

const getClubById = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('creator', 'username email profileImage')
      .populate('members', 'username profileImage')
      .populate('currentBook', 'title author coverImage totalChapters description averageRating ratingsCount')
      .populate('previousBooks', 'title author coverImage totalChapters description averageRating ratingsCount');

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    res.status(200).json({
      success: true,
      data: club,
    });
  } catch (error) {
    next(error);
  }
};

const updateClub = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    if (club.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the club creator can update this club',
      });
    }

    const updatedClub = await Club.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      data: updatedClub,
    });
  } catch (error) {
    next(error);
  }
};

const updateClubCoverImage = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    if (club.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the club creator can update the cover image',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Cover image file is required',
      });
    }

    const oldCoverImagePublicId = club.coverImagePublicId;

    const uploadedImage = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'livebook/club-cover-images',
    });

    club.coverImage = uploadedImage.secure_url;
    club.coverImagePublicId = uploadedImage.public_id;

    await club.save();

    if (
      oldCoverImagePublicId &&
      oldCoverImagePublicId !== uploadedImage.public_id
    ) {
      try {
        await cloudinary.uploader.destroy(oldCoverImagePublicId);
      } catch (cleanupError) {
        console.error(
          'Failed to delete old club cover image from Cloudinary:',
          cleanupError.message
        );
      }
    }

    const updatedClub = await populateClub(club._id).select(
      '-coverImagePublicId'
    );

    res.status(200).json({
      success: true,
      message: 'Club cover image updated successfully',
      data: updatedClub,
    });
  } catch (error) {
    next(error);
  }
};

const deleteClub = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    if (club.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the club creator can delete this club',
      });
    }

    await Club.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Club deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const joinClub = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    const isAlreadyMember = club.members.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );

    if (isAlreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this club',
      });
    }

    club.members.push(req.user._id);
    await club.save();

    const updatedClub = await populateClub(club._id);

    res.status(200).json({
      success: true,
      message: 'Joined club successfully',
      data: updatedClub,
    });
  } catch (error) {
    next(error);
  }
};

const leaveClub = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    if (club.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Club creator cannot leave their own club',
      });
    }

    const isMember = club.members.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this club',
      });
    }

    club.members = club.members.filter(
      (memberId) => memberId.toString() !== req.user._id.toString()
    );

    await club.save();

    const updatedClub = await populateClub(club._id);

    res.status(200).json({
      success: true,
      message: 'Left club successfully',
      data: updatedClub,
    });
  } catch (error) {
    next(error);
  }
};

const setCurrentBook = async (req, res, next) => {
  try {
    const { book: bookId } = req.body;

    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    if (club.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the club creator can set the current book',
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

    const currentBookId = club.currentBook
      ? club.currentBook.toString()
      : null;
    const newBookId = book._id.toString();

    if (currentBookId && currentBookId !== newBookId) {
      await finalizeOldBookProgress({
        clubId: club._id,
        oldBookId: club.currentBook,
      });
      
      const alreadyInPreviousBooks = club.previousBooks.some(
        (previousBookId) => previousBookId.toString() === currentBookId
      );

      if (!alreadyInPreviousBooks) {
        club.previousBooks.push(club.currentBook);
      }
    }

    club.previousBooks = club.previousBooks.filter(
      (previousBookId) => previousBookId.toString() !== newBookId
    );

    club.currentBook = book._id;

    await club.save();

    /**
     * Create reading progress for every club member
     * when a book becomes the current book.
     *
     * We use bulkWrite with upsert so:
     * - members who do not have progress yet get chapter 0
     * - members who already have progress keep their existing progress
     */
    if (club.members.length > 0) {
      const progressOperations = club.members.map((memberId) => ({
        updateOne: {
          filter: {
            user: memberId,
            club: club._id,
            book: book._id,
          },
          update: {
            $setOnInsert: {
              user: memberId,
              club: club._id,
              book: book._id,
              currentChapter: 0,
              isCompleted: false,
              rating: null,
            },
          },
          upsert: true,
        },
      }));

      await ReadingProgress.bulkWrite(progressOperations);
    }

    const updatedClub = await Club.findById(club._id)
      .populate('creator', 'username email profileImage')
      .populate('members', 'username profileImage')
      .populate('currentBook', 'title author coverImage totalChapters description averageRating ratingsCount')
      .populate('previousBooks', 'title author coverImage totalChapters description averageRating ratingsCount');

    res.status(200).json({
      success: true,
      message: 'Current book updated successfully',
      data: updatedClub,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createClub,
  getAllClubs,
  getMyClubs,
  getClubById,
  updateClub,
  updateClubCoverImage,
  deleteClub,
  joinClub,
  leaveClub,
  setCurrentBook,
};
