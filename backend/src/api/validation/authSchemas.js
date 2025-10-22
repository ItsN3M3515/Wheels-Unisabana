/**
 * Auth Validation Schemas (Joi)
 * 
 * Validates authentication-related requests
 */

const Joi = require('joi');

/**
 * Login Schema
 * 
 * Fields:
 * - corporateEmail: Valid email format (required)
 * - password: String, min 8 chars (required)
 * 
 * Note: We validate format here, but don't reveal if email exists
 * in the error response (prevents user enumeration)
 */
const loginSchema = Joi.object({
  corporateEmail: Joi.string()
    .email()
    .required()
    .trim()
    .lowercase()
    .messages({
      'string.email': 'corporateEmail must be a valid email address',
      'any.required': 'corporateEmail is required',
      'string.empty': 'corporateEmail cannot be empty'
    }),
  
  password: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min': 'password must be at least 8 characters long',
      'any.required': 'password is required',
      'string.empty': 'password cannot be empty'
    })
}).options({
  abortEarly: false,
  stripUnknown: true
});

module.exports = {
  loginSchema
};

