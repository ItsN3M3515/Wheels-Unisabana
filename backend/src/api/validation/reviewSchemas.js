const Joi = require('joi');

const createReviewBodySchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  text: Joi.string().max(1000).allow('').optional(),
  tags: Joi.array().items(Joi.string().max(50)).max(5).optional()
});

const listReviewsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(50).default(10)
});

// Schema for reviewId parameter (MongoDB ObjectId)
const reviewIdParamSchema = Joi.object({
  reviewId: Joi.string()
    .pattern(/^[a-f\d]{24}$/i)
    .required()
    .messages({
      'string.pattern.base': 'reviewId must be a valid MongoDB ObjectId',
      'any.required': 'reviewId is required'
    })
}).options({ abortEarly: false });

module.exports = { createReviewBodySchema, listReviewsQuerySchema, reviewIdParamSchema };
