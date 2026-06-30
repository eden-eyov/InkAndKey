const mongoose = require('mongoose');

const pollOptionSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Book title is required'],
            trim: true,
            maxlength: [150, 'Book title cannot be longer than 150 characters'],
        },

        author: {
            type: String,
            trim: true,
            maxlength: [100, 'Author name cannot be longer than 100 characters'],
            default: '',
        },

        coverImage: {
            type: String,
            default: '',
        },

        coverImagePublicId: {
            type: String,
            trim: true,
            default: '',
        },

        description: {
            type: String,
            trim: true,
            maxlength: [3000, 'Description cannot be longer than 3000 characters'],
            default: '',
        },

        // Optional for later Google Books integration
        googleBooksId: {
            type: String,
            default: '',
        },
    },
    { _id: true }
);

const pollSchema = new mongoose.Schema(
    {
        club: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Club',
            required: [true, 'Poll must belong to a club'],
            index: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Poll must have a creator'],
        },

        question: {
            type: String,
            trim: true,
            default: 'What should we read next?',
            maxlength: [200, 'Poll question cannot be longer than 200 characters'],
        },

        options: {
            type: [pollOptionSchema],
            validate: {
                validator: function (options) {
                    return options.length >= 2;
                },
                message: 'Poll must have at least two options',
            },
        },

        closesAt: {
            type: Date,
            required: [true, 'Poll closing date is required'],
        },

        status: {
            type: String,
            enum: ['open', 'closed'],
            default: 'open',
            index: true,
        },

        // The poll option that was announced as the winner.
        winnerOption: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },

        // The real Book document created from the winning poll option.
        winnerBook: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Book',
            default: null,
        },

        // The date when the club creator announced the winning book.
        winnerAnnouncedAt: {
            type: Date,
            default: null,
        },

        // The date when the winnerBook was actually moved to club.currentBook.
        appliedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

// A club should usually have only one open poll at a time.
pollSchema.index({ club: 1, status: 1 });

module.exports = mongoose.model('Poll', pollSchema);
