import { Response } from 'express';

export function setSessionCookie(res: Response, token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  
  // Parse JWT expiry from env (default 2h = 7200 seconds)
  const expiresIn = process.env.JWT_EXPIRES_IN || '2h';
  const seconds = expiresIn.endsWith('h') 
    ? parseInt(expiresIn) * 3600 
    : expiresIn.endsWith('d')
    ? parseInt(expiresIn) * 86400
    : parseInt(expiresIn);
  
  res.cookie('access_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: seconds * 1000, // Convert to milliseconds
  });
}

/**
 * clearSessionCookie - Clears the access_token cookie
 * 
 * Sets Max-Age=0 with matching attributes to ensure proper deletion.
 * Works for stateless JWT logout (client-side removal).
 * Design allows future denylist implementation if needed.
 */
export function clearSessionCookie(res: Response) {
  const isProd = process.env.NODE_ENV === 'production';
  
  res.cookie('access_token', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: 0, // Immediately expire the cookie
  });
}
