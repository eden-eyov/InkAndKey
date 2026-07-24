const Joi = require('joi');

const objectIdSchema = Joi.string().hex().length(24);

const createCommentSchema = Joi.object({
  club: objectIdSchema.required().messages({
    'string.hex': 'Club id must be a valid MongoDB id',
    'string.length': 'Club id must be a valid MongoDB id',
    'any.required': 'Club id is required',
  }),

  book: objectIdSchema.required().messages({
    'string.hex': 'Book id must be a valid MongoDB id',
    'string.length': 'Book id must be a valid MongoDB id',
    'any.required': 'Book id is required',
  }),

  title: Joi.string().trim().max(120).allow('').default('').messages({
    'string.max': 'Title cannot exceed 120 characters',
  }),

  text: Joi.string().trim().min(1).max(2000).required().messages({
    'string.empty': 'Comment text is required',
    'string.min': 'Comment cannot be empty',
    'string.max': 'Comment cannot exceed 2000 characters',
    'any.required': 'Comment text is required',
  }),

  parentComment: objectIdSchema.allow(null).default(null).messages({
    'string.hex': 'Parent comment id must be a valid MongoDB id',
    'string.length': 'Parent comment id must be a valid MongoDB id',
  }),

  chapterNumber: Joi.when('parentComment', {
    is: Joi.string().hex().length(24).required(),
    then: Joi.number().integer().min(0).optional(),
    otherwise: Joi.number().integer().min(0).required(),
  }).messages({
    'number.base': 'Chapter number must be a number',
    'number.integer': 'Chapter number must be a whole number',
    'number.min': 'Chapter number cannot be negative',
    'any.required': 'Chapter number is required for a new discussion',
  }),

  isSpoilerFreeReview: Joi.when('parentComment', {
    is: Joi.string().hex().length(24).required(),
    then: Joi.forbidden(),
    otherwise: Joi.boolean().default(false),
  }).messages({
    'any.unknown':
      'A reply cannot be marked as a spoiler-free review',
  }),
});

const updateCommentSchema = Joi.object({
  title: Joi.string().trim().max(120).allow('').messages({
    'string.max': 'Title cannot exceed 120 characters',
  }),
  text: Joi.string().trim().min(1).max(2000).messages({
    'string.empty': 'Comment text cannot be empty',
    'string.min': 'Comment cannot be empty',
    'string.max': 'Comment cannot exceed 2000 characters',
  }),

  chapterNumber: Joi.number().integer().min(0).messages({
    'number.base': 'Chapter number must be a number',
    'number.integer': 'Chapter number must be a whole number',
    'number.min': 'Chapter number cannot be negative',
  }),

  isSpoilerFreeReview: Joi.boolean(),
}).min(1).messages({
  'object.min': 'At least one field is required for update',
});

module.exports = {
  createCommentSchema,
  updateCommentSchema,
};