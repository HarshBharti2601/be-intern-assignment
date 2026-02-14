import Joi from 'joi';

export const createFollowSchema = Joi.object({
  followerId: Joi.number().integer().required().messages({
    'number.base': 'followerId must be a number',
  }),
  followingId: Joi.number().integer().required().messages({
    'number.base': 'followingId must be a number',
  }),
});