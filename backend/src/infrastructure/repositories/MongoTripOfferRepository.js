const TripOfferRepository = require('../../domain/repositories/TripOfferRepository');
const TripOfferModel = require('../database/models/TripOfferModel');
const TripOffer = require('../../domain/entities/TripOffer');

/**
 * MongoDB implementation of TripOfferRepository
 */
class MongoTripOfferRepository extends TripOfferRepository {
  /**
   * Map Mongoose document to domain entity
   * @private
   */
  _toDomain(doc) {
    if (!doc) return null;

    return new TripOffer({
      id: doc._id.toString(),
      driverId: doc.driverId.toString(),
      vehicleId: doc.vehicleId.toString(),
      origin: doc.origin,
      destination: doc.destination,
      departureAt: doc.departureAt,
      estimatedArrivalAt: doc.estimatedArrivalAt,
      pricePerSeat: doc.pricePerSeat,
      totalSeats: doc.totalSeats,
      status: doc.status,
      notes: doc.notes,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    });
  }

  /**
   * Map array of Mongoose documents to domain entities
   * @private
   */
  _toDomainArray(docs) {
    return docs.map((doc) => this._toDomain(doc));
  }

  async create(tripData) {
    const doc = await TripOfferModel.create(tripData);
    return this._toDomain(doc);
  }

  async findById(tripId) {
    const doc = await TripOfferModel.findById(tripId);
    return this._toDomain(doc);
  }

  async findByDriverId(driverId, filters = {}) {
    const query = { driverId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.fromDate) {
      query.departureAt = { $gte: new Date(filters.fromDate) };
    }

    if (filters.toDate) {
      query.departureAt = query.departureAt || {};
      query.departureAt.$lte = new Date(filters.toDate);
    }

    const docs = await TripOfferModel.find(query).sort({ departureAt: 1 });
    return this._toDomainArray(docs);
  }

  async findOverlappingTrips(driverId, departureAt, estimatedArrivalAt, excludeTripId = null) {
    const docs = await TripOfferModel.findOverlappingTrips(
      driverId,
      departureAt,
      estimatedArrivalAt,
      excludeTripId
    );
    return this._toDomainArray(docs);
  }

  async update(tripId, updates) {
    const doc = await TripOfferModel.findByIdAndUpdate(
      tripId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!doc) {
      throw new Error('Trip offer not found');
    }

    return this._toDomain(doc);
  }

  async cancel(tripId) {
    const doc = await TripOfferModel.findByIdAndUpdate(
      tripId,
      { $set: { status: 'canceled' } },
      { new: true }
    );

    if (!doc) {
      throw new Error('Trip offer not found');
    }

    return this._toDomain(doc);
  }

  async findUpcomingByDriver(driverId) {
    const docs = await TripOfferModel.findUpcomingByDriver(driverId);
    return this._toDomainArray(docs);
  }

  async countByDriverAndStatus(driverId, status) {
    return TripOfferModel.countDocuments({ driverId, status });
  }
}

module.exports = MongoTripOfferRepository;
