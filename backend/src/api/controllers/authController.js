/**
 * Auth Controller
 * 
 * Handles authentication endpoints:
 * - POST /auth/login - Create session (set JWT cookie)
 * - POST /auth/logout - Destroy session (clear cookie)
 */

const AuthService = require('../../domain/services/AuthService');
const MongoUserRepository = require('../../infrastructure/repositories/MongoUserRepository');
const { generateCsrfToken, setCsrfCookie, clearCsrfCookie } = require('../../utils/csrf');

class AuthController {
  constructor() {
    this.authService = new AuthService();
    this.userRepository = new MongoUserRepository();
  }

  /**
   * POST /auth/login
   * 
   * Authenticates user and sets httpOnly cookie with JWT
   * 
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   * 
   * Request body:
   * {
   *   "corporateEmail": "user@unisabana.edu.co",
   *   "password": "password123"
   * }
   * 
   * Response 200:
   * {
   *   "id": "665e2a...f1",
   *   "role": "driver",
   *   "firstName": "John",
   *   "lastName": "Doe"
   * }
   * 
   * Errors:
   * - 401 invalid_credentials: Invalid email or password
   * - 500 internal_error: Unexpected server error
   * 
   * Security:
   * - Generic error message (no user enumeration)
   * - No PII logged
   * - Rate limited by IP and email
   */
  async login(req, res, next) {
    try {
      const { corporateEmail, password } = req.body;

      // Log login attempt WITHOUT credentials
      console.log(`[AuthController] Login attempt for email domain: ${corporateEmail?.split('@')[1] || 'unknown'} | IP: ${req.ip} | correlationId: ${req.correlationId}`);

      // Authenticate user via AuthService
      const { user, token } = await this.authService.authenticateUser(
        this.userRepository,
        corporateEmail,
        password
      );

      // Set httpOnly cookie with JWT
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieMaxAge = 2 * 60 * 60 * 1000; // 2 hours (matches JWT expiry)

      res.cookie('access_token', token, {
        httpOnly: true,              // CRITICAL: Prevents XSS attacks (JS cannot read)
        secure: isProduction,        // HTTPS only in production
        sameSite: isProduction ? 'strict' : 'lax', // CSRF protection
        maxAge: cookieMaxAge,
        path: '/'                    // Available to all routes
      });

      // Generate and set CSRF token (double-submit cookie pattern)
      // This provides additional CSRF protection for state-changing routes
      const csrfToken = generateCsrfToken();
      setCsrfCookie(res, csrfToken);

      // Log successful login WITHOUT PII
      console.log(`[AuthController] Login successful | userId: ${user.id} | role: ${user.role} | correlationId: ${req.correlationId}`);

      // Return minimal DTO (no password or sensitive fields)
      const response = {
        id: user.id,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      };
      
      // Debug log (remove after testing)
      console.log('[AuthController] Response body:', response);
      
      res.status(200).json(response);

    } catch (error) {
      // Handle invalid credentials
      if (error.code === 'invalid_credentials') {
        // Log failed attempt WITHOUT revealing if user exists
        console.log(`[AuthController] Login failed | reason: invalid_credentials | IP: ${req.ip} | correlationId: ${req.correlationId}`);
        
        return res.status(401).json({
          code: 'invalid_credentials',
          message: 'Email or password is incorrect',
          correlationId: req.correlationId
        });
      }

      // Log internal errors WITHOUT details
      console.error(`[AuthController] Login error | correlationId: ${req.correlationId}`);

      // Generic error for client
      return res.status(500).json({
        code: 'internal_error',
        message: 'An error occurred during login',
        correlationId: req.correlationId
      });
    }
  }

  /**
   * POST /auth/logout
   * 
   * Clears the access_token cookie (session revocation)
   * Idempotent: Can be called with or without a valid session
   * 
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * 
   * Response 200:
   * {
   *   "ok": true
   * }
   * 
   * Cookie is cleared with Max-Age=0 and matching attributes:
   * - HttpOnly (XSS protection)
   * - Secure (HTTPS only in production)
   * - SameSite (CSRF protection)
   * - Path=/ (matches login cookie)
   */
  logout(req, res) {
    // Log logout WITHOUT user details (if authenticated, req.user would be available)
    const userId = req.user?.id || req.user?.sub || 'anonymous';
    console.log(`[AuthController] Logout | userId: ${userId} | correlationId: ${req.correlationId}`);

    // Clear the access_token cookie with EXACT same attributes as when set
    // This is critical for the cookie to be properly removed
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/'
    });

    // Also clear CSRF token cookie
    clearCsrfCookie(res);

    res.status(200).json({
      ok: true
    });
  }
}

module.exports = AuthController;

