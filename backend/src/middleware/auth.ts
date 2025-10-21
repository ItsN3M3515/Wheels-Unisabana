import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import type { AccessTokenPayload } from '../services/authService';
import { UserRole } from '../types';

declare global {
  // augment Express Request with user
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

/**
 * requireAuth - JWT authentication middleware
 * 
 * Extracts access_token from httpOnly cookie and verifies via auth service.
 * On success: attaches req.user = { sub, role, email, iat, exp }
 * On failure: returns 401 unauthorized
 * 
 * Usage:
 *   router.get('/users/me', requireAuth, handler);
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.access_token as string | undefined;
  if (!token) {
    return res.status(401).json({ code: 'unauthorized', message: 'Missing or invalid session' });
  }

  try {
    const payload = authService.verifyAccessToken(token);
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ code: 'unauthorized', message: 'Missing or invalid session' });
  }
}

/**
 * requireRole - Role-based access control (RBAC) middleware
 * 
 * Requires authentication + specific role(s).
 * Must be used after requireAuth or combined with it.
 * 
 * Usage:
 *   router.post('/drivers/vehicle', requireAuth, requireRole('driver'), handler);
 *   router.get('/admin/users', requireAuth, requireRole('admin'), handler);
 *   router.patch('/drivers/vehicle', requireAuth, requireRole('driver', 'admin'), handler);
 * 
 * @param roles - One or more allowed roles
 * @returns Express middleware
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Ensure user is authenticated first
    if (!req.user) {
      return res.status(401).json({ 
        code: 'unauthorized', 
        message: 'Missing or invalid session' 
      });
    }

    // Check if user's role is in the allowed list
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        code: 'forbidden', 
        message: `Access denied. Required role: ${roles.join(' or ')}` 
      });
    }

    return next();
  };
}

/**
 * Convenience helper - combines requireAuth + requireRole
 * 
 * Usage:
 *   router.post('/drivers/vehicle', authWithRole('driver'), handler);
 * 
 * @param roles - One or more allowed roles
 * @returns Array of middlewares [requireAuth, requireRole(...roles)]
 */
export function authWithRole(...roles: UserRole[]) {
  return [requireAuth, requireRole(...roles)];
}
