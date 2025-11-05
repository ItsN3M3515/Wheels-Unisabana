const mongoose = require('mongoose');
const ReviewModel = require('../../infrastructure/database/models/ReviewModel');
const TripOfferModel = require('../../infrastructure/database/models/TripOfferModel');
const BookingRequestModel = require('../../infrastructure/database/models/BookingRequestModel');
const RatingAggregateService = require('../../domain/services/ratingAggregateService');

class ReviewController {
  async createReview(req, res, next) {
    try {
      const { tripId } = req.params;
      const { rating, text = '', tags = [] } = req.body;
      const passengerId = req.user.sub;

      // Ensure trip exists and is completed
      const trip = await TripOfferModel.findById(tripId).lean();
      if (!trip) {
        return res.status(404).json({ code: 'not_found', message: 'Trip not found', correlationId: req.correlationId });
      }

      if (trip.status !== 'completed') {
        return res.status(400).json({ code: 'trip_not_completed', message: 'Reviews can only be created for completed trips', correlationId: req.correlationId });
      }

      // Ensure passenger had an accepted booking for this trip
      const booking = await BookingRequestModel.findOne({ passengerId, tripId, status: 'accepted' });
      if (!booking) {
        return res.status(403).json({ code: 'not_participant', message: 'Only trip participants may write a review', correlationId: req.correlationId });
      }

      // Prevent duplicates at application level (unique index may not be ready in tests)
      const existing = await ReviewModel.findOne({ passengerId, tripId });
      if (existing) {
        return res.status(409).json({ code: 'review_exists', message: 'Passenger has already reviewed this trip', correlationId: req.correlationId });
      }

      const review = await ReviewModel.create({
        tripId,
        driverId: trip.driverId,
        passengerId,
        rating,
        text,
        tags
      });

      return res.status(201).json({
        id: review._id.toString(),
        tripId: review.tripId.toString(),
        driverId: review.driverId.toString(),
        passengerId: review.passengerId.toString(),
        rating: review.rating,
        text: review.text,
        tags: review.tags,
        createdAt: review.createdAt
      });
    } catch (error) {
      next(error);
    }
  }

  async listReviewsForDriver(req, res, next) {
    try {
      const { driverId } = req.params;
      const { page = 1, pageSize = 10 } = req.query;

      // Verify driver exists
      const UserModel = require('../../infrastructure/database/models/UserModel');
      const driver = await UserModel.findById(driverId).lean();
      if (!driver) {
        return res.status(404).json({ code: 'not_found', message: 'Driver not found', correlationId: req.correlationId });
      }

      const query = { driverId, status: 'visible' };

      const pageNum = parseInt(page, 10) || 1;
      const size = Math.min(parseInt(pageSize, 10) || 10, 50);
      const skip = (pageNum - 1) * size;

      const [itemsRaw, total] = await Promise.all([
        ReviewModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(size)
          .populate('passengerId', 'firstName lastName')
          .lean(),
        ReviewModel.countDocuments(query)
      ]);

      const items = itemsRaw.map(r => {
        const firstName = r.passengerId?.firstName || '';
        const lastName = r.passengerId?.lastName || '';
        const author = firstName ? `${firstName} ${lastName ? (lastName.charAt(0) + '.') : ''}`.trim() : 'Anonymous';

        return {
          id: r._id.toString(),
          rating: r.rating,
          text: r.text,
          tags: r.tags || [],
          author,
          createdAt: r.createdAt
        };
      });

      const totalPages = Math.ceil(total / size);

      return res.status(200).json({ items, page: pageNum, pageSize: size, total, totalPages });
    } catch (err) {
      next(err);
    }
  }

  async getDriverRatings(req, res, next) {
    try {
      const { driverId } = req.params;
      const UserModel = require('../../infrastructure/database/models/UserModel');
      const driver = await UserModel.findById(driverId).lean();
      if (!driver) {
        return res.status(404).json({ code: 'not_found', message: 'Driver not found', correlationId: req.correlationId });
      }

      const RatingAggregateService = require('../../domain/services/ratingAggregateService');
      const agg = await RatingAggregateService.getAggregate(driverId);

      // Ensure consistent response shape
      const response = {
        driverId: String(driverId),
        avgRating: agg?.avgRating || 0,
        count: agg?.count || 0,
        histogram: agg?.histogram || { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
        updatedAt: agg?.updatedAt || new Date()
      };

      return res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /passengers/trips/:tripId/reviews/me
   * Return the caller's own review for the trip if present (visible or hidden allowed).
   */
  async getMyReviewForTrip(req, res, next) {
    try {
      const { tripId } = req.params;
      const passengerId = req.user.sub;

      const review = await ReviewModel.findOne({ tripId, passengerId }).lean();
      if (!review) {
        return res.status(404).json({ code: 'not_found', message: 'Review not found', correlationId: req.correlationId });
      }

      // compute lock/close window (24 hours from creation)
      const createdAt = review.createdAt || review._id.getTimestamp?.();
      const lockMs = 24 * 60 * 60 * 1000; // 24 hours
      const lockedAt = createdAt ? new Date(new Date(createdAt).getTime() + lockMs) : null;

      return res.status(200).json({
        id: review._id.toString(),
        rating: review.rating,
        text: review.text,
        tags: review.tags || [],
        createdAt: review.createdAt,
        lockedAt
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /passengers/trips/:tripId/reviews/:reviewId
   * Soft-delete (hidden) allowed only within 24h window by owner. Updates aggregates transactionally.
   */
  async deleteMyReview(req, res, next) {
    const session = await mongoose.startSession();
    try {
      const { tripId, reviewId } = req.params;
      const passengerId = req.user.sub;

      // Ensure review exists and belongs to caller
      const review = await ReviewModel.findOne({ _id: reviewId, tripId }).session(session);
      if (!review) {
        await session.endSession();
        return res.status(404).json({ code: 'not_found', message: 'Review not found', correlationId: req.correlationId });
      }

      if (String(review.passengerId) !== String(passengerId)) {
        await session.endSession();
        return res.status(403).json({ code: 'forbidden_owner', message: 'You are not the author', correlationId: req.correlationId });
      }

      const createdAt = review.createdAt;
      const lockMs = 24 * 60 * 60 * 1000; // 24 hours
      const windowClose = new Date(new Date(createdAt).getTime() + lockMs);
      const now = new Date();
      if (now > windowClose) {
        await session.endSession();
        return res.status(400).json({ code: 'review_locked', message: 'Delete window has closed', correlationId: req.correlationId });
      }

      // Perform soft-delete and recompute aggregates in a transaction
      session.startTransaction();

      await ReviewModel.updateOne({ _id: reviewId }, { $set: { status: 'hidden' } }, { session });

      // Recompute aggregate for affected driver within same session
      await RatingAggregateService.recomputeAggregate(review.driverId, session);

      await session.commitTransaction();
      await session.endSession();

      return res.status(200).json({ deleted: true });
    } catch (err) {
      try {
        await session.abortTransaction();
      } catch (e) {
        // ignore
      }
      await session.endSession();
      next(err);
    }
  }
}

module.exports = ReviewController;
