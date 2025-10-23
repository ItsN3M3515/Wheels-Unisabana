/**
 * Driver Routes
 * 
 * Driver-specific endpoints for trip and booking management.
 * All routes require JWT authentication and driver role.
 */

const express = require('express');
const router = express.Router();

const driverController = require('../controllers/driverController');
const authenticate = require('../middlewares/authenticate');
const { requireRole } = require('../middlewares/authenticate');
const requireCsrf = require('../middlewares/requireCsrf');
const validateRequest = require('../middlewares/validateRequest');
const {
  driverTripBookingRequestsQuerySchema,
  tripIdParamSchema,
  bookingIdParamSchema
} = require('../validation/bookingRequestSchemas');

/**
 * @route   GET /drivers/trips/:tripId/booking-requests
 * @desc    List booking requests for a specific trip owned by the driver
 * @access  Private (Driver only)
 * @query   {string|string[]} status - Optional status filter (pending, accepted, declined, canceled_by_passenger, expired)
 * @query   {number} page - Optional page number (default: 1)
 * @query   {number} pageSize - Optional page size (default: 10, max: 50)
 */
router.get(
  '/trips/:tripId/booking-requests',
  authenticate,
  validateRequest(tripIdParamSchema, 'params'),
  validateRequest(driverTripBookingRequestsQuerySchema, 'query'),
  driverController.listTripBookingRequests
);

/**
 * @route   POST /drivers/booking-requests/:bookingId/accept
 * @desc    Accept a pending booking request (atomic seat allocation)
 * @access  Private (Driver only)
 */
router.post(
  '/booking-requests/:bookingId/accept',
  authenticate,
  requireRole('driver'),
  requireCsrf,
  validateRequest(bookingIdParamSchema, 'params'),
  driverController.acceptBookingRequest
);

module.exports = router;
