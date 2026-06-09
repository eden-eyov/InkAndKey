const Joi = require('joi');
const GENRES = require('../utils/genres');

const createClubSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required().messages({
    'string.empty': 'Club name is required',
    'string.min': 'Club name must be at least 2 characters',
    'string.max': 'Club name cannot exceed 80 characters',
    'any.required': 'Club name is required',
  }),

  description: Joi.string().trim().max(500).allow('').messages({
    'string.max': 'Description cannot exceed 500 characters',
  }),

  image: Joi.string().trim().allow(''),

  genres: Joi.array().items(Joi.string().valid(...GENRES)).default([]),

  isPublic: Joi.boolean().default(true),
});

const updateClubSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).messages({
    'string.min': 'Club name must be at least 2 characters',
    'string.max': 'Club name cannot exceed 80 characters',
  }),

  description: Joi.string().trim().max(500).allow('').messages({
    'string.max': 'Description cannot exceed 500 characters',
  }),

  image: Joi.string().trim().allow(''),

  genres: Joi.array().items(Joi.string().valid(...GENRES)),

  isPublic: Joi.boolean(),
}).min(1).messages({
  'object.min': 'At least one field is required for update',
});

module.exports = {
  createClubSchema,
  updateClubSchema,
};