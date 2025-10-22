const express = require('express');
const AuthController = require('../controllers/authController');
const validateRequest = require('../middlewares/validateRequest');
const { loginSchema, passwordResetRequestSchema } = require('../validation/authSchemas');
const { loginRateLimiter, passwordResetRateLimiter } = require('../middlewares/rateLimiter');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();
const authController = new AuthController();

/**
 * AUTH ROUTES
 * 
 * Endpoints:
 * - POST /auth/login - Create session (set JWT cookie)
 * - POST /auth/logout - Destroy session (clear cookie)
 * - GET /auth/me - Get current user session/identity (protected)
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

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get current user session/identity
 *     description: |
 *       Returns minimal user identity for session verification.
 *       
 *       **Protected**: Requires valid JWT cookie (set by /auth/login).
 *       
 *       **Security**:
 *       - No secrets or internal fields exposed
 *       - Cache-Control: no-store (never cache)
 *       - PII redaction in logs
 *       - Correlation ID for observability
 *       
 *       **Use case**: Client renders protected UI without re-login
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current user identity
 *         headers:
 *           Cache-Control:
 *             description: Prevent caching of sensitive data
 *             schema:
 *               type: string
 *               example: "no-store"
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
 *                 driver:
 *                   type: object
 *                   description: Only present for drivers
 *                   properties:
 *                     hasVehicle:
 *                       type: boolean
 *                       example: true
 *             examples:
 *               driver_with_vehicle:
 *                 summary: Driver with vehicle
 *                 value:
 *                   id: "665e2a...f1"
 *                   role: "driver"
 *                   firstName: "John"
 *                   lastName: "Doe"
 *                   driver:
 *                     hasVehicle: true
 *               driver_without_vehicle:
 *                 summary: Driver without vehicle
 *                 value:
 *                   id: "665e2a...f2"
 *                   role: "driver"
 *                   firstName: "Jane"
 *                   lastName: "Smith"
 *                   driver:
 *                     hasVehicle: false
 *               passenger:
 *                 summary: Passenger
 *                 value:
 *                   id: "665e2a...f3"
 *                   role: "passenger"
 *                   firstName: "Alice"
 *                   lastName: "Johnson"
 *       401:
 *         description: Missing or invalid session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: "unauthorized"
 *                 message:
 *                   type: string
 *                   example: "Missing or invalid session"
 *                 correlationId:
 *                   type: string
 *             example:
 *               code: "unauthorized"
 *               message: "Missing or invalid session"
 *               correlationId: "123e4567-e89b-12d3-a456-426614174000"
 */
router.get(
  '/me',
  authenticate,
  authController.getMe.bind(authController)
);

/**
 * @openapi
 * /auth/password/reset-request:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Request password reset
 *     description: |
 *       Initiates a password reset process for a user (out-of-session).
 *       
 *       **Security**:
 *       - Generic 200 response (never reveals if email exists)
 *       - Rate limited (3 requests per 15 min per IP)
 *       - PII redaction in logs (email never logged)
 *       - Cryptographically secure token (32 bytes random)
 *       - Token expires in 15 minutes
 *       - One-time use token (consumed after reset)
 *       
 *       **Flow**:
 *       1. User provides email
 *       2. If account exists: token generated and sent via email
 *       3. If account doesn't exist: generic success (no enumeration)
 *       4. User receives email with reset link (MVP: check server logs)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - corporateEmail
 *             properties:
 *               corporateEmail:
 *                 type: string
 *                 format: email
 *                 example: "jdoe@unisabana.edu.co"
 *           examples:
 *             request:
 *               summary: Password reset request
 *               value:
 *                 corporateEmail: "jdoe@unisabana.edu.co"
 *     responses:
 *       200:
 *         description: |
 *           Generic success response (always returned).
 *           
 *           Note: Response is intentionally generic to prevent user enumeration.
 *           If the email exists, a reset token is generated and sent.
 *           If the email doesn't exist, the same response is returned.
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
 *       400:
 *         description: Validation error (invalid email format)
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
 *       429:
 *         description: Rate limit exceeded
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
 *                   example: "Please try again later"
 *             example:
 *               code: "too_many_attempts"
 *               message: "Please try again later"
 */
router.post(
  '/password/reset-request',
  passwordResetRateLimiter,
  validateRequest(passwordResetRequestSchema),
  authController.requestPasswordReset.bind(authController)
);

module.exports = router;

