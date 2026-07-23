const Poll = require('../models/Poll');
const PollVote = require('../models/PollVote');
const Club = require('../models/Club');
const Book = require('../models/Book');
const ReadingProgress = require('../models/ReadingProgress');
const {
    safelyDeleteManagedBookCover,
} = require('../utils/cloudinaryImages');
const {
    finalizeOldBookProgress,
} = require('../utils/currentBookTransition');
/**
 * Builds a clean poll response for the frontend.
 *
 * Purpose:
 * - Convert a Poll document + related votes into frontend-friendly data.
 * - Calculate total votes, votes per option, percentages, and current user's vote.
 *
 * Input:
 * - poll: a Poll document
 * - userId: the logged-in user's id
 *
 * Output:
 * - A plain object with poll details, voting status, and calculated results.
 *
 * Important:
 * - This helper does not send a response by itself.
 * - It is reused by getCurrentPoll and voteInPoll so the frontend receives a consistent shape.
 */
const formatPollResponse = async (poll, userId) => {
    const votes = await PollVote.find({ poll: poll._id });

    const totalVotes = votes.length;

    const userVote = votes.find(
        (vote) => vote.user.toString() === userId.toString()
    );

    const options = poll.options.map((option) => {
        const votesCount = votes.filter(
            (vote) => vote.option.toString() === option._id.toString()
        ).length;

        const percentage =
            totalVotes === 0 ? 0 : Math.round((votesCount / totalVotes) * 100);

        return {
            optionId: option._id,
            title: option.title,
            author: option.author,
            coverImage: option.coverImage,
            coverImagePublicId: option.coverImagePublicId,
            description: option.description,
            googleBooksId: option.googleBooksId,
            votesCount,
            percentage,
        };
    });

    return {
        _id: poll._id,
        club: poll.club,
        createdBy: poll.createdBy,
        question: poll.question,
        closesAt: poll.closesAt,
        status: poll.status,
        winnerOption: poll.winnerOption,
        winnerBook: poll.winnerBook,
        winnerAnnouncedAt: poll.winnerAnnouncedAt,
        appliedAt: poll.appliedAt,
        userHasVoted: Boolean(userVote),
        userVoteOptionId: userVote ? userVote.option : null,
        totalVotes,
        options,
    };
};

/**
 * Checks whether the logged-in user is the creator of the club.
 *
 * Purpose:
 * - Protect actions that only the club creator can perform.
 *
 * Input:
 * - club: a Club document
 * - userId: the logged-in user's id
 *
 * Output:
 * - true if the user is the creator, false otherwise.
 */
const isClubCreator = (club, userId) => {
    return club.creator.toString() === userId.toString();
};

/**
 * Checks whether the logged-in user is a member of the club.
 *
 * Purpose:
 * - Allow only club members to vote in the poll.
 * - The creator is also treated as a member for permission purposes.
 *
 * Input:
 * - club: a Club document
 * - userId: the logged-in user's id
 *
 * Output:
 * - true if the user is a member or the creator, false otherwise.
 */
const isClubMember = (club, userId) => {
    const isCreator = club.creator.toString() === userId.toString();

    const isMember = club.members.some(
        (memberId) => memberId.toString() === userId.toString()
    );

    return isCreator || isMember;
};

/**
 * Finds the winning poll option by vote count.
 *
 * Purpose:
 * - Calculate which poll option received the highest number of votes.
 * - Detect edge cases like no votes or a tie.
 *
 * Input:
 * - poll: a Poll document
 *
 * Output:
 * - winnerOptionId: the ObjectId of the winning option, or null
 * - errorMessage: explanation if the winner cannot be selected automatically
 *
 * Important:
 * - If there are no votes, the creator must choose a winner manually.
 * - If there is a tie, the creator must choose a winner manually.
 */
const getAutomaticWinnerOptionId = async (poll) => {
    const results = await PollVote.aggregate([
        {
            $match: {
                poll: poll._id,
            },
        },
        {
            $group: {
                _id: '$option',
                votesCount: { $sum: 1 },
            },
        },
        {
            $sort: {
                votesCount: -1,
            },
        },
    ]);

    if (results.length === 0) {
        return {
            winnerOptionId: null,
            errorMessage: 'This poll has no votes. Please choose a winner manually.',
        };
    }

    const highestVotes = results[0].votesCount;

    const tiedOptions = results.filter(
        (result) => result.votesCount === highestVotes
    );

    if (tiedOptions.length > 1) {
        return {
            winnerOptionId: null,
            errorMessage: 'This poll has a tie. Please choose the winner manually.',
        };
    }

    return {
        winnerOptionId: results[0]._id,
        errorMessage: null,
    };
};

/**
 * @desc    Create a new poll for choosing the club's next book.
 * @route   POST /api/clubs/:clubId/polls
 * @access  Private - club creator only
 *
 * Purpose:
 * - Let the club creator create a new "next read" poll.
 *
 * Input:
 * - req.params.clubId
 * - req.body.question
 * - req.body.options: array of book suggestions
 * - req.body.closesAt: date/time when the poll closes
 *
 * Output:
 * - 201 Created
 * - The created poll formatted for the frontend.
 *
 * Important:
 * - Only the club creator can create a poll.
 * - A club can have only one open poll at a time.
 * - A poll must have at least two options.
 */
const createPoll = async (req, res, next) => {
    try {
        const { clubId } = req.params;
        const { question, options, closesAt } = req.body;

        const club = await Club.findById(clubId);

        if (!club) {
            return res.status(404).json({
                success: false,
                message: 'Club not found',
            });
        }

        if (!isClubCreator(club, req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Only the club creator can create a poll',
            });
        }

        const existingOpenPoll = await Poll.findOne({
            club: clubId,
            status: 'open',
        });

        if (existingOpenPoll) {
            return res.status(400).json({
                success: false,
                message: 'This club already has an open poll',
            });
        }

        if (!Array.isArray(options) || options.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Poll must have at least two options',
            });
        }

        const closingDate = new Date(closesAt);

        if (Number.isNaN(closingDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid closing date',
            });
        }

        if (closingDate <= new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Poll closing date must be in the future',
            });
        }

        const poll = await Poll.create({
            club: clubId,
            createdBy: req.user._id,
            question,
            options,
            closesAt: closingDate,
        });

        const formattedPoll = await formatPollResponse(poll, req.user._id);

        res.status(201).json({
            success: true,
            data: formattedPoll,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get the current open poll for a club.
 * @route   GET /api/clubs/:clubId/polls/current
 * @access  Private - club members only
 *
 * Purpose:
 * - Display the active poll on the club page.
 * - If the user already voted, the frontend can show live results.
 *
 * Input:
 * - req.params.clubId
 *
 * Output:
 * - 200 OK
 * - Current poll formatted with vote counts, percentages, and user's vote status.
 *
 * Important:
 * - If the poll's closesAt date has passed, this function automatically marks it as closed.
 */
const getCurrentPoll = async (req, res, next) => {
    try {
        const { clubId } = req.params;

        const club = await Club.findById(clubId);

        if (!club) {
            return res.status(404).json({
                success: false,
                message: 'Club not found',
            });
        }

        if (!isClubMember(club, req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Only club members can view this poll',
            });
        }

        const poll = await Poll.findOne({
            club: clubId,
            status: 'open',
        });

        if (!poll) {
            return res.status(404).json({
                success: false,
                message: 'No open poll found for this club',
            });
        }

        // If the poll has expired, close it before returning it.
        if (poll.closesAt <= new Date()) {
            poll.status = 'closed';
            await poll.save();
        }

        const formattedPoll = await formatPollResponse(poll, req.user._id);

        res.status(200).json({
            success: true,
            data: formattedPoll,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Vote in a club poll.
 * @route   POST /api/clubs/:clubId/polls/:pollId/vote
 * @access  Private - club members only
 *
 * Purpose:
 * - Let a club member vote for one poll option.
 * - After a successful vote, return updated results.
 * - Later, this is also where we emit a Socket.io event to update everyone live.
 *
 * Input:
 * - req.params.clubId
 * - req.params.pollId
 * - req.body.optionId
 *
 * Output:
 * - 201 Created
 * - Updated poll results.
 *
 * Important:
 * - Each user can vote only once per poll.
 * - The unique index in PollVote also protects this rule at database level.
 * - Users cannot vote after the poll is closed or expired.
 */
const voteInPoll = async (req, res, next) => {
    try {
        const { clubId, pollId } = req.params;
        const { optionId } = req.body;

        const club = await Club.findById(clubId);

        if (!club) {
            return res.status(404).json({
                success: false,
                message: 'Club not found',
            });
        }

        if (!isClubMember(club, req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Only club members can vote in this poll',
            });
        }

        const poll = await Poll.findOne({
            _id: pollId,
            club: clubId,
        });

        if (!poll) {
            return res.status(404).json({
                success: false,
                message: 'Poll not found',
            });
        }

        if (poll.status !== 'open') {
            return res.status(400).json({
                success: false,
                message: 'This poll is already closed',
            });
        }

        if (poll.closesAt <= new Date()) {
            poll.status = 'closed';
            await poll.save();

            return res.status(400).json({
                success: false,
                message: 'This poll has expired',
            });
        }

        const selectedOption = poll.options.id(optionId);

        if (!selectedOption) {
            return res.status(400).json({
                success: false,
                message: 'Invalid poll option',
            });
        }

        const vote = await PollVote.create({
            poll: poll._id,
            club: club._id,
            user: req.user._id,
            option: selectedOption._id,
        });

        const formattedPoll = await formatPollResponse(poll, req.user._id);

        res.status(201).json({
            success: true,
            data: formattedPoll,
        });
    } catch (error) {
        // Mongo duplicate key error.
        // This happens if the same user tries to vote twice in the same poll.
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'You have already voted in this poll',
            });
        }

        next(error);
    }
};

/**
 * @desc    Close a poll manually.
 * @route   PATCH /api/clubs/:clubId/polls/:pollId/close
 * @access  Private - club creator only
 *
 * Purpose:
 * - Let the club creator close the poll before or after the closing date.
 *
 * Input:
 * - req.params.clubId
 * - req.params.pollId
 *
 * Output:
 * - 200 OK
 * - Closed poll with final results.
 *
 * Important:
 * - Closing the poll does not automatically set the winning book as currentBook.
 * - We will handle "apply winner" separately, because the creator may want to confirm it first.
 */
const closePoll = async (req, res, next) => {
    try {
        const { clubId, pollId } = req.params;

        const club = await Club.findById(clubId);

        if (!club) {
            return res.status(404).json({
                success: false,
                message: 'Club not found',
            });
        }

        if (!isClubCreator(club, req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Only the club creator can close this poll',
            });
        }

        const poll = await Poll.findOne({
            _id: pollId,
            club: clubId,
        });

        if (!poll) {
            return res.status(404).json({
                success: false,
                message: 'Poll not found',
            });
        }

        poll.status = 'closed';
        await poll.save();

        const formattedPoll = await formatPollResponse(poll, req.user._id);

        res.status(200).json({
            success: true,
            data: formattedPoll,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Announce the winning book of a poll.
 * @route   POST /api/clubs/:clubId/polls/:pollId/announce-winner
 * @access  Private - club creator only
 *
 * Purpose:
 * - Let the club creator announce the next book chosen by the poll.
 * - Create a real Book document from the winning poll option.
 * - Save the created Book on the poll as winnerBook.
 *
 * Input:
 * - req.params.clubId
 * - req.params.pollId
 * - req.body.optionId: optional, used for manual winner selection
 * - req.body.totalChapters: required
 * - req.body.title: optional override
 * - req.body.author: optional override
 * - req.body.coverImage: optional override
 * - req.body.description: optional override
 * - req.body.genres: optional
 *
 * Output:
 * - 201 Created
 * - Updated poll and created winner book.
 *
 * Important:
 * - This function does NOT change club.currentBook yet.
 * - The creator can later call setWinnerBookAsCurrent when the club is ready.
 * - The poll option already contains basic book details.
 * - The request body only has to provide totalChapters, plus optional corrections.
 */
const announcePollWinner = async (req, res, next) => {
    try {
        const { clubId, pollId } = req.params;

        const {
            optionId,
            totalChapters,
            title,
            author,
            coverImage,
            description,
            genres,
        } = req.body;

        const club = await Club.findById(clubId);

        if (!club) {
            return res.status(404).json({
                success: false,
                message: 'Club not found',
            });
        }

        if (!isClubCreator(club, req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Only the club creator can announce the poll winner',
            });
        }

        const poll = await Poll.findOne({
            _id: pollId,
            club: clubId,
        });

        if (!poll) {
            return res.status(404).json({
                success: false,
                message: 'Poll not found',
            });
        }

        if (poll.winnerBook) {
            return res.status(400).json({
                success: false,
                message: 'This poll already has an announced winner',
            });
        }

        let winnerOptionId = optionId;

        // If the creator did not choose manually, calculate the winner by votes.
        if (!winnerOptionId) {
            const automaticWinner = await getAutomaticWinnerOptionId(poll);

            if (automaticWinner.errorMessage) {
                return res.status(400).json({
                    success: false,
                    message: automaticWinner.errorMessage,
                });
            }

            winnerOptionId = automaticWinner.winnerOptionId;
        }

        const winnerOption = poll.options.id(winnerOptionId);

        if (!winnerOption) {
            return res.status(400).json({
                success: false,
                message: 'Invalid winner option',
            });
        }

        /**
         * Create the real Book document.
         *
         * The poll option is the base data.
         * The request body can override details if the creator corrected them.
         */
        const coverImageWasOverridden =
            coverImage !== undefined && coverImage !== winnerOption.coverImage;
        const resolvedCoverImage = coverImageWasOverridden
            ? coverImage
            : winnerOption.coverImage;
        const resolvedCoverImagePublicId =
            coverImageWasOverridden ? '' : winnerOption.coverImagePublicId;

        const winnerBook = await Book.create({
            title: title || winnerOption.title,
            author: author || winnerOption.author,
            coverImage: resolvedCoverImage,
            coverImagePublicId: resolvedCoverImagePublicId,
            description:
                description !== undefined ? description : winnerOption.description,
            genres: genres || [],
            totalChapters,
            club: club._id,
        });

        poll.status = 'closed';
        poll.winnerOption = winnerOption._id;
        poll.winnerBook = winnerBook._id;
        poll.winnerAnnouncedAt = new Date();

        if (coverImageWasOverridden && winnerOption.coverImagePublicId) {
            await safelyDeleteManagedBookCover(
                winnerOption.coverImagePublicId,
                `overridden winning poll option cover ${winnerOption._id}`
            );

            winnerOption.coverImage = resolvedCoverImage;
            winnerOption.coverImagePublicId = '';
        }

        await poll.save();

        const formattedPoll = await formatPollResponse(poll, req.user._id);

        res.status(201).json({
            success: true,
            message: 'Poll winner announced successfully',
            data: {
                poll: formattedPoll,
                winnerBook,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Set the announced winner book as the club's current book.
 * @route   PATCH /api/clubs/:clubId/polls/:pollId/set-winner-current
 * @access  Private - club creator only
 *
 * Purpose:
 * - Start reading the already announced winner book.
 * - Move the old currentBook to previousBooks.
 * - Set poll.winnerBook as club.currentBook.
 * - Create initial ReadingProgress documents for club members.
 *
 * Input:
 * - req.params.clubId
 * - req.params.pollId
 *
 * Output:
 * - 200 OK
 * - Updated club and updated poll.
 *
 * Important:
 * - This function does not create a Book.
 * - The Book was already created by announcePollWinner.
 * - This function can only run once per poll.
 */
const setWinnerBookAsCurrent = async (req, res, next) => {
    try {
        const { clubId, pollId } = req.params;

        const club = await Club.findById(clubId);

        if (!club) {
            return res.status(404).json({
                success: false,
                message: 'Club not found',
            });
        }

        if (!isClubCreator(club, req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Only the club creator can set the winner as current book',
            });
        }

        const poll = await Poll.findOne({
            _id: pollId,
            club: clubId,
        }).populate('winnerBook');

        if (!poll) {
            return res.status(404).json({
                success: false,
                message: 'Poll not found',
            });
        }

        if (!poll.winnerBook) {
            return res.status(400).json({
                success: false,
                message: 'This poll does not have an announced winner book yet',
            });
        }

        if (poll.appliedAt) {
            return res.status(400).json({
                success: false,
                message: 'This poll winner was already set as current book',
            });
        }

        const winnerBook = poll.winnerBook;

        if (winnerBook.club.toString() !== club._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Winner book does not belong to this club',
            });
        }

        const currentBookId = club.currentBook
            ? club.currentBook.toString()
            : null;
        const winnerBookId = winnerBook._id.toString();

        /**
         * Move the current book to previousBooks,
         * but only if it is different from the winner book
         * and not already stored there.
         */
        if (currentBookId && currentBookId !== winnerBookId) {
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

        // If the winner was somehow in previousBooks, remove it from there.
        club.previousBooks = club.previousBooks.filter(
            (previousBookId) => previousBookId.toString() !== winnerBookId
        );

        club.currentBook = winnerBook._id;

        await club.save();

        /**
         * Create reading progress for every club member
         * when the winner book becomes the current book.
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
                        book: winnerBook._id,
                    },
                    update: {
                        $setOnInsert: {
                            user: memberId,
                            club: club._id,
                            book: winnerBook._id,
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

        poll.appliedAt = new Date();
        await poll.save();

        /**
         * Uploaded poll-option covers are temporary until a winner becomes
         * the current book. Keep the winner's image, and best-effort delete
         * losing option images that were uploaded through our managed endpoint.
         */
        let cleanedLosingOptionImages = false;

        await Promise.all(
            poll.options.map(async (option) => {
                const isWinningOption =
                    option._id.toString() === poll.winnerOption.toString();

                if (isWinningOption || !option.coverImagePublicId) {
                    return;
                }

                await safelyDeleteManagedBookCover(
                    option.coverImagePublicId,
                    `losing poll option cover ${option._id}`
                );

                option.coverImage = '';
                option.coverImagePublicId = '';
                cleanedLosingOptionImages = true;
            })
        );

        if (cleanedLosingOptionImages) {
            await poll.save();
        }

        const updatedClub = await Club.findById(club._id)
            .populate('creator', 'username email profileImage')
            .populate('members', 'username profileImage')
            .populate('currentBook', 'title author coverImage totalChapters description')
            .populate('previousBooks', 'title author coverImage totalChapters description');

        const formattedPoll = await formatPollResponse(poll, req.user._id);

        res.status(200).json({
            success: true,
            message: 'Winner book set as current book successfully',
            data: {
                club: updatedClub,
                poll: formattedPoll,
            },
        });
    } catch (error) {
        next(error);
    }
};
/**
 * @desc    Get all polls for a club.
 * @route   GET /api/clubs/:clubId/polls
 * @access  Private - club members only
 *
 * Purpose:
 * - Let club members see poll history.
 * - Useful later for showing previous voting results.
 *
 * Input:
 * - req.params.clubId
 *
 * Output:
 * - 200 OK
 * - Array of polls, newest first.
 *
 * Important:
 * - This returns both open and closed polls.
 */
const getClubPolls = async (req, res, next) => {
    try {
        const { clubId } = req.params;

        const club = await Club.findById(clubId);

        if (!club) {
            return res.status(404).json({
                success: false,
                message: 'Club not found',
            });
        }

        if (!isClubMember(club, req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Only club members can view this club poll history',
            });
        }

        const polls = await Poll.find({ club: clubId })
            .sort({ createdAt: -1 })
            .populate('winnerBook', 'title author coverImage totalChapters description');
        const formattedPolls = await Promise.all(
            polls.map((poll) => formatPollResponse(poll, req.user._id))
        );

        res.status(200).json({
            success: true,
            count: formattedPolls.length,
            data: formattedPolls,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get open polls from the logged-in user's clubs.
 * @route   GET /api/polls/my-active-polls
 * @access  Private
 *
 * Purpose:
 * - Let the dashboard show active polls across clubs the user belongs to.
 * - Include clubs created by the user even if older data missed the members list.
 */
const getMyActivePolls = async (req, res, next) => {
    try {
        const now = new Date();

        const clubs = await Club.find({
            $or: [
                { members: req.user._id },
                { creator: req.user._id },
            ],
        }).select('_id name');

        const clubIds = clubs.map((club) => club._id);

        if (clubIds.length === 0) {
            return res.status(200).json({
                success: true,
                count: 0,
                data: [],
            });
        }

        await Poll.updateMany(
            {
                club: { $in: clubIds },
                status: 'open',
                closesAt: { $lte: now },
            },
            {
                $set: {
                    status: 'closed',
                },
            }
        );

        const polls = await Poll.find({
            club: { $in: clubIds },
            status: 'open',
            closesAt: { $gt: now },
        })
            .sort({ closesAt: 1 })
            .populate('club', 'name');

        const formattedPolls = await Promise.all(
            polls.map(async (poll) => {
                const formattedPoll = await formatPollResponse(poll, req.user._id);
                const pollClub = poll.club;

                return {
                    ...formattedPoll,
                    clubId: pollClub?._id,
                    clubName: pollClub?.name || '',
                    club: pollClub
                        ? {
                            _id: pollClub._id,
                            name: pollClub.name,
                        }
                        : formattedPoll.club,
                };
            })
        );

        res.status(200).json({
            success: true,
            count: formattedPolls.length,
            data: formattedPolls,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createPoll,
    getCurrentPoll,
    voteInPoll,
    closePoll,
    announcePollWinner,
    setWinnerBookAsCurrent,
    getClubPolls,
    getMyActivePolls,
};
