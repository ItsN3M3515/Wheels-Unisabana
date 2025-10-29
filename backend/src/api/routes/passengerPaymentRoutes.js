/**
 * Payment Routes for Passengers
 * 
 * Defines API routes for passenger payment operations
 */

const express = require('express');
const authenticate = require('../middlewares/authenticate');
const { requireRole } = require('../middlewares/authenticate');
const requireCsrf = require('../middlewares/requireCsrf');
const validateRequest = require('../middlewares/validateRequest');
const PaymentController = require('../controllers/paymentController');

// Validation schemas
const Joi = require('joi');

const createPaymentIntentSchema = Joi.object({
  bookingId: Joi.string().required().messages({
    'any.required': 'bookingId is required',
    'string.empty': 'bookingId cannot be empty'
  })
});

const router = express.Router();
const paymentController = new PaymentController();

/**
 * POST /passengers/payments/intents
 * 
 * Create a payment intent for an accepted booking owned by the passenger
 * 
 * Authentication: Required (JWT cookie)
 * Role: passenger
 * CSRF: Required
 * 
 * Request Body:
 * {
 *   "bookingId": "66b-req-1"
 * }
 * 
 * Response 201 (Created):
 * {
 *   "transactionId": "66t-tx-1",
 *   "bookingId": "66b-req-1",
 *   "amount": 6000,
 *   "currency": "COP",
 *   "provider": "stripe",
 *   "clientSecret": "pi_3k..._secret_ABCD"
 * }
 * 
 * Error Responses:
 * 
 * 403 Forbidden Owner:
 * {
 *   "code": "forbidden_owner",
 *   "message": "You cannot pay for this booking"
 * }
 * 
 * 409 Invalid Booking State:
 * {
 *   "code": "invalid_booking_state",
 *   "message": "Booking must be 'accepted' to create payment intent"
 * }
 * 
 * 409 Duplicate Payment:
 * {
 *   "code": "duplicate_payment",
 *   "message": "A successful or active payment already exists for this booking"
 * }
 * 
 * 400 Invalid Schema:
 * {
 *   "code": "invalid_schema",
 *   "message": "Validation failed",
 *   "details": [
 *     {
 *       "field": "bookingId",
 *       "issue": "required"
 *     }
 *   ]
 * }
 * 
 * 404 Booking Not Found:
 * {
 *   "code": "booking_not_found",
 *   "message": "Booking request not found"
 * }
 * 
 * 500 Internal Error:
 * {
 *   "code": "internal_error",
 *   "message": "Failed to create payment intent"
 * }
 * 
 * Example Usage (Browser):
 * ```javascript
 * const res = await fetch('/passengers/payments/intents', {
 *   method: 'POST',
 *   credentials: 'include',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ bookingId })
 * });
 * const intent = await res.json();
 * // use intent.clientSecret with provider SDK
 * ```
 */
router.post('/intents',
  authenticate,
  requireRole('passenger'),
  requireCsrf,
  validateRequest(createPaymentIntentSchema),
  paymentController.createPaymentIntent.bind(paymentController)
);

module.exports = router;
