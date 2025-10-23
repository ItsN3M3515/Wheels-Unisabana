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
const validateRequest = require('../middlewares/validateRequest');
const {
  driverTripBookingRequestsQuerySchema,
  tripIdParamSchema
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
  validateRequest({
    params: tripIdParamSchema,
    query: driverTripBookingRequestsQuerySchema
  }),
  driverController.listTripBookingRequests
);

module.exports = router;
