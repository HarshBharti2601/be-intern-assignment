import Joi from 'joi';

export const createPostSchema = Joi.object({
  authorId: Joi.number().integer().required().messages({
    'number.base': 'authorId must be a number',
  }),
  content: Joi.string().min(1).max(5000).required().messages({
    'string.empty': 'Post content cannot be empty',
    'string.max': 'Post content must not exceed 5000 characters',
  }),
  hashtags: Joi.array().items(Joi.string()).optional(),
});

export const updatePostSchema = Joi.object({
  content: Joi.string().min(1).max(5000).required().messages({
    'string.empty': 'Post content cannot be empty',
    'string.max': 'Post content must not exceed 5000 characters',
  }),
  hashtags: Joi.array().items(Joi.string()).optional(),
});