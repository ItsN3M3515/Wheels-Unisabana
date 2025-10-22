const express = require('express');
const AuthController = require('../controllers/authController');
const validateRequest = require('../middlewares/validateRequest');
const { loginSchema } = require('../validation/authSchemas');
const { loginRateLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();
const authController = new AuthController();

/**
 * AUTH ROUTES
 * 
 * Endpoints:
 * - POST /auth/login - Create session (set JWT cookie)
 * - POST /auth/logout - Destroy session (clear cookie)
 * 
 * Security:
 * - Rate limiting (5 login attempts/min/IP)
 * - Generic error messages (no user enumeration)
 * - HttpOnly cookies (XSS protection)
 * - Secure flag in production (HTTPS only)
 * - SameSite cookies (CSRF protection)
 */

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User login (session creation)
 *     description: |
 *       Authenticates user and sets httpOnly cookie with JWT.
 *       
 *       **Security**:
 *       - Rate limited (5 attempts/min/IP)
 *       - Generic error messages (no user enumeration)
 *       - HttpOnly cookie (XSS protection)
 *       - Secure flag in production
 *       - SameSite cookie (CSRF protection)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - corporateEmail
 *               - password
 *             properties:
 *               corporateEmail:
 *                 type: string
 *                 format: email
 *                 example: "jdoe@unisabana.edu.co"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: "YourPassword123!"
 *           examples:
 *             passenger:
 *               summary: Passenger login
 *               value:
 *                 corporateEmail: "passenger@unisabana.edu.co"
 *                 password: "SecurePass123!"
 *             driver:
 *               summary: Driver login
 *               value:
 *                 corporateEmail: "driver@unisabana.edu.co"
 *                 password: "SecurePass123!"
 *     responses:
 *       200:
 *         description: Login successful, session cookie set
 *         headers:
 *           Set-Cookie:
 *             description: JWT access token
 *             schema:
 *               type: string
 *               example: "access_token=eyJ...; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=7200"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "665e2a...f1"
 *                 role:
 *                   type: string
 *                   enum: [passenger, driver]
 *                   example: "driver"
 *                 firstName:
 *                   type: string
 *                   example: "John"
 *                 lastName:
 *                   type: string
 *                   example: "Doe"
 *             examples:
 *               success:
 *                 summary: Successful login
 *                 value:
 *                   id: "665e2a...f1"
 *                   role: "driver"
 *                   firstName: "John"
 *                   lastName: "Doe"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorValidation'
 *             example:
 *               code: "invalid_schema"
 *               message: "Validation failed"
 *               details:
 *                 - field: "corporateEmail"
 *                   issue: "corporateEmail must be a valid email address"
 *               correlationId: "123e4567-e89b-12d3-a456-426614174000"
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: "invalid_credentials"
 *                 message:
 *                   type: string
 *                   example: "Email or password is incorrect"
 *                 correlationId:
 *                   type: string
 *             example:
 *               code: "invalid_credentials"
 *               message: "Email or password is incorrect"
 *               correlationId: "123e4567-e89b-12d3-a456-426614174000"
 *       429:
 *         description: Too many login attempts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: "too_many_attempts"
 *                 message:
 *                   type: string
 *                   example: "Too many login attempts, try again later"
 *             example:
 *               code: "too_many_attempts"
 *               message: "Too many login attempts, try again later"
 */
router.post(
  '/login',
  loginRateLimiter,                  // Rate limit: 5/min/IP
  validateRequest(loginSchema),      // Validate email/password format
  authController.login.bind(authController)
);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User logout (session destruction)
 *     description: |
 *       Clears the httpOnly cookie to revoke the session.
 *       
 *       **Idempotent**: Can be called with or without authentication.
 *       
 *       **Cookie Removal**: Sets access_token cookie with Max-Age=0 and matching attributes.
 *     responses:
 *       200:
 *         description: Logout successful, cookie cleared
 *         headers:
 *           Set-Cookie:
 *             description: Clear access_token cookie
 *             schema:
 *               type: string
 *               example: "access_token=; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=0"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *             example:
 *               ok: true
 */
router.post(
  '/logout',
  authController.logout.bind(authController)
);

module.exports = router;

