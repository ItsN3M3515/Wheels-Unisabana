import request from 'supertest';
import { app } from '../src/server';
import { User } from '../src/models/User';
import { authService } from '../src/services/authService';

const HAS_DB = Boolean(process.env.MONGODB_URI);

(HAS_DB ? describe : describe.skip)('POST /auth/login', () => {
  const testUser = {
    corporateEmail: 'test.login@uni.edu',
    password: 'SecurePass123!',
    firstName: 'Test',
    lastName: 'User',
    universityId: 'TU123456',
    role: 'passenger' as const,
    phone: '+573001234567',
  };

  beforeAll(async () => {
    // Create test user with hashed password
    const passwordHash = await authService.hashPassword(testUser.password);
    
    // Delete if exists
    await User.deleteOne({ corporateEmail: testUser.corporateEmail }).catch(() => {});
    
    // Create fresh user
    await User.create({
      ...testUser,
      passwordHash,
    }).catch(() => {
      // If MongoDB is not connected, skip setup
      console.log('Skipping user creation - MongoDB not connected');
    });
  }, 30000); // Increase timeout for bcrypt hashing and potential DB latency

  afterAll(async () => {
    // Clean up test user
    await User.deleteOne({ corporateEmail: testUser.corporateEmail }).catch(() => {});
  }, 15000);

  describe('Validation', () => {
    it('should return 400 for missing corporateEmail', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ password: 'test' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('invalid_schema');
      expect(res.body.details).toEqual([{ field: 'corporateEmail', issue: 'required' }]);
    });

    it('should return 400 for invalid email format', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ corporateEmail: 'not-an-email', password: 'test' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('invalid_schema');
      expect(res.body.details).toEqual([{ field: 'corporateEmail', issue: 'invalid email' }]);
    });

    it('should return 400 for missing password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ corporateEmail: 'test@uni.edu' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('invalid_schema');
      expect(res.body.details).toEqual([{ field: 'password', issue: 'required' }]);
    });
  });

  describe('Authentication', () => {
    it('should return 401 for non-existent user with generic error', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ corporateEmail: 'nonexistent@uni.edu', password: 'test' });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        code: 'invalid_credentials',
        message: 'Email or password is incorrect',
      });
    });

    it('should return 401 for wrong password with generic error', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ corporateEmail: testUser.corporateEmail, password: 'WrongPassword' });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        code: 'invalid_credentials',
        message: 'Email or password is incorrect',
      });
    });

    it('should return 200 and set httpOnly cookie for valid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ corporateEmail: testUser.corporateEmail, password: testUser.password });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: expect.any(String),
        role: testUser.role,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
      });

      // Verify cookie is set
      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      
      const accessTokenCookie = cookies.find((c: string) => c.startsWith('access_token='));
      expect(accessTokenCookie).toBeDefined();
      expect(accessTokenCookie).toContain('HttpOnly');
      expect(accessTokenCookie).toContain('Path=/');
    });

      // OpenAPI spec validation tests (requires jest-openapi matchers)
      // it('should validate OpenAPI contract for 200 response', async () => {
      //   const res = await request(app)
      //     .post('/auth/login')
      //     .send({ corporateEmail: testUser.corporateEmail, password: testUser.password });
      //
      //   expect(res).toSatisfyApiSpec();
      // });
      //
      // it('should validate OpenAPI contract for 401 response', async () => {
      //   const res = await request(app)
      //     .post('/auth/login')
      //     .send({ corporateEmail: 'wrong@uni.edu', password: 'wrong' });
      //
      //   expect(res).toSatisfyApiSpec();
      // });
      //
      // it('should validate OpenAPI contract for 400 response', async () => {
      //   const res = await request(app)
      //     .post('/auth/login')
      //     .send({ corporateEmail: 'not-an-email', password: 'test' });
      //
      //   expect(res).toSatisfyApiSpec();
      // });
  });

  describe('Rate Limiting', () => {
    it('should return 429 after 5 attempts from same IP', async () => {
      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/auth/login')
          .send({ corporateEmail: 'ratelimit@uni.edu', password: 'test' });
      }

      // 6th request should be rate limited
      const res = await request(app)
        .post('/auth/login')
        .send({ corporateEmail: 'ratelimit@uni.edu', password: 'test' });

      expect(res.status).toBe(429);
      expect(res.body).toEqual({
        code: 'too_many_attempts',
        message: 'Too many login attempts, try again later',
      });

      // Wait for rate limit to reset (1 minute)
      // In real tests, you might mock the timer or use a shorter window
    }, 10000);
  });
});
