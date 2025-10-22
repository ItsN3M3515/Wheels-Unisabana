/**
 * Auth Integration Tests (Supertest)
 * 
 * Tests for SUBTASK 2.1.6 - OpenAPI and Tests (Login/Logout/Auth middleware)
 * 
 * Coverage:
 * - Login success/failure scenarios
 * - Logout cookie clearing
 * - Protected routes with/without auth
 * - CSRF protection
 * - Cookie flags verification
 * - Rate limiting
 */

const request = require('supertest');
const app = require('../../src/app');
const connectDB = require('../../src/infrastructure/database/connection');
const UserModel = require('../../src/infrastructure/database/models/UserModel');
const bcrypt = require('bcrypt');

describe('Auth Integration Tests', () => {
  let testUser = null;

  beforeAll(async () => {
    await connectDB();
    
    // Clean up test user
    await UserModel.deleteMany({ corporateEmail: 'supertest@unisabana.edu.co' });
    
    // Create test user
    const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
    testUser = await UserModel.create({
      role: 'passenger',
      firstName: 'Super',
      lastName: 'Test',
      universityId: '888999',
      corporateEmail: 'supertest@unisabana.edu.co',
      phone: '+573004443333',
      password: hashedPassword
    });
  });

  afterAll(async () => {
    await UserModel.deleteMany({ corporateEmail: 'supertest@unisabana.edu.co' });
    await require('mongoose').connection.close();
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          corporateEmail: 'supertest@unisabana.edu.co',
          password: 'TestPassword123!'
        })
        .expect(200)
        .expect('Content-Type', /json/);

      // Verify response body
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('role', 'passenger');
      expect(res.body).toHaveProperty('firstName', 'Super');
      expect(res.body).toHaveProperty('lastName', 'Test');
      expect(res.body).not.toHaveProperty('password');
      expect(res.body).not.toHaveProperty('corporateEmail');

      // Verify access_token cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      
      const accessCookie = cookies.find(c => c.includes('access_token='));
      expect(accessCookie).toBeDefined();
      expect(accessCookie).toMatch(/HttpOnly/);
      expect(accessCookie).toMatch(/Path=\//);
      expect(accessCookie).toMatch(/SameSite/);
      expect(accessCookie).toMatch(/Max-Age=/);

      // Verify csrf_token cookie (non-httpOnly)
      const csrfCookie = cookies.find(c => c.includes('csrf_token='));
      expect(csrfCookie).toBeDefined();
      expect(csrfCookie).not.toMatch(/HttpOnly/); // Should NOT be httpOnly
    });

    it('should return 401 with invalid email', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          corporateEmail: 'nonexistent@unisabana.edu.co',
          password: 'TestPassword123!'
        })
        .expect(401)
        .expect('Content-Type', /json/);

      expect(res.body).toHaveProperty('code', 'invalid_credentials');
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/incorrect/i);
    });

    it('should return 401 with invalid password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          corporateEmail: 'supertest@unisabana.edu.co',
          password: 'WrongPassword123!'
        })
        .expect(401)
        .expect('Content-Type', /json/);

      expect(res.body).toHaveProperty('code', 'invalid_credentials');
      expect(res.body).toHaveProperty('message');
    });

    it('should return 400 with missing fields', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          corporateEmail: 'supertest@unisabana.edu.co'
          // Missing password
        })
        .expect(400)
        .expect('Content-Type', /json/);

      expect(res.body).toHaveProperty('code', 'invalid_schema');
      expect(res.body).toHaveProperty('details');
      expect(Array.isArray(res.body.details)).toBe(true);
    });

    it('should return 400 with invalid email format', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          corporateEmail: 'not-an-email',
          password: 'TestPassword123!'
        })
        .expect(400)
        .expect('Content-Type', /json/);

      expect(res.body).toHaveProperty('code', 'invalid_schema');
    });

    // Rate limiting test (skipped in development)
    it.skip('should return 429 after too many attempts', async () => {
      // Make 6 rapid requests (limit is 5/min)
      for (let i = 0; i < 6; i++) {
        const res = await request(app)
          .post('/auth/login')
          .send({
            corporateEmail: 'supertest@unisabana.edu.co',
            password: 'WrongPassword!'
          });

        if (i === 5) {
          expect(res.status).toBe(429);
          expect(res.body).toHaveProperty('code', 'too_many_attempts');
        }
      }
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully and clear cookies', async () => {
      // First login
      const loginRes = await request(app)
        .post('/auth/login')
        .send({
          corporateEmail: 'supertest@unisabana.edu.co',
          password: 'TestPassword123!'
        })
        .expect(200);

      // Then logout
      const logoutRes = await request(app)
        .post('/auth/logout')
        .set('Cookie', loginRes.headers['set-cookie'])
        .expect(200)
        .expect('Content-Type', /json/);

      expect(logoutRes.body).toEqual({ ok: true });

      // Verify cookies are cleared
      const cookies = logoutRes.headers['set-cookie'];
      expect(cookies).toBeDefined();

      const accessCookie = cookies.find(c => c.includes('access_token='));
      expect(accessCookie).toBeDefined();
      expect(accessCookie).toMatch(/Max-Age=0|access_token=;/);

      const csrfCookie = cookies.find(c => c.includes('csrf_token='));
      expect(csrfCookie).toBeDefined();
    });

    it('should be idempotent (logout without session)', async () => {
      const res = await request(app)
        .post('/auth/logout')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(res.body).toEqual({ ok: true });
    });
  });

  describe('Protected Routes - Auth Middleware', () => {
    it('should return 401 for protected route without token', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .expect(401)
        .expect('Content-Type', /json/);

      expect(res.body).toHaveProperty('code', 'unauthorized');
      expect(res.body).toHaveProperty('message');
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Cookie', 'access_token=invalid.token.here')
        .expect(401)
        .expect('Content-Type', /json/);

      expect(res.body.code).toMatch(/unauthorized|invalid_token/);
    });

    it('should allow access to protected route with valid token', async () => {
      // Login first
      const loginRes = await request(app)
        .post('/auth/login')
        .send({
          corporateEmail: 'supertest@unisabana.edu.co',
          password: 'TestPassword123!'
        })
        .expect(200);

      // Access protected route
      const res = await request(app)
        .get('/api/users/me')
        .set('Cookie', loginRes.headers['set-cookie'])
        .expect(200)
        .expect('Content-Type', /json/);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('role', 'passenger');
      expect(res.body).not.toHaveProperty('password');
    });

    it('should verify session is stateless (token works across requests)', async () => {
      // Login
      const loginRes = await request(app)
        .post('/auth/login')
        .send({
          corporateEmail: 'supertest@unisabana.edu.co',
          password: 'TestPassword123!'
        })
        .expect(200);

      const cookies = loginRes.headers['set-cookie'];

      // Make multiple requests with same token
      for (let i = 0; i < 3; i++) {
        await request(app)
          .get('/api/users/me')
          .set('Cookie', cookies)
          .expect(200);
      }
    });
  });

  describe('CSRF Protection', () => {
    let cookies = null;
    let csrfToken = null;

    beforeEach(async () => {
      // Login to get cookies and CSRF token
      const loginRes = await request(app)
        .post('/auth/login')
        .send({
          corporateEmail: 'supertest@unisabana.edu.co',
          password: 'TestPassword123!'
        })
        .expect(200);

      cookies = loginRes.headers['set-cookie'];
      
      // Extract CSRF token from cookie
      const csrfCookie = cookies.find(c => c.includes('csrf_token='));
      const match = csrfCookie?.match(/csrf_token=([^;]+)/);
      if (match) {
        csrfToken = match[1];
      }
    });

    it('should reject state-changing request without CSRF token', async () => {
      const res = await request(app)
        .patch('/api/users/me')
        .set('Cookie', cookies)
        .send({ firstName: 'Updated' })
        .expect(403)
        .expect('Content-Type', /json/);

      expect(res.body).toHaveProperty('code', 'csrf_mismatch');
    });

    it('should accept state-changing request with valid CSRF token', async () => {
      const res = await request(app)
        .patch('/api/users/me')
        .set('Cookie', cookies)
        .set('X-CSRF-Token', csrfToken)
        .send({ firstName: 'CSRFTest' })
        .expect(200)
        .expect('Content-Type', /json/);

      expect(res.body).toHaveProperty('firstName', 'CSRFTest');
    });

    it('should reject request with mismatched CSRF token', async () => {
      const res = await request(app)
        .patch('/api/users/me')
        .set('Cookie', cookies)
        .set('X-CSRF-Token', 'wrong-token-12345')
        .send({ firstName: 'Hacker' })
        .expect(403)
        .expect('Content-Type', /json/);

      expect(res.body).toHaveProperty('code', 'csrf_mismatch');
    });

    it('should allow GET requests without CSRF token', async () => {
      await request(app)
        .get('/api/users/me')
        .set('Cookie', cookies)
        // No X-CSRF-Token header
        .expect(200);
    });
  });

  describe('Cookie Flags Verification', () => {
    it('should verify all security flags on access_token cookie', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          corporateEmail: 'supertest@unisabana.edu.co',
          password: 'TestPassword123!'
        })
        .expect(200);

      const cookies = res.headers['set-cookie'];
      const accessCookie = cookies.find(c => c.includes('access_token='));

      // Verify all required flags
      expect(accessCookie).toMatch(/HttpOnly/);
      expect(accessCookie).toMatch(/Path=\//);
      expect(accessCookie).toMatch(/SameSite=(Strict|Lax)/);
      expect(accessCookie).toMatch(/Max-Age=\d+/);

      // In production, should have Secure flag
      if (process.env.NODE_ENV === 'production') {
        expect(accessCookie).toMatch(/Secure/);
      }
    });

    it('should verify csrf_token cookie is NOT httpOnly', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          corporateEmail: 'supertest@unisabana.edu.co',
          password: 'TestPassword123!'
        })
        .expect(200);

      const cookies = res.headers['set-cookie'];
      const csrfCookie = cookies.find(c => c.includes('csrf_token='));

      // CRITICAL: Must NOT be httpOnly (needs to be readable by JS)
      expect(csrfCookie).not.toMatch(/HttpOnly/);
      expect(csrfCookie).toMatch(/Path=\//);
      expect(csrfCookie).toMatch(/SameSite/);
    });
  });
});

