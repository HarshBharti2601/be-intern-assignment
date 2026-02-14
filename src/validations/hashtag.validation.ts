import Joi from 'joi';

export const createHashtagSchema = Joi.object({
  tag: Joi.string()
    .pattern(/^[a-zA-Z0-9_]+$/)
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.pattern.base':
        'Hashtag can only contain letters, numbers, and underscores',
      'string.empty': 'Hashtag cannot be empty',
      'string.max': 'Hashtag must not exceed 50 characters',
    }),
});

export const updateHashtagSchema = Joi.object({
  tag: Joi.string()
    .pattern(/^[a-zA-Z0-9_]+$/)
    .min(1)
    .max(50)
    .required(),
});