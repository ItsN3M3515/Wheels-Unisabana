/**
 * BookingRequest Domain Entity
 * 
 * Represents a passenger's request to book seats on a trip offer.
 * Encapsulates business logic and invariants for booking requests.
 */

class BookingRequest {
  constructor({
    id,
    tripId,
    passengerId,
    status = 'pending',
    seats = 1,
    note = '',
    canceledAt = null,
    createdAt = new Date(),
    updatedAt = new Date()
  }) {
    this.id = id;
    this.tripId = tripId;
    this.passengerId = passengerId;
    this.status = status;
    this.seats = seats;
    this.note = note;
    this.canceledAt = canceledAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    this.validate();
  }

  /**
   * Validate booking request invariants
   */
  validate() {
    if (!this.tripId) {
      throw new Error('Trip ID is required');
    }

    if (!this.passengerId) {
      throw new Error('Passenger ID is required');
    }

    if (!['pending', 'canceled_by_passenger', 'accepted', 'declined', 'expired'].includes(this.status)) {
      throw new Error(`Invalid status: ${this.status}`);
    }

    if (!Number.isInteger(this.seats) || this.seats < 1) {
      throw new Error('Seats must be a positive integer');
    }

    if (this.note && this.note.length > 300) {
      throw new Error('Note cannot exceed 300 characters');
    }
  }

  /**
   * Check if this booking is active (not canceled/declined/expired)
   * Active means: pending or accepted
   */
  isActive() {
    return ['pending', 'accepted'].includes(this.status);
  }

  /**
   * Check if this booking is pending (awaiting driver action)
   */
  isPending() {
    return this.status === 'pending';
  }

  /**
   * Check if this booking has been canceled by passenger
   */
  isCanceledByPassenger() {
    return this.status === 'canceled_by_passenger';
  }

  /**
   * Check if this booking can be canceled by passenger
   * Only pending requests can be canceled
   */
  canBeCanceledByPassenger() {
    return this.status === 'pending';
  }

  /**
   * Cancel this booking request (passenger-initiated)
   * Idempotent: if already canceled, returns without error
   */
  cancelByPassenger() {
    if (this.status === 'canceled_by_passenger') {
      // Already canceled, idempotent - just return
      return this;
    }

    if (!this.canBeCanceledByPassenger()) {
      throw new Error(`Cannot cancel booking with status: ${this.status}. Only pending bookings can be canceled.`);
    }

    this.status = 'canceled_by_passenger';
    this.canceledAt = new Date();
    this.updatedAt = new Date();

    return this;
  }

  /**
   * Check if passenger owns this booking
   */
  belongsToPassenger(passengerId) {
    return this.passengerId === passengerId;
  }

  /**
   * Create a plain object representation (for database persistence)
   */
  toObject() {
    return {
      id: this.id,
      tripId: this.tripId,
      passengerId: this.passengerId,
      status: this.status,
      seats: this.seats,
      note: this.note,
      canceledAt: this.canceledAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = BookingRequest;

