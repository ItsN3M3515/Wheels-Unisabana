import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { UserRole } from '../types';

// Load environment variables before instantiating singleton
dotenv.config();

export interface JwtConfig {
  secret: string;
  expiresIn: string; // e.g., '2h', '7d'
  issuer?: string;
}

export interface AccessTokenPayload {
  sub: string; // user id
  role: UserRole;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Auth Service - Domain logic for password verification and JWT operations.
 * No HTTP concerns; used by controllers and middleware.
 * Key rotation ready via config.
 */
export class AuthService {
  private config: JwtConfig;

  constructor(config?: Partial<JwtConfig>) {
    const secret = config?.secret || process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is required for AuthService');
    }

    this.config = {
      secret,
      expiresIn: config?.expiresIn || process.env.JWT_EXPIRES_IN || '2h',
      issuer: config?.issuer || process.env.JWT_ISSUER || 'wheels-unisabana',
    };
  }

  /**
   * Verify plaintext password against stored hash.
   * Never logs inputs to avoid leaking credentials.
   */
  async verifyPassword(plaintext: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plaintext, hash);
    } catch {
      // bcrypt errors (invalid hash format, etc.) return false
      return false;
    }
  }

  /**
   * Hash a plaintext password for storage.
   * Use BCRYPT_ROUNDS from env (default 10).
   */
  async hashPassword(plaintext: string): Promise<string> {
    const rounds = Number(process.env.BCRYPT_ROUNDS || 10);
    return bcrypt.hash(plaintext, rounds);
  }

  /**
   * Sign an access token with standard claims.
   * Returns JWT string.
   */
  signAccessToken(payload: Omit<AccessTokenPayload, 'iat' | 'exp'>): string {
    return jwt.sign(
      {
        sub: payload.sub,
        role: payload.role,
        email: payload.email,
      },
      this.config.secret,
      {
        expiresIn: this.config.expiresIn,
        issuer: this.config.issuer,
      } as jwt.SignOptions
    );
  }

  /**
   * Verify and decode an access token.
   * Throws on invalid/expired tokens.
   */
  verifyAccessToken(token: string): AccessTokenPayload {
    const decoded = jwt.verify(token, this.config.secret, {
      issuer: this.config.issuer,
    }) as AccessTokenPayload;

    // Ensure required claims exist
    if (!decoded.sub || !decoded.role) {
      throw new Error('Invalid token payload');
    }

    return decoded;
  }

  /**
   * Decode token without verification (for inspection only).
   * Use verifyAccessToken for auth flows.
   */
  decodeToken(token: string): AccessTokenPayload | null {
    try {
      return jwt.decode(token) as AccessTokenPayload;
    } catch {
      return null;
    }
  }

  /**
   * Get current config (for testing/debugging).
   */
  getConfig(): Readonly<JwtConfig> {
    return { ...this.config };
  }
}

// Singleton instance for app-wide use
export const authService = new AuthService();
