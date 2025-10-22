/**
 * Unit Tests for AuthService - Password Reset
 * 
 * Tests for Subtask 2.3.1 - Request Password Reset
 * 
 * Coverage:
 * - Password reset request logic
 * - Token generation and hashing
 * - User not found handling
 * - Token invalidation
 */

const AuthService = require('../../../src/domain/services/AuthService');
const { hashToken } = require('../../../src/utils/resetToken');

describe('AuthService - Password Reset', () => {
  let authService;
  let mockUserRepository;

  beforeEach(() => {
    // Mock UserRepository
    mockUserRepository = {
      findByEmailWithResetFields: jest.fn(),
      updateResetToken: jest.fn()
    };

    // AuthService doesn't take constructor params
    authService = new AuthService();
  });

  describe('requestPasswordReset', () => {
    it('should generate token and update user when email exists', async () => {
      const testEmail = 'test@unisabana.edu.co';
      const mockUser = {
        _id: 'user123',
        id: 'user123',
        corporateEmail: testEmail,
        firstName: 'Test',
        lastName: 'User'
      };

      mockUserRepository.findByEmailWithResetFields.mockResolvedValue(mockUser);
      mockUserRepository.updateResetToken.mockResolvedValue(true);

      const result = await authService.requestPasswordReset(mockUserRepository, testEmail);

      // Should return success and token
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('token');
      expect(typeof result.token).toBe('string');
      expect(result.token.length).toBeGreaterThan(0);

      // Should have called repository methods
      expect(mockUserRepository.findByEmailWithResetFields).toHaveBeenCalledWith(testEmail);
      expect(mockUserRepository.updateResetToken).toHaveBeenCalledWith(
        'user123',
        expect.objectContaining({
          resetPasswordToken: expect.any(String),
          resetPasswordExpires: expect.any(Date),
          resetPasswordConsumed: null
        })
      );

      // Verify the hashed token is different from raw token
      const hashedToken = mockUserRepository.updateResetToken.mock.calls[0][1].resetPasswordToken;
      expect(hashedToken).not.toBe(result.token);
      
      // Verify it's a proper SHA-256 hash (64 hex characters)
      expect(hashedToken).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should return null when user does not exist', async () => {
      const testEmail = 'nonexistent@unisabana.edu.co';
      
      mockUserRepository.findByEmailWithResetFields.mockResolvedValue(null);

      const result = await authService.requestPasswordReset(mockUserRepository, testEmail);

      // Should return success without token (generic response)
      expect(result).toEqual({ success: true });

      // Should NOT call updateResetToken
      expect(mockUserRepository.updateResetToken).not.toHaveBeenCalled();
    });

    it('should generate unique tokens on consecutive calls', async () => {
      const testEmail = 'test@unisabana.edu.co';
      const mockUser = {
        _id: 'user123',
        id: 'user123',
        corporateEmail: testEmail
      };

      mockUserRepository.findByEmailWithResetFields.mockResolvedValue(mockUser);
      mockUserRepository.updateResetToken.mockResolvedValue(true);

      const result1 = await authService.requestPasswordReset(mockUserRepository, testEmail);
      const result2 = await authService.requestPasswordReset(mockUserRepository, testEmail);

      // Tokens should be different
      expect(result1.token).not.toBe(result2.token);

      // Hashed tokens should be different
      const hash1 = mockUserRepository.updateResetToken.mock.calls[0][1].resetPasswordToken;
      const hash2 = mockUserRepository.updateResetToken.mock.calls[1][1].resetPasswordToken;
      expect(hash1).not.toBe(hash2);
    });

    it('should set expiry time to 15 minutes from now', async () => {
      const testEmail = 'test@unisabana.edu.co';
      const mockUser = {
        _id: 'user123',
        id: 'user123',
        corporateEmail: testEmail
      };

      mockUserRepository.findByEmailWithResetFields.mockResolvedValue(mockUser);
      mockUserRepository.updateResetToken.mockResolvedValue(true);

      const beforeCall = Date.now();
      await authService.requestPasswordReset(mockUserRepository, testEmail);
      const afterCall = Date.now();

      // Get the expiry date passed to repository
      const expiryDate = mockUserRepository.updateResetToken.mock.calls[0][1].resetPasswordExpires;

      // Should be approximately 15 minutes (900000 ms) from now
      const expectedExpiry = beforeCall + 900000;
      const actualExpiry = expiryDate.getTime();

      // Allow 1 second tolerance
      expect(actualExpiry).toBeGreaterThanOrEqual(expectedExpiry - 1000);
      expect(actualExpiry).toBeLessThanOrEqual(afterCall + 900000 + 1000);
    });

    it('should handle repository errors gracefully', async () => {
      const testEmail = 'test@unisabana.edu.co';
      
      mockUserRepository.findByEmailWithResetFields.mockRejectedValue(
        new Error('Database connection error')
      );

      await expect(
        authService.requestPasswordReset(mockUserRepository, testEmail)
      ).rejects.toThrow('Failed to process password reset request');
    });

    it('should normalize email to lowercase before lookup', async () => {
      const testEmail = 'TEST@UNISABANA.EDU.CO';
      const mockUser = {
        _id: 'user123',
        id: 'user123',
        corporateEmail: 'test@unisabana.edu.co'
      };

      mockUserRepository.findByEmailWithResetFields.mockResolvedValue(mockUser);
      mockUserRepository.updateResetToken.mockResolvedValue(true);

      await authService.requestPasswordReset(mockUserRepository, testEmail);

      // Should have normalized email before calling repository
      expect(mockUserRepository.findByEmailWithResetFields).toHaveBeenCalledWith(
        'test@unisabana.edu.co'
      );
    });
  });

  describe('Token Security', () => {
    it('should generate cryptographically secure tokens', async () => {
      const testEmail = 'test@unisabana.edu.co';
      const mockUser = { _id: 'user123', id: 'user123', corporateEmail: testEmail };

      mockUserRepository.findByEmailWithResetFields.mockResolvedValue(mockUser);
      mockUserRepository.updateResetToken.mockResolvedValue(true);

      const result = await authService.requestPasswordReset(mockUserRepository, testEmail);

      // Token should be base64url encoded (URL-safe)
      expect(result.token).toMatch(/^[A-Za-z0-9_-]+$/);
      
      // Should have sufficient entropy (at least 32 bytes = 43 base64url chars)
      expect(result.token.length).toBeGreaterThanOrEqual(43);
    });

    it('should store hashed tokens, never plaintext', async () => {
      const testEmail = 'test@unisabana.edu.co';
      const mockUser = { _id: 'user123', id: 'user123', corporateEmail: testEmail };

      mockUserRepository.findByEmailWithResetFields.mockResolvedValue(mockUser);
      mockUserRepository.updateResetToken.mockResolvedValue(true);

      const result = await authService.requestPasswordReset(mockUserRepository, testEmail);
      const storedHash = mockUserRepository.updateResetToken.mock.calls[0][1].resetPasswordToken;

      // Stored hash should be SHA-256 (64 hex chars)
      expect(storedHash).toHaveLength(64);
      expect(storedHash).toMatch(/^[a-f0-9]{64}$/);

      // Verify the hash matches the token
      const expectedHash = hashToken(result.token);
      expect(storedHash).toBe(expectedHash);
    });
  });
});
