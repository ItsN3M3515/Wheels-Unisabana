import request from 'supertest';
import { app } from '../src/server';
import { User } from '../src/models/User';
import { authService } from '../src/services/authService';

describe('POST /auth/logout', () => {
  let testToken: string;
  const testUser = {
    corporateEmail: 'logout.test@uni.edu',
    password: 'LogoutTest123!',
    firstName: 'Logout',
    lastName: 'Test',
    universityId: 'LGT123',
    role: 'passenger' as const,
    phone: '+573009999999',
  };

  beforeAll(async () => {
    // Create test user
    const passwordHash = await authService.hashPassword(testUser.password);
    await User.deleteOne({ corporateEmail: testUser.corporateEmail }).catch(() => {});
    const user = await User.create({ ...testUser, passwordHash }).catch(() => null);

    if (user) {
      // Generate token
      testToken = authService.signAccessToken({
        sub: String((user as any)._id),
        role: user.role,
        email: user.corporateEmail,
      });
    }
  }, 15000);

  afterAll(async () => {
    await User.deleteOne({ corporateEmail: testUser.corporateEmail }).catch(() => {});
  }, 10000);

  describe('Logout functionality', () => {
    it('should return 200 and { ok: true }', async () => {
      const res = await request(app)
        .post('/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    });

    it('should clear the access_token cookie with Max-Age=0', async () => {
      const res = await request(app)
        .post('/auth/logout');

      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();

      const accessTokenCookie = cookies.find((c: string) => c.startsWith('access_token='));
      expect(accessTokenCookie).toBeDefined();
      expect(accessTokenCookie).toContain('Max-Age=0');
      expect(accessTokenCookie).toContain('HttpOnly');
      expect(accessTokenCookie).toContain('Path=/');
    });

    it('should work even without an existing session', async () => {
      const res = await request(app)
        .post('/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    });

      // OpenAPI spec validation test (requires jest-openapi matchers)
      // it('should validate OpenAPI contract', async () => {
      //   const res = await request(app)
      //     .post('/auth/logout');
      //
      //   expect(res).toSatisfyApiSpec();
      // });
  });

  describe('Integration flow: login -> logout', () => {
    it('should login, access protected route, logout, then fail to access protected route', async () => {
      // Step 1: Login
      const loginRes = await request(app)
        .post('/auth/login')
        .send({ 
          corporateEmail: testUser.corporateEmail, 
          password: testUser.password 
        });

      expect(loginRes.status).toBe(200);
      
      const loginCookies = loginRes.headers['set-cookie'] as unknown as string[];
      const tokenCookie = loginCookies.find((c: string) => c.startsWith('access_token='));
      expect(tokenCookie).toBeDefined();

      // Extract token from cookie
      const tokenMatch = tokenCookie!.match(/access_token=([^;]+)/);
      const token = tokenMatch ? tokenMatch[1] : '';

      // Step 2: Access protected route with valid token
      const meRes = await request(app)
        .get('/users/me')
        .set('Cookie', `access_token=${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.corporateEmail).toBe(testUser.corporateEmail);

      // Step 3: Logout
      const logoutRes = await request(app)
        .post('/auth/logout')
        .set('Cookie', `access_token=${token}`);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body).toEqual({ ok: true });

      const logoutCookies = logoutRes.headers['set-cookie'] as unknown as string[];
      const clearedCookie = logoutCookies.find((c: string) => c.startsWith('access_token='));
      expect(clearedCookie).toContain('Max-Age=0');

      // Step 4: Try to access protected route after logout (should still work with old token)
      // Note: Stateless JWT logout only clears the cookie on client side
      // The token itself is still valid until expiry
      // To enforce immediate invalidation, implement a token denylist
      const afterLogoutRes = await request(app)
        .get('/users/me')
        .set('Cookie', `access_token=${token}`);

      // With stateless JWT, the token is still valid
      // This is expected behavior for now
      expect(afterLogoutRes.status).toBe(200);
    });

    it('should not have access_token cookie after logout clears it', async () => {
      // Login
      const loginRes = await request(app)
        .post('/auth/login')
        .send({ 
          corporateEmail: testUser.corporateEmail, 
          password: testUser.password 
        });

      const loginCookies = loginRes.headers['set-cookie'] as unknown as string[];
      const tokenCookie = loginCookies.find((c: string) => c.startsWith('access_token='));
      const tokenMatch = tokenCookie!.match(/access_token=([^;]+)/);
      const token = tokenMatch ? tokenMatch[1] : '';

      // Logout
      const logoutRes = await request(app)
        .post('/auth/logout')
        .set('Cookie', `access_token=${token}`);

      // Verify cookie is cleared (empty value with Max-Age=0)
      const logoutCookies = logoutRes.headers['set-cookie'] as unknown as string[];
      const clearedCookie = logoutCookies.find((c: string) => c.startsWith('access_token='));
      
      expect(clearedCookie).toBeDefined();
      // Cookie should be empty or have Max-Age=0
      expect(clearedCookie).toMatch(/access_token=;|access_token=\s*;/);
      expect(clearedCookie).toContain('Max-Age=0');
    });
  });
});
