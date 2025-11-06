const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/authenticate');
const { requireRole } = require('../middlewares/authenticate');
const adminController = require('../controllers/adminController');

// GET /admin/users
router.get('/users', authenticate, requireRole(['admin']), adminController.listUsers);

// GET /admin/trips
router.get('/trips', authenticate, requireRole(['admin']), adminController.listTrips);

// GET /admin/bookings
router.get('/bookings', authenticate, requireRole(['admin']), adminController.listBookings);

// GET /admin/refunds
router.get('/refunds', authenticate, requireRole(['admin']), adminController.listRefunds);

module.exports = router;
