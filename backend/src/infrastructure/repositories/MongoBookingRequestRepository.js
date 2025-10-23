/**
 * MongoBookingRequestRepository
 * 
 * MongoDB implementation of BookingRequestRepository.
 * Handles persistence and queries for booking requests.
 */

const BookingRequestModel = require('../database/models/BookingRequestModel');
const BookingRequest = require('../../domain/entities/BookingRequest');

class MongoBookingRequestRepository {
  /**
   * Convert Mongoose document to domain entity
   * @private
   */
  _toDomain(doc) {
    if (!doc) return null;

    const obj = doc.toObject ? doc.toObject() : doc;

    return new BookingRequest({
      id: obj._id.toString(),
      tripId: obj.tripId.toString(),
      passengerId: obj.passengerId.toString(),
      status: obj.status,
      seats: obj.seats,
      note: obj.note || '',
      acceptedAt: obj.acceptedAt,
      acceptedBy: obj.acceptedBy ? obj.acceptedBy.toString() : null,
      declinedAt: obj.declinedAt,
      declinedBy: obj.declinedBy ? obj.declinedBy.toString() : null,
      canceledAt: obj.canceledAt,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt
    });
  }

  /**
   * Convert array of Mongoose documents to domain entities
   * @private
   */
  _toDomainArray(docs) {
    return docs.map((doc) => this._toDomain(doc));
  }

  /**
   * Create a new booking request
   * @param {Object} data - Booking request data
   * @returns {Promise<BookingRequest>} Created booking request
   */
  async create({ tripId, passengerId, seats, note }) {
    const doc = await BookingRequestModel.create({
      tripId,
      passengerId,
      seats,
      note,
      status: 'pending'
    });

    return this._toDomain(doc);
  }

  /**
   * Find booking request by ID
   * @param {string} id - Booking request ID
   * @returns {Promise<BookingRequest|null>}
   */
  async findById(id) {
    const doc = await BookingRequestModel.findById(id);
    return this._toDomain(doc);
  }

  /**
   * Find active booking for a passenger on a specific trip
   * Used to prevent duplicate active bookings
   * @param {string} passengerId - Passenger ID
   * @param {string} tripId - Trip ID
   * @returns {Promise<BookingRequest|null>}
   */
  async findActiveBooking(passengerId, tripId) {
    const doc = await BookingRequestModel.findOne({
      passengerId,
      tripId,
      status: { $in: ['pending', 'accepted'] }
    });

    return this._toDomain(doc);
  }

  /**
   * Find all booking requests by passenger
   * @param {string} passengerId - Passenger ID
   * @param {Object} filters - Optional filters
   * @param {string|string[]} filters.status - Status filter (single or array)
   * @param {Date} filters.fromDate - Minimum createdAt date
   * @param {Date} filters.toDate - Maximum createdAt date
   * @param {number} filters.page - Page number (default: 1)
   * @param {number} filters.limit - Results per page (default: 10)
   * @returns {Promise<Object>} Paginated results with bookings, total, page, limit, totalPages
   */
  async findByPassenger(passengerId, { status, fromDate, toDate, page = 1, limit = 10 } = {}) {
    const query = { passengerId };

    if (status) {
      query.status = Array.isArray(status) ? { $in: status } : status;
    }

    // Date range filters
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        query.createdAt.$gte = fromDate;
      }
      if (toDate) {
        query.createdAt.$lte = toDate;
      }
    }

    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      BookingRequestModel.find(query)
        .sort({ createdAt: -1 }) // Most recent first
        .skip(skip)
        .limit(limit)
        .lean(),
      BookingRequestModel.countDocuments(query)
    ]);

    return {
      bookings: this._toDomainArray(docs),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Find booking requests with populated trip data (for API responses)
   * @param {string} passengerId - Passenger ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} Paginated results with Mongoose documents (with populated tripId)
   */
  async findByPassengerWithTrip(passengerId, { status, page = 1, limit = 10 } = {}) {
    const query = { passengerId };

    if (status) {
      query.status = Array.isArray(status) ? { $in: status } : status;
    }

    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      BookingRequestModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('tripId', 'origin destination departureAt estimatedArrivalAt pricePerSeat status')
        .lean(),
      BookingRequestModel.countDocuments(query)
    ]);

    return {
      bookings: docs, // Return Mongoose docs with populated tripId
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Update booking request status to canceled_by_passenger
   * @param {string} id - Booking request ID
   * @returns {Promise<BookingRequest>} Updated booking request
   */
  async cancel(id) {
    const doc = await BookingRequestModel.findByIdAndUpdate(
      id,
      {
        status: 'canceled_by_passenger',
        canceledAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!doc) {
      return null;
    }

    return this._toDomain(doc);
  }

  /**
   * Count active bookings for a trip
   * Used for capacity checking (future use)
   * @param {string} tripId - Trip ID
   * @returns {Promise<number>} Count of active bookings
   */
  async countActiveBookingsForTrip(tripId) {
    return BookingRequestModel.countDocuments({
      tripId,
      status: 'pending'
    });
  }

  /**
   * Find booking requests by trip (driver view)
   * @param {string} tripId - Trip ID
   * @param {Object} filters - Optional filters
   * @param {string|string[]} filters.status - Status filter (single or array)
   * @param {number} filters.page - Page number (default: 1)
   * @param {number} filters.limit - Results per page (default: 10, max: 50)
   * @returns {Promise<Object>} Paginated results with bookings, total, page, limit, totalPages
   */
  async findByTrip(tripId, { status, page = 1, limit = 10 } = {}) {
    const query = { tripId };

    if (status) {
      query.status = Array.isArray(status) ? { $in: status } : status;
    }

    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      BookingRequestModel.find(query)
        .sort({ createdAt: -1 }) // Most recent first
        .skip(skip)
        .limit(limit)
        .lean(),
      BookingRequestModel.countDocuments(query)
    ]);

    return {
      bookings: this._toDomainArray(docs),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Update booking request status to accepted (driver decision)
   * @param {string} id - Booking request ID
   * @param {string} driverId - Accepting driver ID
   * @returns {Promise<BookingRequest>} Updated booking request
   */
  async accept(id, driverId) {
    const doc = await BookingRequestModel.findByIdAndUpdate(
      id,
      {
        status: 'accepted',
        acceptedAt: new Date(),
        acceptedBy: driverId
      },
      { new: true, runValidators: true }
    );

    if (!doc) {
      return null;
    }

    return this._toDomain(doc);
  }

  /**
   * Update booking request status to declined (driver decision)
   * @param {string} id - Booking request ID
   * @param {string} driverId - Declining driver ID
   * @returns {Promise<BookingRequest>} Updated booking request
   */
  async decline(id, driverId) {
    const doc = await BookingRequestModel.findByIdAndUpdate(
      id,
      {
        status: 'declined',
        declinedAt: new Date(),
        declinedBy: driverId
      },
      { new: true, runValidators: true }
    );

    if (!doc) {
      return null;
    }

    return this._toDomain(doc);
  }

  /**
   * Delete booking request (for testing only)
   * @param {string} id - Booking request ID
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(id) {
    const result = await BookingRequestModel.findByIdAndDelete(id);
    return !!result;
  }
}

module.exports = MongoBookingRequestRepository;

