/**
 * Payment Routes (US-4.1.2)
 * 
 * Passenger payment endpoints.
 * All routes require JWT authentication and passenger role.
 */

const express = require('express');
const router = express.Router();

const PaymentController = require('../controllers/paymentController');
const authenticate = require('../middlewares/authenticate');
const { requireRole } = require('../middlewares/authenticate');
const requireCsrf = require('../middlewares/requireCsrf');
const validateRequest = require('../middlewares/validateRequest');
const { createPaymentIntentSchema } = require('../validation/paymentSchemas');

const paymentController = new PaymentController();

/**
 * @route   POST /passengers/payments/intents
 * @desc    Create payment intent for an accepted booking
 * @access  Private (Passenger only, owner-only)
 */
/**
 * @openapi
 * /passengers/payments/intents:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Create payment intent for booking (Passenger)
 *     description: |
 *       Create a payment intent to pay for an accepted booking.
 *       
 *       **Preconditions**:
 *       - Booking must be in `accepted` state
 *       - Passenger must own the booking
 *       - No active or succeeded payment already exists
 *       
 *       **Amount Calculation**:
 *       - Immutable snapshot: `booking.seats × trip.pricePerSeat`
 *       
 *       **Returns**:
 *       - `clientSecret`: Use with Stripe.js to complete payment on frontend
 *       - `transactionId`: Track transaction status
 *       
 *       **Next Steps**:
 *       1. Frontend uses `clientSecret` with Stripe SDK
 *       2. Customer completes payment with provider
 *       3. Webhook updates transaction status
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *             properties:
 *               bookingId:
 *                 type: string
 *                 pattern: '^[a-f\d]{24}$'
 *                 description: Booking request ID (MongoDB ObjectId)
 *                 example: "66b1c2d3e4f5a6b7c8d9e0f1"
 *           examples:
 *             valid_request:
 *               value:
 *                 bookingId: "66b1c2d3e4f5a6b7c8d9e0f1"
 *     responses:
 *       201:
 *         description: Payment intent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactionId:
 *                   type: string
 *                   example: "66t1a2b3c4d5e6f7a8b9c0d1"
 *                 bookingId:
 *                   type: string
 *                   example: "66b1c2d3e4f5a6b7c8d9e0f1"
 *                 amount:
 *                   type: integer
 *                   description: Amount in smallest currency unit (e.g., cents)
 *                   example: 50000
 *                 currency:
 *                   type: string
 *                   example: "COP"
 *                 provider:
 *                   type: string
 *                   enum: [stripe]
 *                   example: "stripe"
 *                 clientSecret:
 *                   type: string
 *                   description: Provider client secret for frontend
 *                   example: "pi_3K1bXY2eZvKYlo2C0abc1234_secret_XYZabc123def456"
 *             examples:
 *               success:
 *                 value:
 *                   transactionId: "66t1a2b3c4d5e6f7a8b9c0d1"
 *                   bookingId: "66b1c2d3e4f5a6b7c8d9e0f1"
 *                   amount: 50000
 *                   currency: "COP"
 *                   provider: "stripe"
 *                   clientSecret: "pi_3K1bXY2eZvKYlo2C0abc1234_secret_XYZabc123def456"
 *       400:
 *         description: Invalid request (validation error)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorValidation'
 *             examples:
 *               missing_bookingId:
 *                 value:
 *                   code: "invalid_schema"
 *                   message: "Validation failed"
 *                   details:
 *                     - field: "bookingId"
 *                       issue: "bookingId is required"
 *               invalid_format:
 *                 value:
 *                   code: "invalid_schema"
 *                   message: "Validation failed"
 *                   details:
 *                     - field: "bookingId"
 *                       issue: "bookingId must be a valid MongoDB ObjectId"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorUnauthorized'
 *       403:
 *         description: Forbidden (not booking owner or CSRF missing)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: "forbidden_owner"
 *                 message:
 *                   type: string
 *                   example: "You cannot pay for this booking"
 *       404:
 *         description: Booking not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: "booking_not_found"
 *                 message:
 *                   type: string
 *                   example: "Booking request not found"
 *       409:
 *         description: Conflict (invalid state or duplicate payment)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   enum: [invalid_booking_state, duplicate_payment, booking_already_paid]
 *                 message:
 *                   type: string
 *             examples:
 *               invalid_state:
 *                 value:
 *                   code: "invalid_booking_state"
 *                   message: "Booking must be 'accepted' to create payment intent"
 *               duplicate_payment:
 *                 value:
 *                   code: "duplicate_payment"
 *                   message: "A payment is already in progress for this booking"
 *               already_paid:
 *                 value:
 *                   code: "booking_already_paid"
 *                   message: "Booking has already been paid"
 *       500:
 *         description: Payment provider error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: "payment_provider_error"
 *                 message:
 *                   type: string
 *                   example: "Payment provider error occurred"
 */
router.post(
  '/payments/intents',
  authenticate,
  requireRole('passenger'),
  requireCsrf,
  validateRequest(createPaymentIntentSchema, 'body'),
  paymentController.createPaymentIntent.bind(paymentController)
);

/**
 * @route   GET /passengers/payments/transactions/:transactionId
 * @desc    Get transaction details
 * @access  Private (Passenger only, owner-only)
 */
router.get(
  '/payments/transactions/:transactionId',
  authenticate,
  requireRole('passenger'),
  paymentController.getTransaction.bind(paymentController)
);

/**
 * @route   GET /passengers/payments/transactions
 * @desc    Get all transactions for authenticated passenger
 * @access  Private (Passenger only)
 */
router.get(
  '/payments/transactions',
  authenticate,
  requireRole('passenger'),
  paymentController.getMyTransactions.bind(paymentController)
);

module.exports = router;
