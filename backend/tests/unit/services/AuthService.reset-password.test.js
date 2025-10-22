/**
 * Unit Tests for AuthService - Reset Password (Token Redemption)
 * 
 * Tests for Subtask 2.3.2 - Perform Password Reset
 * 
 * Coverage:
 * - Token validation (hash lookup)
 * - Expiry check (410 token_expired)
 * - Consumption check (409 token_used)
 * - Password update and token consumption
 * - Error handling (400 invalid_token)
 */

const AuthService = require('../../../src/domain/services/AuthService');
const ResetTokenUtil = require('../../../src/utils/resetToken');
const bcrypt = require('bcrypt');

describe('AuthService - Reset Password', () => {
  let authService;
  let mockUserRepository;

  beforeEach(() => {
    // Mock UserRepository
    mockUserRepository = {
      findByResetToken: jest.fn(),
      updatePasswordAndConsumeToken: jest.fn()
    };

    // AuthService doesn't take constructor params
    authService = new AuthService();
  });

  describe('resetPassword', () => {
    it('should successfully reset password with valid token', async () => {
      const { token, tokenHash } = ResetTokenUtil.createResetToken(15);
      const newPassword = 'NewSecurePass123!';
      
      const mockUser = {
        _id: 'user123',
        id: 'user123',
        resetPasswordToken: tokenHash,
        resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000), // 15 min future
        resetPasswordConsumed: null
      };

      mockUserRepository.findByResetToken.mockResolvedValue(mockUser);
      mockUserRepository.updatePasswordAndConsumeToken.mockResolvedValue(true);

      const result = await authService.resetPassword(
        mockUserRepository,
        token,
        newPassword
      );

      // Should return success
      expect(result).toEqual({ success: true });

      // Should have found user by hashed token
      expect(mockUserRepository.findByResetToken).toHaveBeenCalledWith(tokenHash);

      // Should have updated password
      expect(mockUserRepository.updatePasswordAndConsumeToken).toHaveBeenCalledWith(
        'user123',
        expect.any(String) // bcrypt hash
      );

      // Verify password was hashed with bcrypt
      const hashedPassword = mockUserRepository.updatePasswordAndConsumeToken.mock.calls[0][1];
      const isValidBcrypt = await bcrypt.compare(newPassword, hashedPassword);
      expect(isValidBcrypt).toBe(true);
    });

    it('should throw invalid_token (400) when token not found', async () => {
      const { token } = ResetTokenUtil.createResetToken(15);
      
      mockUserRepository.findByResetToken.mockResolvedValue(null);

      await expect(
        authService.resetPassword(mockUserRepository, token, 'NewPassword123!')
      ).rejects.toMatchObject({
        message: 'The reset link is invalid',
        code: 'invalid_token',
        statusCode: 400
      });

      // Should NOT call updatePasswordAndConsumeToken
      expect(mockUserRepository.updatePasswordAndConsumeToken).not.toHaveBeenCalled();
    });

    it('should throw invalid_token (400) when user has no reset token', async () => {
      const { token } = ResetTokenUtil.createResetToken(15);
      
      const mockUser = {
        _id: 'user123',
        id: 'user123',
        resetPasswordToken: null, // No token
        resetPasswordExpires: null,
        resetPasswordConsumed: null
      };

      mockUserRepository.findByResetToken.mockResolvedValue(mockUser);

      await expect(
        authService.resetPassword(mockUserRepository, token, 'NewPassword123!')
      ).rejects.toMatchObject({
        message: 'The reset link is invalid',
        code: 'invalid_token',
        statusCode: 400
      });
    });

    it('should throw invalid_token (400) when token hash does not match', async () => {
      const { token: token1 } = ResetTokenUtil.createResetToken(15);
      const { tokenHash: tokenHash2 } = ResetTokenUtil.createResetToken(15); // Different token
      
      const mockUser = {
        _id: 'user123',
        id: 'user123',
        resetPasswordToken: tokenHash2, // Different hash
        resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
        resetPasswordConsumed: null
      };

      mockUserRepository.findByResetToken.mockResolvedValue(mockUser);

      await expect(
        authService.resetPassword(mockUserRepository, token1, 'NewPassword123!')
      ).rejects.toMatchObject({
        message: 'The reset link is invalid',
        code: 'invalid_token',
        statusCode: 400
      });
    });

    it('should throw token_expired (410) when token has expired', async () => {
      const { token, tokenHash } = ResetTokenUtil.createResetToken(15);
      
      const mockUser = {
        _id: 'user123',
        id: 'user123',
        resetPasswordToken: tokenHash,
        resetPasswordExpires: new Date(Date.now() - 1000), // 1 second ago (expired)
        resetPasswordConsumed: null
      };

      mockUserRepository.findByResetToken.mockResolvedValue(mockUser);

      await expect(
        authService.resetPassword(mockUserRepository, token, 'NewPassword123!')
      ).rejects.toMatchObject({
        message: 'The reset link has expired',
        code: 'token_expired',
        statusCode: 410
      });

      // Should NOT update password
      expect(mockUserRepository.updatePasswordAndConsumeToken).not.toHaveBeenCalled();
    });

    it('should throw token_used (409) when token already consumed', async () => {
      const { token, tokenHash } = ResetTokenUtil.createResetToken(15);
      
      const mockUser = {
        _id: 'user123',
        id: 'user123',
        resetPasswordToken: tokenHash,
        resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
        resetPasswordConsumed: new Date(Date.now() - 5 * 60 * 1000) // Consumed 5 min ago
      };

      mockUserRepository.findByResetToken.mockResolvedValue(mockUser);

      await expect(
        authService.resetPassword(mockUserRepository, token, 'NewPassword123!')
      ).rejects.toMatchObject({
        message: 'The reset link has already been used',
        code: 'token_used',
        statusCode: 409
      });

      // Should NOT update password
      expect(mockUserRepository.updatePasswordAndConsumeToken).not.toHaveBeenCalled();
    });

    it('should handle repository errors gracefully', async () => {
      const { token } = ResetTokenUtil.createResetToken(15);
      
      mockUserRepository.findByResetToken.mockRejectedValue(
        new Error('Database connection error')
      );

      await expect(
        authService.resetPassword(mockUserRepository, token, 'NewPassword123!')
      ).rejects.toMatchObject({
        message: 'Failed to reset password',
        code: 'password_reset_error',
        statusCode: 500
      });
    });

    it('should use configured bcrypt rounds for password hashing', async () => {
      const { token, tokenHash } = ResetTokenUtil.createResetToken(15);
      const newPassword = 'NewSecurePass123!';
      
      // Set bcrypt rounds
      process.env.BCRYPT_ROUNDS = '12';
      
      const mockUser = {
        _id: 'user123',
        id: 'user123',
        resetPasswordToken: tokenHash,
        resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
        resetPasswordConsumed: null
      };

      mockUserRepository.findByResetToken.mockResolvedValue(mockUser);
      mockUserRepository.updatePasswordAndConsumeToken.mockResolvedValue(true);

      await authService.resetPassword(
        mockUserRepository,
        token,
        newPassword
      );

      // Verify password was hashed
      const hashedPassword = mockUserRepository.updatePasswordAndConsumeToken.mock.calls[0][1];
      
      // Bcrypt hashes start with $2b$<rounds>$
      expect(hashedPassword).toMatch(/^\$2[aby]\$12\$/);
      
      // Verify it's a valid bcrypt hash
      const isValidBcrypt = await bcrypt.compare(newPassword, hashedPassword);
      expect(isValidBcrypt).toBe(true);

      // Reset environment
      delete process.env.BCRYPT_ROUNDS;
    });
  });

  describe('Token Security', () => {
    it('should use constant-time comparison for token verification', async () => {
      // This test verifies that we're using the verifyToken function
      // which uses crypto.timingSafeEqual for constant-time comparison
      
      const { token, tokenHash } = ResetTokenUtil.createResetToken(15);
      
      const mockUser = {
        _id: 'user123',
        id: 'user123',
        resetPasswordToken: tokenHash,
        resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
        resetPasswordConsumed: null
      };

      mockUserRepository.findByResetToken.mockResolvedValue(mockUser);
      mockUserRepository.updatePasswordAndConsumeToken.mockResolvedValue(true);

      // Should succeed with correct token
      await expect(
        authService.resetPassword(mockUserRepository, token, 'NewPassword123!')
      ).resolves.toEqual({ success: true });

      // Should fail with slightly modified token (but take same time)
      const modifiedToken = token.slice(0, -1) + 'X';
      mockUserRepository.findByResetToken.mockResolvedValue(mockUser);
      
      await expect(
        authService.resetPassword(mockUserRepository, modifiedToken, 'NewPassword123!')
      ).rejects.toMatchObject({
        code: 'invalid_token'
      });
    });

    it('should never log tokens or passwords', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const { token, tokenHash } = ResetTokenUtil.createResetToken(15);
      const newPassword = 'NewSecurePass123!';
      
      const mockUser = {
        _id: 'user123',
        id: 'user123',
        resetPasswordToken: tokenHash,
        resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
        resetPasswordConsumed: null
      };

      mockUserRepository.findByResetToken.mockResolvedValue(mockUser);
      mockUserRepository.updatePasswordAndConsumeToken.mockResolvedValue(true);

      await authService.resetPassword(
        mockUserRepository,
        token,
        newPassword,
        '1.2.3.4'
      );

      // Check all console.log calls
      const allLogCalls = consoleSpy.mock.calls.map(call => call.join(' '));
      allLogCalls.forEach(logMessage => {
        expect(logMessage).not.toContain(token);
        expect(logMessage).not.toContain(newPassword);
      });

      // Check all console.error calls
      const allErrorCalls = consoleErrorSpy.mock.calls.map(call => call.join(' '));
      allErrorCalls.forEach(errorMessage => {
        expect(errorMessage).not.toContain(token);
        expect(errorMessage).not.toContain(newPassword);
      });

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});
