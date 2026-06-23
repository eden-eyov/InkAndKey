const mongoose = require('mongoose');

const pollVoteSchema = new mongoose.Schema(
    {
        poll: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Poll',
            required: [true, 'Vote must belong to a poll'],
            index: true,
        },

        club: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Club',
            required: [true, 'Vote must belong to a club'],
            index: true,
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Vote must belong to a user'],
            index: true,
        },

        option: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'Vote must reference a poll option'],
        },
    },
    { timestamps: true }
);

// This is the important part:
// one user can vote only once per poll.
pollVoteSchema.index(
    { poll: 1, user: 1 },
    { unique: true }
);

module.exports = mongoose.model('PollVote', pollVoteSchema);