import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Generate a cryptographically secure random CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Set CSRF token cookie (non-httpOnly so client can read it)
 * Token is rotated on login and periodically
 */
export function setCsrfCookie(res: Response, token?: string) {
  const isProd = process.env.NODE_ENV === 'production';
  const csrfToken = token || generateCsrfToken();
  
  res.cookie('csrf_token', csrfToken, {
    httpOnly: false, // Client needs to read this
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: 60 * 60 * 1000, // 1 hour (rotate periodically)
  });
  
  return csrfToken;
}

/**
 * requireCsrf - Double-submit CSRF protection middleware
 * 
 * Validates CSRF token for state-changing operations (POST/PATCH/DELETE).
 * Compares X-CSRF-Token header against csrf_token cookie.
 * 
 * Security:
 * - Double-submit pattern: cookie + header must match
 * - Protects against CSRF attacks on same-origin requests
 * - Token rotated on login and periodically
 * - Can be disabled in pure SameSite=Strict environments
 * 
 * Usage:
 *   router.post('/drivers/vehicle', requireAuth, requireCsrf, handler);
 *   router.patch('/users/me', requireAuth, requireCsrf, handler);
 * 
 * Client must:
 * 1. Read csrf_token cookie (non-httpOnly)
 * 2. Send value in X-CSRF-Token header
 * 
 * @returns Express middleware
 */
export function requireCsrf(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF check for safe methods (GET, HEAD, OPTIONS)
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Check if CSRF protection is disabled (for SameSite=Strict environments)
  if (process.env.DISABLE_CSRF === 'true') {
    return next();
  }

  // Get CSRF token from cookie
  const cookieToken = req.cookies?.csrf_token;
  
  // Get CSRF token from header
  const headerToken = req.headers['x-csrf-token'] as string | undefined;

  // Both must exist and match
  if (!cookieToken || !headerToken) {
    return res.status(403).json({
      code: 'csrf_mismatch',
      message: 'CSRF token missing or invalid',
    });
  }

  // Constant-time comparison to prevent timing attacks
  if (!crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) {
    return res.status(403).json({
      code: 'csrf_mismatch',
      message: 'CSRF token missing or invalid',
    });
  }

  return next();
}

/**
 * Rotate CSRF token (should be called periodically or on sensitive operations)
 */
export function rotateCsrfToken(res: Response): string {
  return setCsrfCookie(res);
}
