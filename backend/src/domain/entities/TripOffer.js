/**
 * TripOffer Domain Entity
 * Represents a driver's trip offer with origin, destination, timing, pricing, and capacity.
 */
class TripOffer {
  constructor({
    id,
    driverId,
    vehicleId,
    origin,
    destination,
    departureAt,
    estimatedArrivalAt,
    pricePerSeat,
    totalSeats,
    status = 'published',
    notes = '',
    createdAt,
    updatedAt
  }) {
    this.id = id;
    this.driverId = driverId;
    this.vehicleId = vehicleId;
    this.origin = origin; // { text: string, geo: { lat: number, lng: number } }
    this.destination = destination; // Same shape
    this.departureAt = departureAt instanceof Date ? departureAt : new Date(departureAt);
    this.estimatedArrivalAt = estimatedArrivalAt instanceof Date ? estimatedArrivalAt : new Date(estimatedArrivalAt);
    this.pricePerSeat = pricePerSeat;
    this.totalSeats = totalSeats;
    this.status = status;
    this.notes = notes;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Validate temporal constraints
   */
  validateTiming() {
    if (this.departureAt >= this.estimatedArrivalAt) {
      throw new Error('estimatedArrivalAt must be after departureAt');
    }
  }

  /**
   * Check if departureAt is in the future
   */
  isDepartureInFuture() {
    return this.departureAt > new Date();
  }

  /**
   * Check if trip is editable
   */
  isEditable() {
    return this.status !== 'canceled' && this.status !== 'completed';
  }

  /**
   * Check if trip can be published
   */
  canBePublished() {
    return this.status === 'draft' && this.isDepartureInFuture();
  }

  /**
   * Check if trip can be canceled
   */
  canBeCanceled() {
    return this.status === 'published' && this.isDepartureInFuture();
  }

  /**
   * Check if status transition is valid
   */
  canTransitionTo(newStatus) {
    const validTransitions = {
      draft: ['published', 'canceled'],
      published: ['canceled', 'completed'],
      canceled: [], // No transitions from canceled
      completed: [] // No transitions from completed
    };

    return validTransitions[this.status]?.includes(newStatus) || false;
  }

  /**
   * Check if trip time window overlaps with another trip
   */
  overlapsWith(otherTrip) {
    // Check if [this.departureAt, this.estimatedArrivalAt] overlaps with [other.departureAt, other.estimatedArrivalAt]
    return (
      this.departureAt < otherTrip.estimatedArrivalAt &&
      this.estimatedArrivalAt > otherTrip.departureAt
    );
  }

  /**
   * Update mutable fields
   */
  update({ pricePerSeat, totalSeats, notes, status }) {
    if (pricePerSeat !== undefined) this.pricePerSeat = pricePerSeat;
    if (totalSeats !== undefined) this.totalSeats = totalSeats;
    if (notes !== undefined) this.notes = notes;
    if (status !== undefined) {
      if (!this.canTransitionTo(status)) {
        throw new Error(`Invalid status transition from ${this.status} to ${status}`);
      }
      this.status = status;
    }
    this.updatedAt = new Date();
  }

  /**
   * Soft cancel the trip
   */
  cancel() {
    if (!this.canBeCanceled() && this.status !== 'draft') {
      throw new Error(`Cannot cancel trip with status: ${this.status}`);
    }
    this.status = 'canceled';
    this.updatedAt = new Date();
  }
}

module.exports = TripOffer;
