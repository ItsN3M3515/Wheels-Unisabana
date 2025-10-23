/**
 * BookingRequestService
 * 
 * Business logic for booking request management.
 * Enforces domain invariants and orchestrates repositories.
 * 
 * Invariants enforced:
 * 1. Trip must be 'published' and have future departureAt
 * 2. Passenger cannot have duplicate active requests for same trip
 * 3. Cancellation is idempotent (canceled_by_passenger)
 */

const DomainError = require('../errors/DomainError');

class BookingRequestService {
  constructor(bookingRequestRepository, tripOfferRepository) {
    this.bookingRequestRepository = bookingRequestRepository;
    this.tripOfferRepository = tripOfferRepository;
  }

  /**
   * Create a new booking request
   * 
   * Validates:
   * - Trip exists, is published, and has future departure
   * - No duplicate active request for same (passenger, trip)
   * 
   * @param {CreateBookingRequestDto} createDto - Booking request data
   * @param {string} passengerId - Requesting passenger ID
   * @returns {Promise<BookingRequest>} Created booking request
   * @throws {DomainError} if validation fails
   */
  async createBookingRequest(createDto, passengerId) {
    const { tripId, seats, note } = createDto;

    console.log(
      `[BookingRequestService] Creating booking request | passengerId: ${passengerId} | tripId: ${tripId} | seats: ${seats}`
    );

    // 1. Verify trip exists
    const trip = await this.tripOfferRepository.findById(tripId);
    if (!trip) {
      console.log(`[BookingRequestService] Trip not found | tripId: ${tripId}`);
      throw new DomainError('Trip offer not found', 'trip_not_found');
    }

    // 2. Verify trip is published
    if (trip.status !== 'published') {
      console.log(
        `[BookingRequestService] Trip not published | tripId: ${tripId} | status: ${trip.status}`
      );
      throw new DomainError(
        'Cannot request booking for trip that is not published',
        'invalid_trip_state'
      );
    }

    // 3. Verify trip departure is in the future
    if (!trip.isDepartureInFuture()) {
      console.log(
        `[BookingRequestService] Trip departure is in the past | tripId: ${tripId} | departureAt: ${trip.departureAt}`
      );
      throw new DomainError(
        'Cannot request booking for trip with past departure time',
        'invalid_trip_state'
      );
    }

    // 4. Check for duplicate active request
    const existingBooking = await this.bookingRequestRepository.findActiveBooking(
      passengerId,
      tripId
    );

    if (existingBooking) {
      console.log(
        `[BookingRequestService] Duplicate active booking | passengerId: ${passengerId} | tripId: ${tripId} | existingBookingId: ${existingBooking.id}`
      );
      throw new DomainError(
        'You already have an active booking request for this trip',
        'duplicate_request'
      );
    }

    // 5. Soft capacity check (log warning but don't block)
    // Note: Strict capacity enforcement happens during driver acceptance (future story)
    const activeBookingsCount = await this.bookingRequestRepository.countActiveBookingsForTrip(tripId);
    const requestedTotalSeats = activeBookingsCount + seats;
    
    if (requestedTotalSeats > trip.totalSeats) {
      console.log(
        `[BookingRequestService] Request may exceed capacity (soft check) | tripId: ${tripId} | totalSeats: ${trip.totalSeats} | activeBookings: ${activeBookingsCount} | requestedSeats: ${seats}`
      );
      // Don't throw error - allow request to be created (driver will decide during acceptance)
    }

    // 6. Create booking request
    const bookingRequest = await this.bookingRequestRepository.create({
      tripId,
      passengerId,
      seats,
      note: note || ''
    });

    console.log(
      `[BookingRequestService] Booking request created | bookingId: ${bookingRequest.id} | passengerId: ${passengerId} | tripId: ${tripId} | status: ${bookingRequest.status}`
    );

    return bookingRequest;
  }

  /**
   * Get booking request by ID
   * @param {string} bookingId - Booking request ID
   * @returns {Promise<BookingRequest|null>}
   */
  async getBookingRequestById(bookingId) {
    return this.bookingRequestRepository.findById(bookingId);
  }

  /**
   * List booking requests for a passenger
   * @param {string} passengerId - Passenger ID
   * @param {Object} filters - Optional filters (status, page, limit)
   * @returns {Promise<Object>} Paginated results
   */
  async listBookingRequests(passengerId, filters = {}) {
    return this.bookingRequestRepository.findByPassenger(passengerId, filters);
  }

  /**
   * List booking requests with populated trip data
   * Used by controller for API responses
   * @param {string} passengerId - Passenger ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} Paginated results with populated trip data
   */
  async listBookingRequestsWithTrip(passengerId, filters = {}) {
    return this.bookingRequestRepository.findByPassengerWithTrip(passengerId, filters);
  }

  /**
   * Cancel a booking request (passenger-initiated)
   * 
   * Validates:
   * - Booking exists
   * - Passenger owns the booking
   * - Idempotent: if already canceled, returns success
   * 
   * @param {string} bookingId - Booking request ID
   * @param {string} passengerId - Canceling passenger ID
   * @returns {Promise<BookingRequest>} Canceled booking request
   * @throws {DomainError} if validation fails
   */
  async cancelBookingRequest(bookingId, passengerId) {
    console.log(
      `[BookingRequestService] Canceling booking request | bookingId: ${bookingId} | passengerId: ${passengerId}`
    );

    // 1. Find booking request
    const bookingRequest = await this.bookingRequestRepository.findById(bookingId);
    if (!bookingRequest) {
      console.log(`[BookingRequestService] Booking not found | bookingId: ${bookingId}`);
      throw new DomainError('Booking request not found', 'booking_not_found');
    }

    // 2. Verify ownership
    if (!bookingRequest.belongsToPassenger(passengerId)) {
      console.log(
        `[BookingRequestService] Ownership violation | bookingId: ${bookingId} | passengerId: ${passengerId} | ownerId: ${bookingRequest.passengerId}`
      );
      throw new DomainError('You do not own this booking request', 'ownership_violation');
    }

    // 3. Check if already canceled (idempotent)
    if (bookingRequest.isCanceledByPassenger()) {
      console.log(
        `[BookingRequestService] Booking already canceled (idempotent) | bookingId: ${bookingId} | passengerId: ${passengerId}`
      );
      return bookingRequest; // Return without error
    }

    // 4. Check if can be canceled (only pending requests)
    if (!bookingRequest.canBeCanceledByPassenger()) {
      console.log(
        `[BookingRequestService] Cannot cancel booking with status: ${bookingRequest.status} | bookingId: ${bookingId}`
      );
      throw new DomainError(
        `Cannot cancel booking with status: ${bookingRequest.status}. Only pending bookings can be canceled.`,
        'invalid_status_for_cancel'
      );
    }

    // 5. Cancel booking request
    const canceledBooking = await this.bookingRequestRepository.cancel(bookingId);

    console.log(
      `[BookingRequestService] Booking request canceled | bookingId: ${bookingId} | passengerId: ${passengerId} | previousStatus: ${bookingRequest.status}`
    );

    return canceledBooking;
  }
}

module.exports = BookingRequestService;

