const Joi = require('joi');
const GENRES = require('../utils/genres');

const objectIdSchema = Joi.string().hex().length(24);

const createBookSchema = Joi.object({
  title: Joi.string().trim().min(1).max(150).required().messages({
    'string.empty': 'Book title is required',
    'string.min': 'Book title is required',
    'string.max': 'Book title cannot exceed 150 characters',
    'any.required': 'Book title is required',
  }),

  author: Joi.string().trim().max(100).required().messages({
    'string.empty': 'Author is required',
    'string.max': 'Author name cannot exceed 100 characters',
    'any.required': 'Author is required',
  }),

  coverImage: Joi.string().trim().allow(''),

  description: Joi.string().trim().max(3000).allow('').messages({
    'string.max': 'Description cannot exceed 3000 characters',
  }),

  genres: Joi.array()
    .items(Joi.string().valid(...GENRES))
    .default([]),

  totalChapters: Joi.number().integer().min(1).required().messages({
    'number.base': 'Total chapters must be a number',
    'number.integer': 'Total chapters must be a whole number',
    'number.min': 'Book must have at least 1 chapter',
    'any.required': 'Total chapters is required',
  }),

  club: objectIdSchema.required().messages({
    'string.hex': 'Club id must be a valid MongoDB id',
    'string.length': 'Club id must be a valid MongoDB id',
    'any.required': 'Club id is required',
  }),
});

const updateBookSchema = Joi.object({
  title: Joi.string().trim().min(1).max(150).messages({
    'string.empty': 'Book title cannot be empty',
    'string.min': 'Book title cannot be empty',
    'string.max': 'Book title cannot exceed 150 characters',
  }),

  author: Joi.string().trim().max(100).messages({
    'string.empty': 'Author cannot be empty',
    'string.max': 'Author name cannot exceed 100 characters',
  }),

  coverImage: Joi.string().trim().allow(''),

  description: Joi.string().trim().max(3000).allow('').messages({
    'string.max': 'Description cannot exceed 3000 characters',
  }),

  genres: Joi.array().items(Joi.string().valid(...GENRES)),

  totalChapters: Joi.number().integer().min(1).messages({
    'number.base': 'Total chapters must be a number',
    'number.integer': 'Total chapters must be a whole number',
    'number.min': 'Book must have at least 1 chapter',
  }),
}).min(1).messages({
  'object.min': 'At least one field is required for update',
});

module.exports = {
  createBookSchema,
  updateBookSchema,
};