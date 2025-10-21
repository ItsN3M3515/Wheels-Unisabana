import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

declare global {
  // augment Express Request with user
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.access_token as string | undefined;
  if (!token) {
    return res.status(401).json({ code: 'unauthorized', message: 'Missing or invalid session' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Misconfiguration - treat as unauthorized to avoid leaking details
    return res.status(401).json({ code: 'unauthorized', message: 'Missing or invalid session' });
  }

  try {
    const payload = jwt.verify(token, secret) as JwtPayload;
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ code: 'unauthorized', message: 'Missing or invalid session' });
  }
}
