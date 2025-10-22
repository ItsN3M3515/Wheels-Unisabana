/**
 * Auth Domain Service
 * 
 * Centralized authentication logic:
 * - Password verification (bcrypt)
 * - JWT signing and verification
 * - Token generation with standard claims
 * 
 * Security:
 * - Never logs credentials or password hashes
 * - Generic error messages (no user enumeration)
 * - Key rotation-ready configuration
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class AuthService {
  constructor() {
    // JWT configuration from environment
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '2h';
    this.jwtIssuer = process.env.JWT_ISSUER || 'wheels-unisabana';
    this.jwtAudience = process.env.JWT_AUDIENCE || 'wheels-unisabana-api';
  }

  /**
   * Verify plaintext password against stored hash
   * 
   * @param {string} plainPassword - User-provided password
   * @param {string} passwordHash - Stored bcrypt hash
   * @returns {Promise<boolean>} - true if valid, false otherwise
   * 
   * Security: Never logs inputs or hashes
   */
  async verifyPassword(plainPassword, passwordHash) {
    try {
      // bcrypt.compare is timing-attack safe
      const isValid = await bcrypt.compare(plainPassword, passwordHash);
      return isValid;
    } catch (error) {
      // Log error without exposing credentials
      console.error('[AuthService] Password verification failed (internal error)');
      return false;
    }
  }

  /**
   * Sign access token (JWT) with standard claims
   * 
   * @param {Object} payload - Token payload
   * @param {string} payload.sub - Subject (user ID)
   * @param {string} payload.role - User role ('passenger' | 'driver')
   * @param {string} payload.email - User email (for audit/logging)
   * @returns {string} - Signed JWT
   * 
   * Standard JWT claims:
   * - sub: Subject (user ID)
   * - role: Custom claim for RBAC
   * - email: Custom claim for audit
   * - iat: Issued at (auto-added by jwt.sign)
   * - exp: Expiration time (auto-added by jwt.sign)
   * - iss: Issuer
   * - aud: Audience
   */
  signAccessToken(payload) {
    try {
      const token = jwt.sign(
        {
          sub: payload.sub,
          role: payload.role,
          email: payload.email
        },
        this.jwtSecret,
        {
          expiresIn: this.jwtExpiresIn,
          issuer: this.jwtIssuer,
          audience: this.jwtAudience
        }
      );
      return token;
    } catch (error) {
      console.error('[AuthService] Token signing failed:', error.message);
      throw new Error('Failed to sign token');
    }
  }

  /**
   * Verify access token (JWT)
   * 
   * @param {string} token - JWT to verify
   * @returns {Object} - Decoded payload { sub, role, email, iat, exp, iss, aud }
   * @throws {Error} - If token is invalid or expired
   * 
   * Error types:
   * - TokenExpiredError: Token has expired
   * - JsonWebTokenError: Token is malformed or signature invalid
   * - NotBeforeError: Token used before nbf claim
   */
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: this.jwtIssuer,
        audience: this.jwtAudience
      });
      return decoded;
    } catch (error) {
      // Re-throw with original error type for middleware to handle
      throw error;
    }
  }

  /**
   * Authenticate user by email and password
   * 
   * @param {Object} userRepository - Repository to find user
   * @param {string} corporateEmail - User's corporate email
   * @param {string} password - User's plaintext password
   * @returns {Promise<Object>} - { user, token } if successful
   * @throws {Error} - Generic error on failure (no user enumeration)
   * 
   * Security:
   * - Generic error message for both "user not found" and "invalid password"
   * - No credentials logged
   * - Timing-attack resistant (bcrypt.compare)
   */
  async authenticateUser(userRepository, corporateEmail, password) {
    try {
      // Find user by email (case-insensitive)
      const user = await userRepository.findByEmail(corporateEmail.toLowerCase());

      // Generic error - don't reveal if user exists
      if (!user) {
        const error = new Error('Invalid email or password');
        error.code = 'invalid_credentials';
        throw error;
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(password, user.password);

      if (!isValidPassword) {
        const error = new Error('Invalid email or password');
        error.code = 'invalid_credentials';
        throw error;
      }

      // Generate access token
      const token = this.signAccessToken({
        sub: user.id,
        role: user.role,
        email: user.corporateEmail
      });

      return {
        user,
        token
      };
    } catch (error) {
      // Re-throw if it's our custom error
      if (error.code === 'invalid_credentials') {
        throw error;
      }

      // Log internal errors without exposing details to client
      console.error('[AuthService] Authentication failed (internal error)');
      
      // Generic error for client
      const genericError = new Error('Authentication failed');
      genericError.code = 'authentication_error';
      throw genericError;
    }
  }

  /**
   * Get JWT configuration (for testing/debugging)
   * 
   * @returns {Object} - { expiresIn, issuer, audience }
   */
  getConfig() {
    return {
      expiresIn: this.jwtExpiresIn,
      issuer: this.jwtIssuer,
      audience: this.jwtAudience
    };
  }
}

module.exports = AuthService;

