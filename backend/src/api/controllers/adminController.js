const TripOfferModel = require('../../infrastructure/database/models/TripOfferModel');
const BookingRequestModel = require('../../infrastructure/database/models/BookingRequestModel');
const UserModel = require('../../infrastructure/database/models/UserModel');
const AuditService = require('../../domain/services/AuditService');

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

// Exports consolidated at end of file

/**
 * Admin: List trips with filters, pagination and capacity snapshot
 * Filters supported: status, driverId, from (origin.text), to (destination.text), departureFrom, departureTo
 */
/**
 * @openapi
 * /admin/trips:
 *   get:
 *     tags:
 *       - System
 *       - Trip Offers
 *     summary: List trips (admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: driverId
 *         schema:
 *           type: string
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *       - in: query
 *         name: departureFrom
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: departureTo
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of trips with capacity snapshot
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TripOfferResponse'
 *                 page:
 *                   type: integer
 *                 pageSize:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 requestId:
 *                   type: string
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

// Exports consolidated at end of file

// Helper: mask name like J*** D***
function maskName(firstName, lastName) {
  const mask = (s) => {
    if (!s || s.length === 0) return '';
    const first = s[0];
    return `${first}***`;
  };
  return `${mask(firstName)} ${mask(lastName)}`.trim();
}

/**
 * Admin: List bookings with filters, pagination and optional transaction summary
 */
async function listBookings(req, res, next) {
  try {
    const {
      tripId,
      passengerId,
      status,
      paid,
      createdFrom,
      createdTo,
      page = '1',
      pageSize = '25',
      sort = '-createdAt'
    } = req.query;

    const pageNum = parseInt(page, 10);
    const pageSizeNum = parseInt(pageSize, 10);
    if (Number.isNaN(pageNum) || Number.isNaN(pageSizeNum) || pageNum < 1 || pageSizeNum < 1) {
      return res.status(400).json({ code: 'invalid_schema', message: 'Invalid pagination parameters', correlationId: req.correlationId });
    }

    const query = {};
    if (tripId) query.tripId = tripId;
    if (passengerId) query.passengerId = passengerId;
    if (status) query.status = Array.isArray(status) ? { $in: status } : status;
    if (typeof paid !== 'undefined') {
      if (paid === 'true' || paid === true) query.isPaid = true;
      else if (paid === 'false' || paid === false) query.isPaid = false;
    }
    if (createdFrom || createdTo) {
      query.createdAt = {};
      if (createdFrom) query.createdAt.$gte = new Date(createdFrom);
      if (createdTo) query.createdAt.$lte = new Date(createdTo);
    }

    const sortObj = {};
    if (sort) {
      const direction = sort.startsWith('-') ? -1 : 1;
      const field = sort.replace(/^-/, '');
      sortObj[field] = direction;
    } else {
      sortObj.createdAt = -1;
    }

    const skip = (pageNum - 1) * pageSizeNum;

    const [total, docs] = await Promise.all([
      BookingRequestModel.countDocuments(query),
      BookingRequestModel.find(query)
        .populate('passengerId', 'firstName lastName')
        .sort(sortObj)
        .skip(skip)
        .limit(pageSizeNum)
        .lean()
    ]);

    // For transaction lookup, query payments collection if present
    const db = require('mongoose').connection.db;

    const items = await Promise.all(docs.map(async (b) => {
      const passenger = b.passengerId || null;
      const passengerDto = passenger ? { id: passenger._id.toString(), name: maskName(passenger.firstName, passenger.lastName) } : null;

      // Try to find a transaction in the 'payments' collection linked by bookingRequestId or bookingId
      let txn = null;
      try {
        if (db && b._id) {
          const paymentsColl = db.collection('payments');
          const found = await paymentsColl.findOne({ bookingRequestId: b._id });
          if (found) {
            txn = {
              id: (found._id || found.id).toString(),
              amount: found.amount || null,
              currency: found.currency || null,
              status: found.status || null,
              refundedAmount: found.refundedAmount || 0
            };
          }
        }
      } catch (e) {
        // ignore transaction lookup errors
      }

      return {
        id: b._id.toString(),
        tripId: b.tripId ? b.tripId.toString() : null,
        passenger: passengerDto,
        status: b.status,
        seats: b.seats || 0,
        transaction: txn
      };
    }));

    const totalPages = Math.max(1, Math.ceil(total / pageSizeNum));

    res.json({ items, page: pageNum, pageSize: pageSizeNum, total, totalPages, requestId: req.correlationId });
  } catch (err) {
    next(err);
  }
}

// Exports consolidated at end of file

/**
 * PATCH /admin/users/:id/suspension
 * Body: { action: 'suspend'|'unsuspend', reason: string }
 */
async function suspendUser(req, res, next) {
  try {
    const userId = req.params.id;
    const { action, reason } = req.body || {};

    if (!action || !['suspend', 'unsuspend'].includes(action) || !reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return res.status(400).json({ code: 'invalid_schema', message: 'Missing or invalid action/reason', correlationId: req.correlationId });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ code: 'not_found', message: 'User not found', correlationId: req.correlationId });
    }

    const adminId = req.user && req.user.id ? req.user.id : null;

    if (action === 'suspend') {
      // Idempotent: if already suspended, return current state
      if (user.suspended) {
        // Still create an audit entry for the admin attempt
        await AuditService.recordAdminAction({ action: 'suspend_attempt', entity: 'User', entityId: userId, who: adminId, before: { suspended: true }, after: { suspended: true }, why: reason, req });
        return res.json({ userId: userId.toString(), status: 'suspended', suspendedAt: user.suspendedAt ? new Date(user.suspendedAt).toISOString() : new Date().toISOString(), by: adminId });
      }

      const before = { suspended: !!user.suspended, suspendedAt: user.suspendedAt, suspensionReason: user.suspensionReason };
      user.suspended = true;
      user.suspendedAt = new Date();
      user.suspendedBy = adminId;
      user.suspensionReason = reason;
      await user.save();

      const after = { suspended: user.suspended, suspendedAt: user.suspendedAt, suspensionReason: user.suspensionReason };
      await AuditService.recordAdminAction({ action: 'suspend', entity: 'User', entityId: userId, who: adminId, before, after, why: reason, req });

      return res.json({ userId: userId.toString(), status: 'suspended', suspendedAt: user.suspendedAt.toISOString(), by: adminId });
    }

    // unsuspend
    if (!user.suspended) {
      // idempotent no-op
      await AuditService.recordAdminAction({ action: 'unsuspend_attempt', entity: 'User', entityId: userId, who: adminId, before: { suspended: false }, after: { suspended: false }, why: reason, req });
      return res.json({ userId: userId.toString(), status: 'active', by: adminId });
    }

    const beforeU = { suspended: true, suspendedAt: user.suspendedAt, suspensionReason: user.suspensionReason };
    user.suspended = false;
    user.suspendedAt = null;
    user.suspendedBy = adminId;
    user.suspensionReason = '';
    await user.save();
    const afterU = { suspended: false, suspendedAt: null, suspensionReason: '' };
    await AuditService.recordAdminAction({ action: 'unsuspend', entity: 'User', entityId: userId, who: adminId, before: beforeU, after: afterU, why: reason, req });

    return res.json({ userId: userId.toString(), status: 'active', by: adminId });

  } catch (err) {
    next(err);
  }
}

module.exports.suspendUser = suspendUser;

/**
 * Admin: List refunds with filters and pagination
 * Filters: status, reason, transactionId, bookingId, createdFrom, createdTo
 */
async function listRefunds(req, res, next) {
  try {
    const {
      status,
      reason,
      transactionId,
      bookingId,
      createdFrom,
      createdTo,
      page = '1',
      pageSize = '25',
      sort = '-createdAt'
    } = req.query;

    const pageNum = parseInt(page, 10);
    const pageSizeNum = parseInt(pageSize, 10);
    if (Number.isNaN(pageNum) || Number.isNaN(pageSizeNum) || pageNum < 1 || pageSizeNum < 1) {
      return res.status(400).json({ code: 'invalid_schema', message: 'Invalid pagination parameters', correlationId: req.correlationId });
    }

    const db = require('mongoose').connection.db;
    const coll = db.collection('refunds');

    const query = {};
    if (status) query.status = status;
    if (reason) query.reason = reason;
    if (transactionId) query.transactionId = transactionId;
    if (bookingId) query.bookingRequestId = bookingId;
    if (createdFrom || createdTo) {
      query.createdAt = {};
      if (createdFrom) query.createdAt.$gte = new Date(createdFrom);
      if (createdTo) query.createdAt.$lte = new Date(createdTo);
    }

    // Count and fetch
    const total = await coll.countDocuments(query);

    // Build sort
    const sortObj = {};
    if (sort) {
      const dir = sort.startsWith('-') ? -1 : 1;
      const field = sort.replace(/^-/, '');
      sortObj[field] = dir;
    } else {
      sortObj.createdAt = -1;
    }

    const skip = (pageNum - 1) * pageSizeNum;

    const docs = await coll.find(query).sort(sortObj).skip(skip).limit(pageSizeNum).toArray();

    const items = docs.map(d => ({
      id: (d._id || d.id).toString(),
      transactionId: d.transactionId || null,
      bookingId: d.bookingRequestId ? (d.bookingRequestId.toString ? d.bookingRequestId.toString() : d.bookingRequestId) : null,
      amount: d.amount || null,
      currency: d.currency || null,
      status: d.status || null,
      reason: d.reason || null,
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : null
    }));

    const totalPages = Math.max(1, Math.ceil(total / pageSizeNum));
    res.json({ items, page: pageNum, pageSize: pageSizeNum, total, totalPages, requestId: req.correlationId });
  } catch (err) {
    next(err);
  }
}

/**
 * @openapi
 * /admin/bookings:
 *   get:
 *     tags:
 *       - System
 *       - Trip Offers
 *     summary: List bookings (admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: tripId
 *         schema:
 *           type: string
 *       - in: query
 *         name: passengerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: paid
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       tripId:
 *                         type: string
 *                       passenger:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                       status:
 *                         type: string
 *                       seats:
 *                         type: integer
 *                       transaction:
 *                         type: object
 *                 page:
 *                   type: integer
 *                 pageSize:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 requestId:
 *                   type: string
 */

/**
 * @openapi
 * /admin/refunds:
 *   get:
 *     tags:
 *       - System
 *       - Trip Offers
 *     summary: List refunds (admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: transactionId
 *         schema:
 *           type: string
 *       - in: query
 *         name: bookingId
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of refunds
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       transactionId:
 *                         type: string
 *                       bookingId:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       currency:
 *                         type: string
 *                       status:
 *                         type: string
 *                       reason:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 page:
 *                   type: integer
 *                 pageSize:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 requestId:
 *                   type: string
 */

module.exports = { listUsers, listTrips, listBookings, listRefunds, suspendUser };
