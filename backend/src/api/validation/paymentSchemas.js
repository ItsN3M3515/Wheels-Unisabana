/**
 * Payment Validation Schemas (US-4.1.2)
 * 
 * Joi validation schemas for payment-related requests.
 */

const Joi = require('joi');

/**
 * Create Payment Intent Request Schema
 * 
 * Fields:
 * - bookingId: MongoDB ObjectId (required)
 * 
 * Used for: POST /passengers/payments/intents
 */
const createPaymentIntentSchema = Joi.object({
  bookingId: Joi.string()
    .required()
    .pattern(/^[a-f\d]{24}$/i)
    .messages({
      'string.pattern.base': 'bookingId must be a valid MongoDB ObjectId',
      'any.required': 'bookingId is required',
      'string.empty': 'bookingId cannot be empty'
    })
}).options({
  abortEarly: false,
  stripUnknown: true
});

module.exports = {
  createPaymentIntentSchema
};
