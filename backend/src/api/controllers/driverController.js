/**
 * DriverController
 * 
 * Driver-specific endpoints for trip and booking management.
 * All endpoints require JWT authentication and driver role.
 */

const BookingRequestService = require('../../domain/services/BookingRequestService');
const MongoBookingRequestRepository = require('../../infrastructure/repositories/MongoBookingRequestRepository');
const MongoTripOfferRepository = require('../../infrastructure/repositories/MongoTripOfferRepository');

// Initialize services
const bookingRequestRepository = new MongoBookingRequestRepository();
const tripOfferRepository = new MongoTripOfferRepository();
const bookingRequestService = new BookingRequestService(
  bookingRequestRepository,
  tripOfferRepository
);

class DriverController {
  /**
   * GET /drivers/trips/:tripId/booking-requests
   * 
   * List booking requests for a specific trip owned by the driver.
   * Supports filtering by status and pagination.
   * 
   * Query params:
   * - status: string|string[] (optional) - Filter by status (pending, accepted, declined, canceled_by_passenger, expired)
   * - page: number (optional, default: 1) - Page number
   * - pageSize: number (optional, default: 10, max: 50) - Results per page
   * 
   * Returns:
   * - 200: Paginated booking requests
   * - 400: Invalid query parameters
   * - 403: Trip not owned by driver
   * - 404: Trip not found
   */
  async listTripBookingRequests(req, res, next) {
    try {
      const { tripId } = req.params;
      const driverId = req.user.id;
      const { status, page, pageSize } = req.query;

      console.log(
        `[DriverController] Listing booking requests for trip | tripId: ${tripId} | driverId: ${driverId} | status: ${status} | page: ${page} | pageSize: ${pageSize}`
      );

      const result = await bookingRequestService.getBookingRequestsForTrip(
        tripId,
        driverId,
        {
          status,
          page: parseInt(page) || 1,
          pageSize: parseInt(pageSize) || 10
        }
      );

      // Map to API response format
      const items = result.bookings.map((booking) => ({
        id: booking.id,
        tripId: booking.tripId,
        passengerId: booking.passengerId,
        status: booking.status,
        seats: booking.seats,
        note: booking.note,
        acceptedAt: booking.acceptedAt,
        declinedAt: booking.declinedAt,
        canceledAt: booking.canceledAt,
        createdAt: booking.createdAt
      }));

      const response = {
        items,
        page: result.page,
        pageSize: result.limit,
        total: result.total,
        totalPages: result.totalPages
      };

      console.log(
        `[DriverController] Booking requests listed | tripId: ${tripId} | total: ${result.total} | page: ${result.page}`
      );

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DriverController();
