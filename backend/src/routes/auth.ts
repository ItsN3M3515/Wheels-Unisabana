import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { User, UserDoc } from '../models/User';
import { authService } from '../services/authService';
import { setSessionCookie, clearSessionCookie } from '../middleware/cookies';
import { setCsrfCookie } from '../middleware/csrf';

const router = Router();

// Rate limiters - soft limits to prevent abuse
const ipRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      code: 'too_many_attempts',
      message: 'Too many login attempts, try again later',
    });
  },
  // Don't log PII
  skip: () => false,
});

// Email-based rate limiter (stored in memory)
const emailAttempts = new Map<string, { count: number; resetAt: number }>();

function checkEmailRateLimit(email: string): boolean {
  const now = Date.now();
  const record = emailAttempts.get(email);

  if (!record || now > record.resetAt) {
    emailAttempts.set(email, { count: 1, resetAt: now + 60 * 1000 });
    return true;
  }

  if (record.count >= 5) {
    return false;
  }

  record.count++;
  return true;
}

// Validation helper
interface LoginRequest {
  corporateEmail: string;
  password: string;
}

function validateLoginInput(body: any): { valid: boolean; errors?: any[]; data?: LoginRequest } {
  const errors: any[] = [];

  if (!body.corporateEmail || typeof body.corporateEmail !== 'string') {
    errors.push({ field: 'corporateEmail', issue: 'required' });
  } else {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.corporateEmail)) {
      errors.push({ field: 'corporateEmail', issue: 'invalid email' });
    }
  }

  if (!body.password || typeof body.password !== 'string') {
    errors.push({ field: 'password', issue: 'required' });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      corporateEmail: body.corporateEmail.toLowerCase().trim(),
      password: body.password,
    },
  };
}

/**
 * POST /auth/login
 * 
 * Public endpoint that validates credentials and sets httpOnly JWT cookie.
 * - Rate limited: 5/min per IP and 5/min per email
 * - Zero PII in logs
 * - Generic error for invalid credentials (security best practice)
 */
router.post('/login', ipRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate input
    const validation = validateLoginInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        code: 'invalid_schema',
        message: 'Validation failed',
        details: validation.errors,
      });
    }

    const { corporateEmail, password } = validation.data!;

    // Check email-based rate limit
    if (!checkEmailRateLimit(corporateEmail)) {
      return res.status(429).json({
        code: 'too_many_attempts',
        message: 'Too many login attempts, try again later',
      });
    }

    // Fetch user by corporateEmail
    const user = await User.findOne({ corporateEmail }).lean() as UserDoc | null;

    // If user not found or no password hash, return generic error
    if (!user || !user.passwordHash) {
      // Don't log which case failed (PII protection)
      return res.status(401).json({
        code: 'invalid_credentials',
        message: 'Email or password is incorrect',
      });
    }

    // Extract user ID safely
    const userId = String((user as any)._id);

    // Verify password using auth service
    const isValid = await authService.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      // Don't log the email or that user exists (PII protection)
      return res.status(401).json({
        code: 'invalid_credentials',
        message: 'Email or password is incorrect',
      });
    }

    // Generate JWT with user claims
    const token = authService.signAccessToken({
      sub: userId,
      role: user.role,
      email: user.corporateEmail,
    });

    // Set httpOnly cookie for JWT
    setSessionCookie(res, token);

    // Set CSRF token cookie (non-httpOnly, rotated on login)
    setCsrfCookie(res);

    // Return minimal user profile (option A)
    return res.status(200).json({
      id: userId,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/logout
 * 
 * Clears the session cookie and CSRF token for stateless JWT logout.
 * No server-side state needed, but design allows future denylist.
 * 
 * Returns: { ok: true }
 */
router.post('/logout', (req: Request, res: Response) => {
  // Clear the access_token cookie with Max-Age=0
  clearSessionCookie(res);
  
  // Clear the CSRF token cookie using Max-Age=0 for consistency
  res.cookie('csrf_token', '', {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 0,
  });
  
  // Return success response
  return res.status(200).json({ ok: true });
});

export default router;
