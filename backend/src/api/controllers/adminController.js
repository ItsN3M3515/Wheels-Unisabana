const TripOfferModel = require('../../infrastructure/database/models/TripOfferModel');
const BookingRequestModel = require('../../infrastructure/database/models/BookingRequestModel');
const UserModel = require('../../infrastructure/database/models/UserModel');

// Helper: mask email like a***@domain.com
function maskEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const local = parts[0];
  const domain = parts[1];
  if (local.length <= 1) return `*@${domain}`;
  return `${local[0]}***@${domain}`;
}

// Controller: List users for admin with filters, pagination and optional stats
async function listUsers(req, res, next) {
  try {
    const {
      role,
      status, // not persisted in current model, kept for API compatibility
      search,
      createdFrom,
      createdTo,
      page = '1',
      pageSize = '25',
      sort = '-createdAt'
    } = req.query;

    // Basic validation
    const pageNum = parseInt(page, 10);
    const pageSizeNum = parseInt(pageSize, 10);
    if (Number.isNaN(pageNum) || Number.isNaN(pageSizeNum) || pageNum < 1 || pageSizeNum < 1) {
      return res.status(400).json({ code: 'invalid_schema', message: 'Invalid query parameters', correlationId: req.correlationId });
    }

    const query = {};
    if (role) query.role = role;
    // Status is not part of current UserModel; if provided, translate to a simple flag for compatibility
    if (status) {
      if (!['active', 'suspended'].includes(status)) {
        return res.status(400).json({ code: 'invalid_schema', message: 'Invalid status filter', correlationId: req.correlationId });
      }
      // For now, assume all users are 'active' (no persisted status field)
      if (status === 'suspended') {
        // No users suspended in this simple implementation
        query._id = { $in: [] };
      }
    }

    if (createdFrom || createdTo) {
      query.createdAt = {};
      if (createdFrom) query.createdAt.$gte = new Date(createdFrom);
      if (createdTo) query.createdAt.$lte = new Date(createdTo);
    }

    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { firstName: re },
        { lastName: re },
        { corporateEmail: re }
      ];
    }

    const sortObj = {};
    // Support simple -field or field sort
    if (sort) {
      const direction = sort.startsWith('-') ? -1 : 1;
      const field = sort.replace(/^-/, '');
      sortObj[field] = direction;
    } else {
      sortObj.createdAt = -1;
    }

    const skip = (pageNum - 1) * pageSizeNum;

    const [total, docs] = await Promise.all([
      UserModel.countDocuments(query),
      UserModel.find(query)
        .select('firstName lastName corporateEmail role createdAt')
        .sort(sortObj)
        .skip(skip)
        .limit(pageSizeNum)
        .lean()
    ]);

    // For each user, compute masked DTO and optional stats
    const items = await Promise.all(docs.map(async (u) => {
      // Compute stats: tripsPublished (driver) and bookingsMade (passenger)
      const userId = u._id;
      const tripsPublished = await TripOfferModel.countDocuments({ driverId: userId });
      const bookingsMade = await BookingRequestModel.countDocuments({ passengerId: userId });

      return {
        id: userId.toString(),
        name: `${u.firstName} ${u.lastName}`.trim(),
        emailMasked: maskEmail(u.corporateEmail),
        role: u.role || 'passenger',
        status: 'active',
        createdAt: u.createdAt,
        stats: { tripsPublished, bookingsMade }
      };
    }));

    const totalPages = Math.max(1, Math.ceil(total / pageSizeNum));

    res.json({
      items,
      page: pageNum,
      pageSize: pageSizeNum,
      total,
      totalPages,
      requestId: req.correlationId
    });

  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers };

/**
 * Admin: List trips with filters, pagination and capacity snapshot
 * Filters supported: status, driverId, from (origin.text), to (destination.text), departureFrom, departureTo
 */
async function listTrips(req, res, next) {
  try {
    const {
      status,
      driverId,
      from,
      to,
      departureFrom,
      departureTo,
      page = '1',
      pageSize = '25',
      sort = '-departureAt'
    } = req.query;

    const pageNum = parseInt(page, 10);
    const pageSizeNum = parseInt(pageSize, 10);
    if (Number.isNaN(pageNum) || Number.isNaN(pageSizeNum) || pageNum < 1 || pageSizeNum < 1) {
      return res.status(400).json({ code: 'invalid_schema', message: 'Invalid pagination parameters', correlationId: req.correlationId });
    }

    const query = {};
    if (status) {
      query.status = Array.isArray(status) ? { $in: status } : status;
    }
    if (driverId) {
      // Accept driverId string
      query.driverId = driverId;
    }
    if (from) {
      query['origin.text'] = from;
    }
    if (to) {
      query['destination.text'] = to;
    }
    if (departureFrom || departureTo) {
      query.departureAt = {};
      if (departureFrom) query.departureAt.$gte = new Date(departureFrom);
      if (departureTo) query.departureAt.$lte = new Date(departureTo);
    }

    const sortObj = {};
    if (sort) {
      const direction = sort.startsWith('-') ? -1 : 1;
      const field = sort.replace(/^-/, '');
      sortObj[field] = direction;
    } else {
      sortObj.departureAt = -1;
    }

    const skip = (pageNum - 1) * pageSizeNum;

    // Count total and fetch page
    const [total, docs] = await Promise.all([
      TripOfferModel.countDocuments(query),
      TripOfferModel.find(query)
        .select('driverId origin destination departureAt status totalSeats')
        .sort(sortObj)
        .skip(skip)
        .limit(pageSizeNum)
        .lean()
    ]);

    // For each trip compute allocatedSeats (accepted bookings) and remaining
    const items = await Promise.all(docs.map(async (t) => {
      const tripId = t._id;
      const allocatedSeats = await BookingRequestModel.countDocuments({ tripId, status: 'accepted' });
      const totalSeats = t.totalSeats || 0;
      const remainingSeats = Math.max(0, totalSeats - allocatedSeats);

      return {
        id: tripId.toString(),
        driverId: t.driverId ? t.driverId.toString() : null,
        route: { from: t.origin && t.origin.text ? t.origin.text : '', to: t.destination && t.destination.text ? t.destination.text : '' },
        departureAt: t.departureAt ? new Date(t.departureAt).toISOString() : null,
        status: t.status,
        capacity: { totalSeats, allocatedSeats, remainingSeats }
      };
    }));

    const totalPages = Math.max(1, Math.ceil(total / pageSizeNum));

    res.json({ items, page: pageNum, pageSize: pageSizeNum, total, totalPages, requestId: req.correlationId });
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, listTrips };
