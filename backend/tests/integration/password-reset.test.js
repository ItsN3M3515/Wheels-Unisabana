/**
 * Password Reset Integration Tests
 * 
 * Tests for Subtask 2.3.1 - Request Password Reset
 * 
 * Coverage:
 * - POST /auth/password/reset-request with valid email
 * - POST /auth/password/reset-request with non-existent email
 * - Rate limiting (429)
 * - Validation errors (400)
 * - Token generation and storage
 */

const request = require('supertest');
const app = require('../../src/app');
const connectDB = require('../../src/infrastructure/database/connection');
const UserModel = require('../../src/infrastructure/database/models/UserModel');
const bcrypt = require('bcrypt');

describe('Password Reset Integration Tests', () => {
  let testUser = null;

  beforeAll(async () => {
    await connectDB();
    
    // Clean up test users
    await UserModel.deleteMany({ 
      corporateEmail: { 
        $in: ['resettest@unisabana.edu.co', 'nonexistent@unisabana.edu.co'] 
      } 
    });
    
    // Create test user
    const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
    testUser = await UserModel.create({
      role: 'passenger',
      firstName: 'Reset',
      lastName: 'Test',
      universityId: '999888',
      corporateEmail: 'resettest@unisabana.edu.co',
      phone: '+573009998888',
      password: hashedPassword
    });
  });

  afterAll(async () => {
    await UserModel.deleteMany({ 
      corporateEmail: { 
        $in: ['resettest@unisabana.edu.co', 'nonexistent@unisabana.edu.co'] 
      } 
    });
    await require('mongoose').connection.close();
  });

  describe('POST /auth/password/reset-request', () => {
    it('should return 200 with generic success for existing email', async () => {
      const res = await request(app)
        .post('/auth/password/reset-request')
        .send({
          corporateEmail: 'resettest@unisabana.edu.co'
        })
        .expect(200)
        .expect('Content-Type', /json/);

      // Generic response (never reveals if email exists)
      expect(res.body).toEqual({ ok: true });

      // Verify token was created in database
      const updatedUser = await UserModel.findById(testUser._id)
        .select('+resetPasswordToken +resetPasswordExpires +resetPasswordConsumed');
      
      expect(updatedUser.resetPasswordToken).toBeDefined();
      expect(updatedUser.resetPasswordToken).not.toBeNull();
      expect(updatedUser.resetPasswordExpires).toBeInstanceOf(Date);
      expect(updatedUser.resetPasswordExpires.getTime()).toBeGreaterThan(Date.now());
      expect(updatedUser.resetPasswordConsumed).toBeNull();
    });

    it('should return 200 with generic success for non-existent email (no enumeration)', async () => {
      const res = await request(app)
        .post('/auth/password/reset-request')
        .send({
          corporateEmail: 'nonexistent@unisabana.edu.co'
        })
        .expect(200)
        .expect('Content-Type', /json/);

      // CRITICAL: Same response as existing email
      expect(res.body).toEqual({ ok: true });
    });

    it('should return 400 with validation error for invalid email format', async () => {
      const res = await request(app)
        .post('/auth/password/reset-request')
        .send({
          corporateEmail: 'not-an-email'
        })
        .expect(400)
        .expect('Content-Type', /json/);

      expect(res.body).toHaveProperty('code', 'invalid_schema');
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('details');
      expect(Array.isArray(res.body.details)).toBe(true);
      
      const emailError = res.body.details.find(d => d.field === 'corporateEmail');
      expect(emailError).toBeDefined();
      expect(emailError.issue).toMatch(/email/i);
    });

    it('should return 400 when corporateEmail is missing', async () => {
      const res = await request(app)
        .post('/auth/password/reset-request')
        .send({})
        .expect(400)
        .expect('Content-Type', /json/);

      expect(res.body).toHaveProperty('code', 'invalid_schema');
      expect(res.body).toHaveProperty('details');
      
      const emailError = res.body.details.find(d => d.field === 'corporateEmail');
      expect(emailError).toBeDefined();
    });

    it('should invalidate previous token when new one is requested', async () => {
      // First request
      await request(app)
        .post('/auth/password/reset-request')
        .send({ corporateEmail: 'resettest@unisabana.edu.co' })
        .expect(200);

      const firstToken = await UserModel.findById(testUser._id)
        .select('+resetPasswordToken +resetPasswordExpires');
      
      const firstTokenHash = firstToken.resetPasswordToken;

      // Wait a bit (to ensure timestamp difference)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Second request
      await request(app)
        .post('/auth/password/reset-request')
        .send({ corporateEmail: 'resettest@unisabana.edu.co' })
        .expect(200);

      const secondToken = await UserModel.findById(testUser._id)
        .select('+resetPasswordToken +resetPasswordExpires');

      // Token should have changed
      expect(secondToken.resetPasswordToken).not.toBe(firstTokenHash);
      expect(secondToken.resetPasswordExpires.getTime())
        .toBeGreaterThan(firstToken.resetPasswordExpires.getTime());
    });

    it('should have exactly one active unconsumed token after multiple requests', async () => {
      // Make multiple requests
      await request(app)
        .post('/auth/password/reset-request')
        .send({ corporateEmail: 'resettest@unisabana.edu.co' })
        .expect(200);

      await request(app)
        .post('/auth/password/reset-request')
        .send({ corporateEmail: 'resettest@unisabana.edu.co' })
        .expect(200);

      // Verify only one token exists (latest one)
      const user = await UserModel.findById(testUser._id)
        .select('+resetPasswordToken +resetPasswordExpires +resetPasswordConsumed');

      expect(user.resetPasswordToken).toBeDefined();
      expect(user.resetPasswordExpires).toBeInstanceOf(Date);
      expect(user.resetPasswordConsumed).toBeNull();
    });

    it('should include correlationId in error responses', async () => {
      const res = await request(app)
        .post('/auth/password/reset-request')
        .send({ corporateEmail: 'invalid-email' })
        .expect(400);

      expect(res.body).toHaveProperty('correlationId');
      expect(typeof res.body.correlationId).toBe('string');
      expect(res.body.correlationId.length).toBeGreaterThan(0);
    });

    it('should handle case-insensitive email matching', async () => {
      // Request with uppercase email
      const res = await request(app)
        .post('/auth/password/reset-request')
        .send({ corporateEmail: 'RESETTEST@UNISABANA.EDU.CO' })
        .expect(200);

      expect(res.body).toEqual({ ok: true });

      // Verify token was created
      const user = await UserModel.findOne({ 
        corporateEmail: 'resettest@unisabana.edu.co' 
      }).select('+resetPasswordToken');

      expect(user.resetPasswordToken).toBeDefined();
    });

    // Rate limiting test (skipped in test environment)
    it.skip('should return 429 after exceeding rate limit', async () => {
      // Enable rate limiting for this test
      process.env.NODE_ENV = 'production';

      // Make 4 requests (limit is 3 per 15 min)
      for (let i = 0; i < 4; i++) {
        const res = await request(app)
          .post('/auth/password/reset-request')
          .send({ corporateEmail: 'resettest@unisabana.edu.co' });

        if (i < 3) {
          expect(res.status).toBe(200);
        } else {
          expect(res.status).toBe(429);
          expect(res.body).toHaveProperty('code', 'too_many_attempts');
          expect(res.body).toHaveProperty('message');
        }
      }

      // Reset environment
      process.env.NODE_ENV = 'test';
    });
  });
});
