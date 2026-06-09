const Joi = require('joi');

const objectIdSchema = Joi.string().hex().length(24);

const upsertReadingProgressSchema = Joi.object({
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

  currentChapter: Joi.number().integer().min(0).required().messages({
    'number.base': 'Current chapter must be a number',
    'number.integer': 'Current chapter must be a whole number',
    'number.min': 'Current chapter cannot be negative',
    'any.required': 'Current chapter is required',
  }),

  isCompleted: Joi.boolean().default(false),

  rating: Joi.number().integer().min(1).max(5).allow(null).messages({
    'number.base': 'Rating must be a number',
    'number.integer': 'Rating must be a whole number',
    'number.min': 'Rating must be at least 1',
    'number.max': 'Rating cannot exceed 5',
  }),
});

const updateReadingProgressSchema = Joi.object({
  currentChapter: Joi.number().integer().min(0).messages({
    'number.base': 'Current chapter must be a number',
    'number.integer': 'Current chapter must be a whole number',
    'number.min': 'Current chapter cannot be negative',
  }),

  isCompleted: Joi.boolean(),

  rating: Joi.number().integer().min(1).max(5).allow(null).messages({
    'number.base': 'Rating must be a number',
    'number.integer': 'Rating must be a whole number',
    'number.min': 'Rating must be at least 1',
    'number.max': 'Rating cannot exceed 5',
  }),
}).min(1).messages({
  'object.min': 'At least one field is required for update',
});

module.exports = {
  upsertReadingProgressSchema,
  updateReadingProgressSchema,
};