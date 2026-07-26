const Club = require('../models/Club');
const Poll = require('../models/Poll');
const PollVote = require('../models/PollVote');
const Book = require('../models/Book');
const ReadingProgress = require('../models/ReadingProgress');
const Comment = require('../models/Comment');
const cloudinary = require('../config/cloudinary');

const {
  safelyDeleteManagedBookCover,
} = require('../utils/cloudinaryImages');

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

    const filter = {
      isArchived: false,
    };

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
      isArchived: false,
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

    if (!club || club.isArchived) {
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

    if (!club || club.isArchived) {
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

    if (!club || club.isArchived) {
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
        message: 'Only the club creator can archive this club',
      });
    }

    /*
     * Archive first.
     *
     * If one of the cleanup operations fails afterward,
     * the club is still no longer accessible as an active club.
     *
     * We do not immediately return when the club is already archived,
     * so retrying the request can finish any cleanup that previously failed.
     */
    if (!club.isArchived) {
      club.isArchived = true;
      club.archivedAt = new Date();

      await club.save();
    }

    /*
     * Find every open poll.
     *
     * Normally there should only be one, but deleting all open polls
     * also handles unexpected duplicate data safely.
     */
    const openPolls = await Poll.find({
      club: club._id,
      status: 'open',
    });

    /*
     * Poll option images are temporary managed book-cover uploads.
     * Their deletion is best effort and should not prevent club archiving.
     */
    await Promise.all(
      openPolls.flatMap((poll) =>
        poll.options.map(async (option) => {
          if (!option.coverImagePublicId) {
            return;
          }

          await safelyDeleteManagedBookCover(
            option.coverImagePublicId,
            `poll option ${option._id} from archived club ${club._id}`
          );
        })
      )
    );

    const openPollIds = openPolls.map((poll) => poll._id);

    if (openPollIds.length > 0) {
      await PollVote.deleteMany({
        poll: { $in: openPollIds },
      });

      await Poll.deleteMany({
        _id: { $in: openPollIds },
      });
    }

    /*
 * Clean up announced winner books that were never applied
 * as the club's current book.
 *
 * These books were created from closed polls, but no reading
 * activity should exist for them because appliedAt was never set.
 */
    const unappliedWinnerPolls = await Poll.find({
      club: club._id,
      winnerBook: { $ne: null },
      appliedAt: null,
    });

    let deletedUnappliedWinnerBooks = 0;
    let deletedUnappliedWinnerPolls = 0;

    for (const poll of unappliedWinnerPolls) {
      const winnerBookId = poll.winnerBook;
      /*
      * Delete uploaded images that belong to the losing poll options.
      * The winner's image is handled later together with the winner book.
      */
      await Promise.all(
        poll.options.map(async (option) => {
          const isWinner =
            poll.winnerOption &&
            option._id.toString() === poll.winnerOption.toString();

          if (isWinner || !option.coverImagePublicId) {
            return;
          }

          await safelyDeleteManagedBookCover(
            option.coverImagePublicId,
            `losing poll option ${option._id} from archived club ${club._id}`
          );
        })
      );

      if (!winnerBookId) {
        continue;
      }

      /*
       * Extra safety checks:
       * never delete a book that is current, historical,
       * or already has user-generated data.
       */
      const isCurrentBook =
        club.currentBook &&
        club.currentBook.toString() === winnerBookId.toString();

      const isPreviousBook = club.previousBooks.some(
        (previousBookId) =>
          previousBookId.toString() === winnerBookId.toString()
      );

      const [hasReadingProgress, hasComments] = await Promise.all([
        ReadingProgress.exists({
          club: club._id,
          book: winnerBookId,
        }),
        Comment.exists({
          club: club._id,
          book: winnerBookId,
        }),
      ]);

      const isSafeToDelete =
        !isCurrentBook &&
        !isPreviousBook &&
        !hasReadingProgress &&
        !hasComments;

      if (!isSafeToDelete) {
        console.warn(
          `Skipped deleting unapplied winner book ${winnerBookId} ` +
          `from archived club ${club._id} because it is still referenced`
        );

        continue;
      }

      const winnerBook = await Book.findById(winnerBookId);

      if (winnerBook) {
        /*
         * Best-effort Cloudinary cleanup.
         * The helper safely ignores empty or unmanaged public ids.
         */
        await safelyDeleteManagedBookCover(
          winnerBook.coverImagePublicId,
          `unapplied winner book ${winnerBook._id} from archived club ${club._id}`
        );

        await Book.findByIdAndDelete(winnerBook._id);

        deletedUnappliedWinnerBooks += 1;
      }

      /*
       * Delete the unused poll too.
       *
       * Keeping it would leave poll.winnerBook pointing to a book
       * that no longer exists.
       */
      await PollVote.deleteMany({
        poll: poll._id,
      });

      await Poll.findByIdAndDelete(poll._id);

      deletedUnappliedWinnerPolls += 1;
    }

    /*
     * Keep progress for members who actually started the current book.
     * Remove chapter-0 progress because the user never started reading it.
     */
    let deletedProgressCount = 0;

    if (club.currentBook) {
      const progressDeletionResult = await ReadingProgress.deleteMany({
        club: club._id,
        book: club.currentBook,
        currentChapter: 0,
      });

      deletedProgressCount = progressDeletionResult.deletedCount || 0;
    }

    /*
     * An archived club is not displayed anywhere,
     * so its Cloudinary cover is no longer needed.
     *
     * Clear the database fields only after Cloudinary deletion succeeds.
     * If deletion fails, the public id remains available for a later retry.
     */
    if (club.coverImagePublicId) {
      try {
        await cloudinary.uploader.destroy(club.coverImagePublicId);

        club.coverImage = '';
        club.coverImagePublicId = '';

        await club.save();
      } catch (cleanupError) {
        console.error(
          'Failed to delete archived club cover image from Cloudinary:',
          cleanupError.message
        );
      }
    } else if (club.coverImage) {
      /*
       * This handles an old external image URL for which there is
       * no managed Cloudinary public id.
       */
      club.coverImage = '';
      await club.save();
    }

    res.status(200).json({
      success: true,
      message: 'Club archived successfully',
      data: {
        clubId: club._id,
        isArchived: true,
        archivedAt: club.archivedAt,
        deletedOpenPolls: openPollIds.length,
        deletedUnappliedWinnerBooks,
        deletedUnappliedWinnerPolls,
        deletedChapterZeroProgress: deletedProgressCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

const joinClub = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);

    if (!club || club.isArchived) {
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

    if (!club || club.isArchived) {
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

    if (!club || club.isArchived) {
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

const removeCurrentBook = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);

    if (!club || club.isArchived) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    if (club.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the club creator can remove the current book',
      });
    }

    if (!club.currentBook) {
      return res.status(400).json({
        success: false,
        message: 'This club does not have a current book',
      });
    }

    const currentBookId = club.currentBook;

    const book = await Book.findById(currentBookId);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Current book not found',
      });
    }

    if (book.club.toString() !== club._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'The current book does not belong to this club',
      });
    }

    const isPreviousBook = club.previousBooks.some(
      (previousBookId) =>
        previousBookId.toString() === currentBookId.toString()
    );

    if (isPreviousBook) {
      return res.status(400).json({
        success: false,
        message: 'A historical book cannot be removed',
      });
    }

    /*
     * Remove all club activity that belongs specifically
     * to this current book.
     *
     * Replies are also removed because every Comment document
     * stores both its club and book.
     */
    const [
      commentsDeletionResult,
      progressDeletionResult,
      pollUpdateResult,
    ] = await Promise.all([
      Comment.deleteMany({
        club: club._id,
        book: currentBookId,
      }),

      ReadingProgress.deleteMany({
        club: club._id,
        book: currentBookId,
      }),

      /*
       * Keep the poll and its votes as voting history,
       * but remove the reference to the Book document
       * that is about to be deleted.
       *
       * We intentionally keep appliedAt so the old poll
       * is not treated as waiting to be applied again.
       */
      Poll.updateMany(
        {
          club: club._id,
          winnerBook: currentBookId,
        },
        {
          $set: {
            winnerBook: null,
          },
        }
      ),
    ]);

    /*
     * Remove the club reference before deleting the Book document,
     * so club.currentBook never points to a deleted document.
     */
    club.currentBook = null;
    await club.save();

    await Book.findByIdAndDelete(currentBookId);

    /*
     * Cloudinary cleanup is best effort.
     *
     * A Google Books URL or any unmanaged image is ignored safely
     * by safelyDeleteManagedBookCover.
     */
    await safelyDeleteManagedBookCover(
      book.coverImagePublicId,
      `removed current book ${book._id} from club ${club._id}`
    );

    const updatedClub = await populateClub(club._id).select(
      '-coverImagePublicId'
    );

    res.status(200).json({
      success: true,
      message: 'Current book removed successfully',
      data: {
        club: updatedClub,
        deletedBookId: currentBookId,
        deletedComments:
          commentsDeletionResult.deletedCount || 0,
        deletedReadingProgress:
          progressDeletionResult.deletedCount || 0,
        updatedPolls:
          pollUpdateResult.modifiedCount || 0,
      },
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
  removeCurrentBook,
};
