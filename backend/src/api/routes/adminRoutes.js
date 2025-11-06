const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/authenticate');
const { requireRole } = require('../middlewares/authenticate');
const adminController = require('../controllers/adminController');

// GET /admin/users
router.get('/users', authenticate, requireRole(['admin']), adminController.listUsers);

module.exports = router;
