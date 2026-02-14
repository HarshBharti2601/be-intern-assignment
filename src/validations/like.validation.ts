import Joi from 'joi';

export const createLikeSchema = Joi.object({
  userId: Joi.number().integer().required().messages({
    'number.base': 'userId must be a number',
  }),
  postId: Joi.number().integer().required().messages({
    'number.base': 'postId must be a number',
  }),
});