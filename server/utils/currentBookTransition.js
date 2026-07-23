const ReadingProgress = require('../models/ReadingProgress');

/**
 * Handles the reading-progress records of the old current book
 * before the club moves to a new current book.
 *
 * Rules:
 * - Never started: delete the progress record.
 * - Started but not completed: mark as DNF.
 * - Completed: keep as completed.
 */
const finalizeOldBookProgress = async ({ clubId, oldBookId }) => {
  if (!oldBookId) {
    return;
  }

  const progressList = await ReadingProgress.find({
    club: clubId,
    book: oldBookId,
  });

  const progressIdsToDelete = [];
  const progressIdsToMarkAsDnf = [];

  progressList.forEach((progress) => {
    const hasCompletedBook =
      progress.isCompleted || progress.status === 'completed';

    if (hasCompletedBook) {
      return;
    }

    if (progress.currentChapter <= 0) {
      progressIdsToDelete.push(progress._id);
      return;
    }

    progressIdsToMarkAsDnf.push(progress._id);
  });

  if (progressIdsToDelete.length > 0) {
    await ReadingProgress.deleteMany({
      _id: { $in: progressIdsToDelete },
    });
  }

  if (progressIdsToMarkAsDnf.length > 0) {
    await ReadingProgress.updateMany(
      {
        _id: { $in: progressIdsToMarkAsDnf },
      },
      {
        $set: {
          status: 'dnf',
          isCompleted: false,
        },
      }
    );
  }
};

module.exports = {
  finalizeOldBookProgress,
};