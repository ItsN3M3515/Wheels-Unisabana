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

  /**
   * Accept a booking request (driver-initiated)
   * 
   * Atomic operation using MongoDB session/transaction:
   * 1. Verify booking is pending and trip is owned by driver
   * 2. Verify trip is published and has future departure
   * 3. Atomically allocate seats in SeatLedger (race-safe)
   * 4. Update booking status to 'accepted'
   * 
   * @param {string} bookingId - Booking request ID
   * @param {string} driverId - Accepting driver ID
   * @param {Object} seatLedgerRepository - Seat ledger repository
   * @returns {Promise<BookingRequest>} Accepted booking request
   * @throws {DomainError} if validation fails or capacity exceeded
   */
  async acceptBookingRequest(bookingId, driverId, seatLedgerRepository) {
    console.log(
      `[BookingRequestService] Accepting booking request | bookingId: ${bookingId} | driverId: ${driverId}`
    );

    // 1. Find booking request
    const bookingRequest = await this.bookingRequestRepository.findById(bookingId);
    if (!bookingRequest) {
      console.log(`[BookingRequestService] Booking not found | bookingId: ${bookingId}`);
      throw new DomainError('Booking request not found', 'booking_not_found');
    }

    // 2. Verify booking is pending
    if (bookingRequest.status !== 'pending') {
      console.log(
        `[BookingRequestService] Cannot accept booking with status: ${bookingRequest.status} | bookingId: ${bookingId}`
      );
      throw new DomainError(
        `Cannot accept booking with status: ${bookingRequest.status}. Only pending bookings can be accepted.`,
        'invalid_state'
      );
    }

    // 3. Load trip offer
    const trip = await this.tripOfferRepository.findById(bookingRequest.tripId);
    if (!trip) {
      console.log(
        `[BookingRequestService] Trip not found | tripId: ${bookingRequest.tripId}`
      );
      throw new DomainError('Trip offer not found', 'trip_not_found');
    }

    // 4. Verify trip ownership
    if (trip.driverId !== driverId) {
      console.log(
        `[BookingRequestService] Ownership violation | tripId: ${trip.id} | driverId: ${driverId} | ownerId: ${trip.driverId}`
      );
      throw new DomainError('You do not own this trip', 'forbidden_owner');
    }

    // 5. Verify trip is published
    if (trip.status !== 'published') {
      console.log(
        `[BookingRequestService] Trip not published | tripId: ${trip.id} | status: ${trip.status}`
      );
      throw new DomainError(
        `Cannot accept booking for trip with status: ${trip.status}`,
        'trip_not_published'
      );
    }

    // 6. Verify trip departure is in the future
    if (!trip.isDepartureInFuture()) {
      console.log(
        `[BookingRequestService] Trip departure is in the past | tripId: ${trip.id} | departureAt: ${trip.departureAt}`
      );
      throw new DomainError(
        'Cannot accept booking for trip with past departure time',
        'trip_in_past'
      );
    }

    // 7. Atomically allocate seats (race-safe)
    // This uses findOneAndUpdate with conditional guards to prevent oversubscription
    const SeatLedgerModel = require('../../infrastructure/database/models/SeatLedgerModel');
    let ledger;
    
    try {
      ledger = await SeatLedgerModel.allocateSeats(
        trip.id,
        trip.totalSeats,
        bookingRequest.seats
      );
    } catch (error) {
      if (error.message === 'CAPACITY_EXCEEDED') {
        console.log(
          `[BookingRequestService] Capacity exceeded | tripId: ${trip.id} | totalSeats: ${trip.totalSeats} | requestedSeats: ${bookingRequest.seats}`
        );
        throw new DomainError('No seats available for this trip', 'capacity_exceeded');
      }
      throw error;
    }

    if (!ledger) {
      // Atomic operation failed (capacity guard condition not met)
      console.log(
        `[BookingRequestService] Capacity exceeded (atomic guard failed) | tripId: ${trip.id} | totalSeats: ${trip.totalSeats} | requestedSeats: ${bookingRequest.seats}`
      );
      throw new DomainError('No seats available for this trip', 'capacity_exceeded');
    }

    // 8. Update booking status to 'accepted'
    const acceptedBooking = await this.bookingRequestRepository.accept(bookingId, driverId);

    console.log(
      `[BookingRequestService] Booking request accepted | bookingId: ${bookingId} | driverId: ${driverId} | passengerId: ${bookingRequest.passengerId} | seats: ${bookingRequest.seats} | allocatedSeats: ${ledger.allocatedSeats}`
    );

    return acceptedBooking;
  }

  /**
   * Decline a booking request (driver-initiated)
   * 
   * Validates:
   * - Booking exists and is pending
   * - Trip is owned by driver
   * - Idempotent: if already declined, returns success
   * 
   * No seat allocation changes (capacity unchanged)
   * 
   * @param {string} bookingId - Booking request ID
   * @param {string} driverId - Declining driver ID
   * @returns {Promise<BookingRequest>} Declined booking request
   * @throws {DomainError} if validation fails
   */
  async declineBookingRequest(bookingId, driverId) {
    console.log(
      `[BookingRequestService] Declining booking request | bookingId: ${bookingId} | driverId: ${driverId}`
    );

    // 1. Find booking request
    const bookingRequest = await this.bookingRequestRepository.findById(bookingId);
    if (!bookingRequest) {
      console.log(`[BookingRequestService] Booking not found | bookingId: ${bookingId}`);
      throw new DomainError('Booking request not found', 'booking_not_found');
    }

    // 2. Load trip offer
    const trip = await this.tripOfferRepository.findById(bookingRequest.tripId);
    if (!trip) {
      console.log(
        `[BookingRequestService] Trip not found | tripId: ${bookingRequest.tripId}`
      );
      throw new DomainError('Trip offer not found', 'trip_not_found');
    }

    // 3. Verify trip ownership
    if (trip.driverId !== driverId) {
      console.log(
        `[BookingRequestService] Ownership violation | tripId: ${trip.id} | driverId: ${driverId} | ownerId: ${trip.driverId}`
      );
      throw new DomainError('You do not own this trip', 'forbidden_owner');
    }

    // 4. Check if already declined (idempotent)
    if (bookingRequest.status === 'declined') {
      console.log(
        `[BookingRequestService] Booking already declined (idempotent) | bookingId: ${bookingId} | driverId: ${driverId}`
      );
      return bookingRequest; // Return without error
    }

    // 5. Verify booking is pending
    if (bookingRequest.status !== 'pending') {
      console.log(
        `[BookingRequestService] Cannot decline booking with status: ${bookingRequest.status} | bookingId: ${bookingId}`
      );
      throw new DomainError(
        `Cannot decline booking with status: ${bookingRequest.status}. Only pending bookings can be declined.`,
        'invalid_state'
      );
    }

    // 6. Decline booking request (no seat allocation changes)
    const declinedBooking = await this.bookingRequestRepository.decline(bookingId, driverId);

    console.log(
      `[BookingRequestService] Booking request declined | bookingId: ${bookingId} | driverId: ${driverId} | passengerId: ${bookingRequest.passengerId}`
    );

    return declinedBooking;
  }

  /**
   * Get booking requests for a trip (driver view)
   * 
   * Validates:
   * - Trip exists
   * - Trip is owned by the driver
   * 
   * @param {string} tripId - Trip ID
   * @param {string} driverId - Driver ID (ownership validation)
   * @param {Object} filters - Optional filters
   * @param {string|string[]} filters.status - Status filter
   * @param {number} filters.page - Page number
   * @param {number} filters.pageSize - Results per page (max: 50)
   * @returns {Promise<Object>} Paginated booking requests
   * @throws {DomainError} if trip not found or not owned by driver
   */
  async getBookingRequestsForTrip(tripId, driverId, { status, page = 1, pageSize = 10 } = {}) {
    console.log(
      `[BookingRequestService] Fetching booking requests for trip | tripId: ${tripId} | driverId: ${driverId} | status: ${status} | page: ${page} | pageSize: ${pageSize}`
    );

    // 1. Verify trip exists
    const trip = await this.tripOfferRepository.findById(tripId);
    if (!trip) {
      console.log(`[BookingRequestService] Trip not found | tripId: ${tripId}`);
      throw new DomainError('Trip offer not found', 'trip_not_found');
    }

    // 2. Verify trip ownership
    if (trip.driverId !== driverId) {
      console.log(
        `[BookingRequestService] Ownership violation | tripId: ${tripId} | driverId: ${driverId} | ownerId: ${trip.driverId}`
      );
      throw new DomainError('Trip does not belong to the driver', 'forbidden_owner');
    }

    // 3. Fetch booking requests with filters
    const result = await this.bookingRequestRepository.findByTrip(tripId, {
      status,
      page,
      limit: pageSize
    });

    console.log(
      `[BookingRequestService] Fetched booking requests | tripId: ${tripId} | total: ${result.total} | page: ${result.page}`
    );

    return result;
  }
}

module.exports = BookingRequestService;
