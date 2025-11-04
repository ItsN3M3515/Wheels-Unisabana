const ReviewModel = require('../../infrastructure/database/models/ReviewModel');
const TripOfferModel = require('../../infrastructure/database/models/TripOfferModel');
const BookingRequestModel = require('../../infrastructure/database/models/BookingRequestModel');

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
}

module.exports = ReviewController;
