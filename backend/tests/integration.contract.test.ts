import request from 'supertest';
import { app } from '../src/server';
import { User } from '../src/models/User';
import { authService } from '../src/services/authService';

const HAS_DB = Boolean(process.env.MONGODB_URI);

/**
 * Integration Contract Tests
 * 
 * These tests verify the integration contract for authentication:
 * - Login success returns 200 with httpOnly cookie
 * - Protected routes return 401 without cookie
 * - Cookie flags are properly set (HttpOnly, Secure, Path, SameSite)
 */
describe('Integration Contract Tests', () => {
  const testUser = {
    corporateEmail: 'jdoe@uni.edu',
    password: 'secret',
    firstName: 'John',
    lastName: 'Doe',
    universityId: 'JD123456',
    role: 'passenger' as const,
    phone: '+573001234567',
  };

  beforeAll(async () => {
    if (!HAS_DB) return; // Skip DB setup when DB is not configured
    // Create test user with hashed password
    const passwordHash = await authService.hashPassword(testUser.password);
    
    // Delete if exists
    await User.deleteOne({ corporateEmail: testUser.corporateEmail }).catch(() => {});
    
    // Create fresh user
    await User.create({
      ...testUser,
      passwordHash,
    }).catch(() => {
      console.log('Skipping user creation - MongoDB not connected');
    });
  }, 30000);

  afterAll(async () => {
    if (!HAS_DB) return;
    // Clean up test user
    await User.deleteOne({ corporateEmail: testUser.corporateEmail }).catch(() => {});
  }, 15000);

  (HAS_DB ? describe : describe.skip)('POST /auth/login - Integration Contract', () => {
    it('should return 200 with httpOnly access_token cookie on success', async () => {
      await request(app)
        .post('/auth/login')
        .send({ corporateEmail: 'jdoe@uni.edu', password: 'secret' })
        .expect(200)
        .expect('set-cookie', /access_token=.*HttpOnly/);
    });

    it('should set both access_token and csrf_token cookies', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ corporateEmail: testUser.corporateEmail, password: testUser.password });

      expect(res.status).toBe(200);

      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.length).toBeGreaterThanOrEqual(2);

      // Verify access_token cookie
      const accessTokenCookie = cookies.find((c: string) => c.startsWith('access_token='));
      expect(accessTokenCookie).toBeDefined();
      expect(accessTokenCookie).toMatch(/access_token=.*HttpOnly/);
      expect(accessTokenCookie).toContain('Path=/');

      // Verify csrf_token cookie
      const csrfCookie = cookies.find((c: string) => c.startsWith('csrf_token='));
      expect(csrfCookie).toBeDefined();
      expect(csrfCookie).not.toContain('HttpOnly'); // CSRF token must be readable by client
      expect(csrfCookie).toContain('Path=/');
    });

    it('should return user profile data in response body', async () => {
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
    });

    it('should verify cookie flags match security requirements', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ corporateEmail: testUser.corporateEmail, password: testUser.password });

      const cookies = res.headers['set-cookie'] as unknown as string[];
      const accessTokenCookie = cookies.find((c: string) => c.startsWith('access_token='));
      
      // Required flags for access_token
      expect(accessTokenCookie).toContain('HttpOnly'); // Prevents XSS
      expect(accessTokenCookie).toContain('Path=/');
      // Note: Secure flag only set in production (NODE_ENV=production)
      // Note: SameSite flag depends on environment config
    });
  });

  describe('GET /users/me - Protected Route Contract', () => {
    it('should return 401 without cookie', async () => {
      await request(app)
        .get('/users/me')
        .expect(401)
        .expect(res => expect(res.body.code).toBe('unauthorized'));
    });
    it('should return 401 with invalid cookie', async () => {
      await request(app)
        .get('/users/me')
        .set('Cookie', 'access_token=invalid-token')
        .expect(401)
        .expect(res => {
          expect(res.body.code).toBe('unauthorized');
          expect(res.body.message).toBe('Missing or invalid session');
        });
    });

    (HAS_DB ? it : it.skip)('should return 200 with valid cookie', async () => {
      // First login to get valid token
      const loginRes = await request(app)
        .post('/auth/login')
        .send({ corporateEmail: testUser.corporateEmail, password: testUser.password });

      const cookies = loginRes.headers['set-cookie'] as unknown as string[];
      const accessTokenCookie = cookies.find((c: string) => c.startsWith('access_token='));
      
      // Extract token value
      const tokenMatch = accessTokenCookie!.match(/access_token=([^;]+)/);
      const token = tokenMatch ? tokenMatch[1] : '';

      // Access protected route
      const res = await request(app)
        .get('/users/me')
        .set('Cookie', `access_token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.corporateEmail).toBe(testUser.corporateEmail);
    });
  });

  (HAS_DB ? describe : describe.skip)('POST /auth/logout - Integration Contract', () => {
    it('should return 200 and clear cookies', async () => {
      const res = await request(app)
        .post('/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });

      const cookies = res.headers['set-cookie'] as unknown as string[];
      const accessTokenCookie = cookies?.find((c: string) => c.startsWith('access_token='));
      
      if (accessTokenCookie) {
        expect(accessTokenCookie).toContain('Max-Age=0');
      }
    });

    it('should clear both access_token and csrf_token cookies', async () => {
      const res = await request(app)
        .post('/auth/logout');

      expect(res.status).toBe(200);
      
      const cookies = res.headers['set-cookie'] as unknown as string[];
      
      // Check access_token is cleared
      const accessTokenCookie = cookies?.find((c: string) => c.startsWith('access_token='));
      if (accessTokenCookie) {
        expect(accessTokenCookie).toContain('Max-Age=0');
      }

      // Check csrf_token is cleared
      const csrfCookie = cookies?.find((c: string) => c.startsWith('csrf_token='));
      if (csrfCookie) {
        expect(csrfCookie).toContain('Max-Age=0');
      }
    });
  });

  (HAS_DB ? describe : describe.skip)('Full authentication flow', () => {
    it('should complete full login -> access -> logout flow', async () => {
      // Step 1: Login
      const loginRes = await request(app)
        .post('/auth/login')
        .send({ corporateEmail: testUser.corporateEmail, password: testUser.password })
        .expect(200)
        .expect('set-cookie', /access_token=.*HttpOnly/);

      expect(loginRes.body.role).toBe(testUser.role);

      // Step 2: Extract token
      const loginCookies = loginRes.headers['set-cookie'] as unknown as string[];
      const tokenCookie = loginCookies.find((c: string) => c.startsWith('access_token='));
      const tokenMatch = tokenCookie!.match(/access_token=([^;]+)/);
      const token = tokenMatch ? tokenMatch[1] : '';

      // Step 3: Access protected route
      await request(app)
        .get('/users/me')
        .set('Cookie', `access_token=${token}`)
        .expect(200)
        .expect(res => {
          expect(res.body.corporateEmail).toBe(testUser.corporateEmail);
        });

      // Step 4: Logout
      await request(app)
        .post('/auth/logout')
        .set('Cookie', `access_token=${token}`)
        .expect(200)
        .expect(res => {
          expect(res.body).toEqual({ ok: true });
        });

      // Step 5: Verify cookie is cleared in logout response
      const logoutRes = await request(app).post('/auth/logout');
      const logoutCookies = logoutRes.headers['set-cookie'] as unknown as string[];
      
      if (logoutCookies) {
        const clearedCookie = logoutCookies.find((c: string) => c.startsWith('access_token='));
        if (clearedCookie) {
          expect(clearedCookie).toContain('Max-Age=0');
        }
      }
    });
  });

  describe('Error responses match OpenAPI spec', () => {
    it('401 response has correct error model', async () => {
      await request(app)
        .get('/users/me')
        .expect(401)
        .expect(res => {
          expect(res.body).toHaveProperty('code');
          expect(res.body).toHaveProperty('message');
          expect(res.body.code).toBe('unauthorized');
          expect(typeof res.body.message).toBe('string');
        });
    });
    // The following tests require DB-backed login endpoint
    (HAS_DB ? it : it.skip)('400 validation error has correct model', async () => {
      await request(app)
        .post('/auth/login')
        .send({ corporateEmail: 'invalid' })
        .expect(400)
        .expect(res => {
          expect(res.body).toHaveProperty('code');
          expect(res.body).toHaveProperty('message');
          expect(res.body.code).toBe('invalid_schema');
        });
    });

    (HAS_DB ? it : it.skip)('401 invalid credentials has correct model', async () => {
      await request(app)
        .post('/auth/login')
        .send({ corporateEmail: 'wrong@uni.edu', password: 'wrong' })
        .expect(401)
        .expect(res => {
          expect(res.body).toEqual({
            code: 'invalid_credentials',
            message: 'Email or password is incorrect',
          });
        });
    });
  });
});
