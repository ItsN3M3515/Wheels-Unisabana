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

module.exports = { createReviewBodySchema, listReviewsQuerySchema };
