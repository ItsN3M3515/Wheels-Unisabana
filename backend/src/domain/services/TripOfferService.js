const TripOffer = require('../entities/TripOffer');
const CreateTripOfferDto = require('../dtos/CreateTripOfferDto');
const UpdateTripOfferDto = require('../dtos/UpdateTripOfferDto');
const ValidationError = require('../errors/ValidationError');
const DomainError = require('../errors/DomainError');

/**
 * Trip Offer Service
 * Business logic for trip offer management with ownership and temporal invariants
 */
class TripOfferService {
  constructor(tripOfferRepository, vehicleRepository, userRepository) {
    this.tripOfferRepository = tripOfferRepository;
    this.vehicleRepository = vehicleRepository;
    this.userRepository = userRepository;
  }

  /**
   * Create a new trip offer
   * Validates driver-vehicle ownership, temporal constraints, and optional overlap check
   */
  async createTripOffer(driverId, createDto, { checkOverlap = true } = {}) {
    // Validate DTO
    const dtoErrors = createDto.validate();
    if (dtoErrors.length > 0) {
      throw new ValidationError(`Invalid trip offer data: ${dtoErrors.join(', ')}`);
    }

    // Validate driver exists and has role 'driver'
    const driver = await this.userRepository.findById(driverId);
    if (!driver) {
      throw new DomainError('Driver not found', 'driver_not_found');
    }

    if (driver.role !== 'driver') {
      throw new DomainError('User is not a driver', 'not_a_driver');
    }

    // Validate vehicle exists and is owned by the driver
    const vehicle = await this.vehicleRepository.findById(createDto.vehicleId);
    if (!vehicle) {
      throw new DomainError('Vehicle not found', 'vehicle_not_found');
    }

    if (vehicle.ownerId !== driverId) {
      throw new DomainError(
        'Vehicle does not belong to the driver',
        'vehicle_ownership_violation'
      );
    }

    // Validate totalSeats does not exceed vehicle capacity
    if (createDto.totalSeats > vehicle.capacity) {
      throw new DomainError(
        `totalSeats (${createDto.totalSeats}) exceeds vehicle capacity (${vehicle.capacity})`,
        'exceeds_vehicle_capacity'
      );
    }

    // Parse dates
    const departureAt = new Date(createDto.departureAt);
    const estimatedArrivalAt = new Date(createDto.estimatedArrivalAt);

    // Validate departureAt is in the future (only for published trips)
    if (createDto.status === 'published' && departureAt <= new Date()) {
      throw new DomainError('departureAt must be in the future', 'departure_in_past');
    }

    // Validate estimatedArrivalAt > departureAt
    if (estimatedArrivalAt <= departureAt) {
      throw new DomainError(
        'estimatedArrivalAt must be after departureAt',
        'invalid_time_range'
      );
    }

    // Optional: Check for overlapping published trips
    if (checkOverlap && createDto.status === 'published') {
      const overlappingTrips = await this.tripOfferRepository.findOverlappingTrips(
        driverId,
        departureAt,
        estimatedArrivalAt
      );

      if (overlappingTrips.length > 0) {
        throw new DomainError(
          'You have another published trip during this time window',
          'overlapping_trip'
        );
      }
    }

    // Create trip offer
    const tripData = {
      driverId,
      vehicleId: createDto.vehicleId,
      origin: createDto.origin,
      destination: createDto.destination,
      departureAt,
      estimatedArrivalAt,
      pricePerSeat: createDto.pricePerSeat,
      totalSeats: createDto.totalSeats,
      status: createDto.status,
      notes: createDto.notes
    };

    const tripOffer = await this.tripOfferRepository.create(tripData);

    console.log(
      `[TripOfferService] Trip offer created | tripId: ${tripOffer.id} | driverId: ${driverId} | status: ${tripOffer.status} | departure: ${tripOffer.departureAt.toISOString()}`
    );

    return tripOffer;
  }

  /**
   * Get trip offer by ID
   */
  async getTripOfferById(tripId) {
    const tripOffer = await this.tripOfferRepository.findById(tripId);
    if (!tripOffer) {
      throw new DomainError('Trip offer not found', 'trip_not_found');
    }
    return tripOffer;
  }

  /**
   * Get trip offers by driver ID
   */
  async getTripOffersByDriver(driverId, filters = {}) {
    return this.tripOfferRepository.findByDriverId(driverId, filters);
  }

  /**
   * Update trip offer
   * Validates ownership, mutable fields, status transitions, and capacity constraints
   */
  async updateTripOffer(tripId, driverId, updateDto, { checkOverlap = true } = {}) {
    // Validate DTO
    const dtoErrors = updateDto.validate();
    if (dtoErrors.length > 0) {
      throw new ValidationError(`Invalid update data: ${dtoErrors.join(', ')}`);
    }

    if (!updateDto.hasUpdates()) {
      throw new ValidationError('No fields to update');
    }

    // Find trip offer
    const tripOffer = await this.tripOfferRepository.findById(tripId);
    if (!tripOffer) {
      throw new DomainError('Trip offer not found', 'trip_not_found');
    }

    // Validate ownership
    if (tripOffer.driverId !== driverId) {
      throw new DomainError('You do not own this trip offer', 'ownership_violation');
    }

    // Status guard: Cannot update canceled or completed trips (except notes)
    if ((tripOffer.status === 'canceled' || tripOffer.status === 'completed') && 
        (updateDto.pricePerSeat !== undefined || updateDto.totalSeats !== undefined || updateDto.status !== undefined)) {
      throw new DomainError(
        `Cannot update ${tripOffer.status} trip (only notes can be updated)`,
        'invalid_status_for_update'
      );
    }

    // Validate status transition
    if (updateDto.status && !tripOffer.canTransitionTo(updateDto.status)) {
      throw new DomainError(
        `Invalid status transition from ${tripOffer.status} to ${updateDto.status}`,
        'invalid_status_transition'
      );
    }

    // If publishing a draft, validate departureAt is still in the future
    if (updateDto.status === 'published' && tripOffer.status === 'draft') {
      if (!tripOffer.isDepartureInFuture()) {
        throw new DomainError('Cannot publish trip with past departure time', 'departure_in_past');
      }
    }

    // Validate totalSeats does not exceed vehicle capacity
    if (updateDto.totalSeats !== undefined) {
      const vehicle = await this.vehicleRepository.findById(tripOffer.vehicleId);
      if (updateDto.totalSeats > vehicle.capacity) {
        throw new DomainError(
          `totalSeats (${updateDto.totalSeats}) exceeds vehicle capacity (${vehicle.capacity})`,
          'exceeds_vehicle_capacity'
        );
      }

      // Future: Cannot reduce totalSeats below already-booked seats
      // This check will be implemented in later story when booking logic exists
      // For now, just log a warning
      console.log(
        `[TripOfferService] totalSeats updated | tripId: ${tripId} | oldValue: ${tripOffer.totalSeats} | newValue: ${updateDto.totalSeats}`
      );
    }

    // Optional: Check for overlapping trips if status changes to published
    if (checkOverlap && updateDto.status === 'published' && tripOffer.status !== 'published') {
      const overlappingTrips = await this.tripOfferRepository.findOverlappingTrips(
        driverId,
        tripOffer.departureAt,
        tripOffer.estimatedArrivalAt,
        tripId
      );

      if (overlappingTrips.length > 0) {
        throw new DomainError(
          'You have another published trip during this time window',
          'overlapping_trip'
        );
      }
    }

    // Prepare updates
    const updates = {};
    if (updateDto.pricePerSeat !== undefined) updates.pricePerSeat = updateDto.pricePerSeat;
    if (updateDto.totalSeats !== undefined) updates.totalSeats = updateDto.totalSeats;
    if (updateDto.notes !== undefined) updates.notes = updateDto.notes;
    if (updateDto.status !== undefined) updates.status = updateDto.status;

    // Update trip offer
    const updatedTripOffer = await this.tripOfferRepository.update(tripId, updates);

    console.log(
      `[TripOfferService] Trip offer updated | tripId: ${tripId} | driverId: ${driverId} | updates: ${Object.keys(updates).join(', ')}`
    );

    return updatedTripOffer;
  }

  /**
   * Cancel (soft delete) trip offer
   */
  async cancelTripOffer(tripId, driverId) {
    // Find trip offer
    const tripOffer = await this.tripOfferRepository.findById(tripId);
    if (!tripOffer) {
      throw new DomainError('Trip offer not found', 'trip_not_found');
    }

    // Validate ownership
    if (tripOffer.driverId !== driverId) {
      throw new DomainError('You do not own this trip offer', 'ownership_violation');
    }

    // Validate trip can be canceled
    if (tripOffer.status === 'canceled') {
      throw new DomainError('Trip is already canceled', 'already_canceled');
    }

    if (tripOffer.status === 'completed') {
      throw new DomainError('Cannot cancel completed trip', 'cannot_cancel_completed');
    }

    // Cancel trip offer
    const canceledTripOffer = await this.tripOfferRepository.cancel(tripId);

    console.log(
      `[TripOfferService] Trip offer canceled | tripId: ${tripId} | driverId: ${driverId}`
    );

    // Future: Notify passengers about cancellation (later story)

    return canceledTripOffer;
  }

  /**
   * Get upcoming published trips by driver
   */
  async getUpcomingTripsByDriver(driverId) {
    return this.tripOfferRepository.findUpcomingByDriver(driverId);
  }
}

module.exports = TripOfferService;
