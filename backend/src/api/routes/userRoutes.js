const express = require('express');
const UserController = require('../controllers/userController');
const validateRequest = require('../middlewares/validateRequest');
const { createUserSchema } = require('../validation/userSchemas');
const { upload, handleUploadError, cleanupOnError } = require('../middlewares/uploadMiddleware');
const { publicRateLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();
const userController = new UserController();

/**
 * POST /users - Registrar nuevo usuario
 * 
 * Body (JSON):
 * - firstName: string (required)
 * - lastName: string (required)
 * - universityId: string (required)
 * - corporateEmail: string (required)
 * - phone: string (required)
 * - password: string (required)
 * - role: 'passenger' | 'driver' (required)
 * 
 * Body (multipart/form-data):
 * - Todos los campos anteriores como text fields
 * - profilePhoto: file (optional) - imagen JPEG/PNG/WebP, max 5MB
 * 
 * Response 201:
 * - Usuario creado con DTO sanitizado
 * - Para Driver: incluye driver: { hasVehicle: false }
 * 
 * Errors:
 * - 400: invalid_schema (validation errors)
 * - 409: duplicate_email | duplicate_universityId
 * - 413: payload_too_large (file size)
 * - 429: rate_limit_exceeded
 */
router.post(
  '/',
  publicRateLimiter, // Rate limiting para registro
  upload.single('profilePhoto'), // Manejar archivo opcional
  handleUploadError, // Manejar errores de upload
  cleanupOnError, // Cleanup automático en caso de error
  validateRequest(createUserSchema, 'body'), // Validar datos
  userController.register.bind(userController)
);

/**
 * GET /users/profile - Obtener perfil (stub para futuro)
 * TODO: Implementar cuando se agregue autenticación
 */
router.get('/profile', userController.getProfile.bind(userController));

/**
 * PUT /users/profile - Actualizar perfil (stub para futuro)
 * TODO: Implementar cuando se agregue autenticación
 */
router.put('/profile', userController.updateProfile.bind(userController));

module.exports = router;

