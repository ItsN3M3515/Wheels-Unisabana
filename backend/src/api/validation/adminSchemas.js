const Joi = require('joi');

/**
 * Validation schemas for admin listing endpoints
 */

const paginationQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1).optional(),
  pageSize: Joi.number().integer().min(1).max(100).default(25).optional(),
  sort: Joi.string().optional()
}).options({ abortEarly: false, stripUnknown: true });

const listTripsQuery = Joi.object({
  status: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
  driverId: Joi.string().pattern(/^[a-f\d]{24}$/i).optional(),
  from: Joi.string().max(200).optional(),
  to: Joi.string().max(200).optional(),
  departureFrom: Joi.date().iso().optional(),
  departureTo: Joi.date().iso().optional()
}).concat(paginationQuery).options({ abortEarly: false, stripUnknown: true });

const listBookingsQuery = Joi.object({
  tripId: Joi.string().pattern(/^[a-f\d]{24}$/i).optional(),
  passengerId: Joi.string().pattern(/^[a-f\d]{24}$/i).optional(),
  status: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
  paid: Joi.alternatives().try(Joi.string().valid('true','false'), Joi.boolean()).optional(),
  createdFrom: Joi.date().iso().optional(),
  createdTo: Joi.date().iso().optional()
}).concat(paginationQuery).options({ abortEarly: false, stripUnknown: true });

const listRefundsQuery = Joi.object({
  status: Joi.string().optional(),
  reason: Joi.string().max(500).optional(),
  transactionId: Joi.string().optional(),
  bookingId: Joi.string().pattern(/^[a-f\d]{24}$/i).optional(),
  createdFrom: Joi.date().iso().optional(),
  createdTo: Joi.date().iso().optional()
}).concat(paginationQuery).options({ abortEarly: false, stripUnknown: true });

const suspendUserSchema = Joi.object({
  action: Joi.string().valid('suspend', 'unsuspend').required(),
  reason: Joi.string().min(3).max(500).required()
}).options({ abortEarly: false, stripUnknown: true });

module.exports = {
  listTripsQuery,
  listBookingsQuery,
  listRefundsQuery
  ,suspendUserSchema
};
