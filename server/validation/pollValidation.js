const Joi = require('joi');
/**
 * Validation schema for announcing a poll winner.
 *
 * Purpose:
 * - Validate only the data needed when turning a winning poll option into a real Book.
 *
 * Expected input:
 * - optionId: optional. Used when the creator chooses a winner manually.
 * - totalChapters: required because spoiler filtering depends on chapters.
 * - Other book fields are optional overrides for the data already stored in the poll option.
 *
 * Important:
 * - The poll option already contains title, author, coverImage, and description.
 * - This schema does not create another database schema.
 * - It only validates req.body before the controller runs.
 */
const announcePollWinnerSchema = Joi.object({
    optionId: Joi.string().hex().length(24).optional().messages({
        'string.hex': 'Invalid poll option id',
        'string.length': 'Invalid poll option id',
    }),

    totalChapters: Joi.number().integer().min(1).required().messages({
        'number.base': 'Total chapters must be a number',
        'number.integer': 'Total chapters must be a whole number',
        'number.min': 'Book must have at least 1 chapter',
        'any.required': 'Total chapters is required',
    }),

    title: Joi.string().trim().min(1).max(150).optional(),

    author: Joi.string().trim().min(1).max(100).optional(),

    coverImage: Joi.string().trim().allow('').optional(),

    coverImagePublicId: Joi.string().trim().allow('').optional(),

    description: Joi.string().trim().max(3000).allow('').optional(),

    genres: Joi.array().items(Joi.string()).optional(),
});

/**
 * Validation schema for creating a new next-read poll.
 *
 * Purpose:
 * - Validate the request body before it reaches createPoll controller.
 *
 * Expected input:
 * - question: optional poll question.
 * - closesAt: required future date as string/date.
 * - options: required array with at least two book suggestions.
 *
 * Important:
 * - Each option is only a book suggestion, not a real Book document yet.
 * - The winning option can later become a real Book.
 */
const createPollSchema = Joi.object({
    question: Joi.string().trim().max(200).optional(),

    closesAt: Joi.date().greater('now').required().messages({
        'date.base': 'Poll closing date must be a valid date',
        'date.greater': 'Poll closing date must be in the future',
        'any.required': 'Poll closing date is required',
    }),

    options: Joi.array()
        .items(
            Joi.object({
                title: Joi.string().trim().min(1).max(150).required().messages({
                    'string.empty': 'Book title is required',
                    'any.required': 'Book title is required',
                }),

                author: Joi.string().trim().max(100).allow('').optional(),

                coverImage: Joi.string().trim().allow('').optional(),

                coverImagePublicId: Joi.string().trim().allow('').optional(),

                description: Joi.string().trim().max(3000).allow('').optional(),

                googleBooksId: Joi.string().trim().allow('').optional(),
            })
        )
        .min(2)
        .required()
        .messages({
            'array.min': 'Poll must have at least two options',
            'any.required': 'Poll options are required',
        }),
});

/**
 * Validation schema for voting in a poll.
 *
 * Purpose:
 * - Validate that the frontend sends the selected poll option id.
 *
 * Expected input:
 * - optionId: MongoDB ObjectId string of the selected option inside the poll.
 *
 * Output:
 * - Sanitized req.body if valid.
 */
const voteInPollSchema = Joi.object({
    optionId: Joi.string().hex().length(24).required().messages({
        'string.hex': 'Invalid poll option id',
        'string.length': 'Invalid poll option id',
        'any.required': 'Poll option id is required',
    }),
});

module.exports = {
    createPollSchema,
    voteInPollSchema,
    announcePollWinnerSchema,
};
