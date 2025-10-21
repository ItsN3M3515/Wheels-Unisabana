import { authService, AuthService } from '../src/services/authService';

describe('AuthService', () => {
  describe('Password operations', () => {
    it('should hash and verify passwords correctly', async () => {
      const plaintext = 'SecurePass123!';
      const hash = await authService.hashPassword(plaintext);
      
      expect(hash).toBeTruthy();
      expect(hash).not.toBe(plaintext);
      
      const valid = await authService.verifyPassword(plaintext, hash);
      expect(valid).toBe(true);
      
      const invalid = await authService.verifyPassword('WrongPassword', hash);
      expect(invalid).toBe(false);
    });

    it('should return false for invalid hash format', async () => {
      const result = await authService.verifyPassword('test', 'not-a-valid-hash');
      expect(result).toBe(false);
    });
  });

  describe('JWT operations', () => {
    const testPayload = {
      sub: 'user123',
      role: 'passenger' as const,
      email: 'test@uni.edu',
    };

    it('should sign and verify access tokens', () => {
      const token = authService.signAccessToken(testPayload);
      
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      
      const decoded = authService.verifyAccessToken(token);
      expect(decoded.sub).toBe(testPayload.sub);
      expect(decoded.role).toBe(testPayload.role);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('should throw on invalid token', () => {
      expect(() => {
        authService.verifyAccessToken('invalid-token');
      }).toThrow();
    });

    it('should throw on expired token', () => {
      const customService = new AuthService({ expiresIn: '1ms' });
      const token = customService.signAccessToken(testPayload);
      
      // Wait for expiry
      return new Promise(resolve => setTimeout(resolve, 10)).then(() => {
        expect(() => {
          customService.verifyAccessToken(token);
        }).toThrow();
      });
    });

    it('should decode token without verification', () => {
      const token = authService.signAccessToken(testPayload);
      const decoded = authService.decodeToken(token);
      
      expect(decoded).toBeTruthy();
      expect(decoded?.sub).toBe(testPayload.sub);
    });
  });

  describe('Configuration', () => {
    it('should use default config from env', () => {
      const config = authService.getConfig();
      expect(config.secret).toBeDefined();
      expect(config.expiresIn).toBeDefined();
      expect(config.issuer).toBeDefined();
    });

    it('should allow custom config', () => {
      const customService = new AuthService({
        secret: 'custom-secret',
        expiresIn: '1h',
        issuer: 'test-issuer',
      });
      
      const config = customService.getConfig();
      expect(config.secret).toBe('custom-secret');
      expect(config.expiresIn).toBe('1h');
      expect(config.issuer).toBe('test-issuer');
    });

    it('should throw if JWT_SECRET is missing', () => {
      const oldSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      
      expect(() => {
        new AuthService();
      }).toThrow('JWT_SECRET is required');
      
      process.env.JWT_SECRET = oldSecret;
    });
  });
});
