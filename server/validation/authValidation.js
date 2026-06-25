const Joi = require('joi');
const GENRES = require('../utils/genres');

const registerSchema = Joi.object({
  username: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'Username is required',
    'string.min': 'Username must be at least 2 characters',
    'string.max': 'Username cannot exceed 50 characters',
    'any.required': 'Username is required',
  }),

  email: Joi.string().trim().lowercase().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please enter a valid email address',
    'any.required': 'Email is required',
  }),

  password: Joi.string().min(6).max(100).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters',
    'string.max': 'Password cannot exceed 100 characters',
    'any.required': 'Password is required',
  }),

  favoriteGenres: Joi.array()
    .items(Joi.string().valid(...GENRES))
    .default([]),

  favoriteBooks: Joi.array()
    .items(Joi.string().trim().min(1).max(120))
    .default([]),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please enter a valid email address',
    'any.required': 'Email is required',
  }),

  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
    'any.required': 'Password is required',
  }),
});

const updateMeSchema = Joi.object({
   username: Joi.string().trim().min(2).max(50).messages({
    'string.min': 'Username must be at least 2 characters',
    'string.max': 'Username cannot exceed 50 characters',
  }),

  favoriteGenres: Joi.array().items(Joi.string().valid(...GENRES)),

  favoriteBooks: Joi.array().items(
    Joi.string().trim().min(1).max(120)
  ),

  profileImage: Joi.string().trim().allow(''),
}).min(1).messages({'object.min': 'At least one field is required for update',});

module.exports = {
  registerSchema,
  loginSchema,
  updateMeSchema,
};
