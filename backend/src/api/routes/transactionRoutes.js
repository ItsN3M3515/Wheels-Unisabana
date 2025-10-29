/**
 * Transaction Routes
 * 
 * Defines API routes for payment transactions
 */

const express = require('express');
const authenticate = require('../middlewares/authenticate');
const { requireRole } = require('../middlewares/authenticate');
const requireCsrf = require('../middlewares/requireCsrf');
const validateRequest = require('../middlewares/validateRequest');
const TransactionController = require('../controllers/transactionController');

// Validation schemas
const Joi = require('joi');

const createPaymentIntentSchema = Joi.object({
  bookingId: Joi.string().required().messages({
    'any.required': 'bookingId is required',
    'string.empty': 'bookingId cannot be empty'
  })
});

const transactionIdParamSchema = Joi.object({
  id: Joi.string().required().messages({
    'any.required': 'Transaction ID is required',
    'string.empty': 'Transaction ID cannot be empty'
  })
});

const getTransactionsQuerySchema = Joi.object({
  status: Joi.string().valid(
    'requires_payment_method',
    'processing',
    'succeeded',
    'failed',
    'canceled',
    'refunded'
  ).optional(),
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'amount').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

const router = express.Router();
const transactionController = new TransactionController();

/**
 * GET /transactions/config
 * 
 * Get Stripe configuration status (for debugging)
 * 
 * Authentication: Required (JWT cookie)
 * 
 * Response 200:
 * {
 *   "stripe": {
 *     "clientInitialized": true,
 *     "webhookSecretSet": true,
 *     "secretKeySet": true,
 *     "isFullyConfigured": true
 *   }
 * }
 */
router.get('/config',
  authenticate,
  transactionController.getConfig.bind(transactionController)
);

/**
 * POST /transactions/payment-intent
 * 
 * Create a payment intent for an accepted booking
 * 
 * Authentication: Required (JWT cookie)
 * Role: passenger
 * CSRF: Required
 * 
 * Request Body:
 * {
 *   "bookingId": "68fb2ada72db69909ef67a86"
 * }
 * 
 * Response 201:
 * {
 *   "transactionId": "68fb2bcd72db69909ef67a87",
 *   "paymentIntentId": "pi_1234567890",
 *   "clientSecret": "pi_1234567890_secret_abc123",
 *   "amount": 5000,
 *   "currency": "COP",
 *   "status": "requires_payment_method",
 *   "formattedAmount": "$50.000",
 *   "booking": { "id": "...", "status": "accepted", "seats": 1 },
 *   "trip": { "id": "...", "origin": {...}, "destination": {...} }
 * }
 * 
 * Errors:
 * - 400 invalid_schema: Invalid request body
 * - 403 booking_not_accepted: Booking is not accepted
 * - 403 booking_not_owned: Booking doesn't belong to passenger
 * - 409 duplicate_payment: Payment already exists
 * - 500 internal_error: Server error
 */
router.post('/payment-intent',
  authenticate,
  requireRole('passenger'),
  requireCsrf,
  validateRequest(createPaymentIntentSchema),
  transactionController.createPaymentIntent.bind(transactionController)
);

/**
 * GET /transactions/:id
 * 
 * Get transaction details
 * 
 * Authentication: Required (JWT cookie)
 * Role: passenger or driver (must own transaction)
 * 
 * Response 200:
 * {
 *   "id": "68fb2bcd72db69909ef67a87",
 *   "bookingId": "68fb2ada72db69909ef67a86",
 *   "amount": 5000,
 *   "currency": "COP",
 *   "status": "succeeded",
 *   "createdAt": "2024-01-15T10:30:00Z",
 *   "succeededAt": "2024-01-15T10:35:00Z",
 *   "booking": { "id": "...", "status": "accepted", "seats": 1 },
 *   "trip": { "id": "...", "origin": {...}, "destination": {...} },
 *   "passenger": { "id": "...", "firstName": "Juan", "lastName": "Pérez" },
 *   "driver": { "id": "...", "firstName": "Ana", "lastName": "García" }
 * }
 * 
 * Errors:
 * - 404 transaction_not_found: Transaction not found
 * - 403 transaction_not_owned: Transaction doesn't belong to user
 * - 500 internal_error: Server error
 */
router.get('/:id',
  authenticate,
  validateRequest(transactionIdParamSchema, 'params'),
  transactionController.getTransaction.bind(transactionController)
);

/**
 * GET /transactions
 * 
 * Get user transactions with pagination
 * 
 * Authentication: Required (JWT cookie)
 * Role: passenger or driver
 * 
 * Query Parameters:
 * - status: Filter by status (optional)
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20, max: 100)
 * - sortBy: Sort field (default: createdAt)
 * - sortOrder: Sort order (default: desc)
 * 
 * Response 200:
 * {
 *   "items": [
 *     {
 *       "id": "68fb2bcd72db69909ef67a87",
 *       "amount": 5000,
 *       "currency": "COP",
 *       "status": "succeeded",
 *       "createdAt": "2024-01-15T10:30:00Z",
 *       "booking": { "id": "...", "status": "accepted", "seats": 1 },
 *       "trip": { "id": "...", "origin": {...}, "destination": {...} }
 *     }
 *   ],
 *   "pagination": {
 *     "total": 25,
 *     "page": 1,
 *     "pageSize": 20,
 *     "totalPages": 2,
 *     "hasMore": true
 *   }
 * }
 * 
 * Errors:
 * - 400 invalid_role: Invalid user role
 * - 500 internal_error: Server error
 */
router.get('/',
  authenticate,
  validateRequest(getTransactionsQuerySchema, 'query'),
  transactionController.getUserTransactions.bind(transactionController)
);

/**
 * POST /transactions/:id/cancel
 * 
 * Cancel a payment intent
 * 
 * Authentication: Required (JWT cookie)
 * Role: passenger (must own transaction)
 * CSRF: Required
 * 
 * Response 200:
 * {
 *   "id": "68fb2bcd72db69909ef67a87",
 *   "status": "canceled",
 *   "updatedAt": "2024-01-15T10:40:00Z",
 *   "booking": { "id": "...", "status": "accepted", "seats": 1 },
 *   "trip": { "id": "...", "origin": {...}, "destination": {...} }
 * }
 * 
 * Errors:
 * - 404 transaction_not_found: Transaction not found
 * - 403 transaction_not_owned: Transaction doesn't belong to user
 * - 400 transaction_not_cancelable: Transaction cannot be canceled
 * - 500 internal_error: Server error
 */
router.post('/:id/cancel',
  authenticate,
  requireRole('passenger'),
  requireCsrf,
  validateRequest(transactionIdParamSchema, 'params'),
  transactionController.cancelPaymentIntent.bind(transactionController)
);

/**
 * POST /webhooks/stripe
 * 
 * Handle Stripe webhooks
 * 
 * Authentication: None (webhook endpoint)
 * CSRF: Disabled (webhook endpoint)
 * 
 * This endpoint receives webhook events from Stripe to update
 * transaction statuses. It's called by Stripe, not by our frontend.
 * 
 * Response 200:
 * {
 *   "received": true
 * }
 * 
 * Note: Always returns 200 to acknowledge webhook receipt,
 * even if processing fails (to prevent Stripe retries)
 */
router.post('/webhooks/stripe',
  // Raw body parser for webhook signature verification
  express.raw({ type: 'application/json' }),
  transactionController.handleStripeWebhook.bind(transactionController)
);

module.exports = router;
