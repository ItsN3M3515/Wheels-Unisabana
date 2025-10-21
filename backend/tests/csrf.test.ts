import request from 'supertest';
import { app } from '../src/server';
import { User } from '../src/models/User';
import { authService } from '../src/services/authService';
import { generateCsrfToken } from '../src/middleware/csrf';

describe('CSRF Protection Tests', () => {
  let driverToken: string;
  let csrfToken: string;
  let driverId: string;

  const testDriver = {
    corporateEmail: 'csrf.driver@uni.edu',
    password: 'CsrfDriver123!',
    firstName: 'CSRF',
    lastName: 'Driver',
    universityId: 'CSRF123',
    role: 'driver' as const,
    phone: '+573005555555',
  };

  beforeAll(async () => {
    // Create test driver
    const passwordHash = await authService.hashPassword(testDriver.password);
    await User.deleteOne({ corporateEmail: testDriver.corporateEmail }).catch(() => {});
    const user = await User.create({ ...testDriver, passwordHash }).catch(() => null);

    if (user) {
      driverId = String((user as any)._id);
      driverToken = authService.signAccessToken({
        sub: driverId,
        role: user.role,
        email: user.corporateEmail,
      });
    }

    // Generate a CSRF token
    csrfToken = generateCsrfToken();
  }, 15000);

  afterAll(async () => {
    await User.deleteOne({ corporateEmail: testDriver.corporateEmail }).catch(() => {});
  }, 10000);

  describe('Login sets CSRF token', () => {
    it('should set csrf_token cookie on successful login', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          corporateEmail: testDriver.corporateEmail,
          password: testDriver.password,
        });

      expect(res.status).toBe(200);

      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();

      const csrfCookie = cookies.find((c: string) => c.startsWith('csrf_token='));
      expect(csrfCookie).toBeDefined();
      expect(csrfCookie).not.toContain('HttpOnly'); // Should NOT be httpOnly
      expect(csrfCookie).toContain('Path=/');
    });
  });

  describe('CSRF protection on state-changing endpoints', () => {
    describe('POST /drivers/vehicle', () => {
      it('should return 403 when CSRF token is missing', async () => {
        const res = await request(app)
          .post('/drivers/vehicle')
          .set('Cookie', `access_token=${driverToken}`)
          .send({ vehicleId: 'ABC123' });

        expect(res.status).toBe(403);
        expect(res.body).toEqual({
          code: 'csrf_mismatch',
          message: 'CSRF token missing or invalid',
        });
      });

      it('should return 403 when CSRF token is in cookie but not in header', async () => {
        const res = await request(app)
          .post('/drivers/vehicle')
          .set('Cookie', `access_token=${driverToken}; csrf_token=${csrfToken}`)
          .send({ vehicleId: 'ABC123' });

        expect(res.status).toBe(403);
        expect(res.body.code).toBe('csrf_mismatch');
      });

      it('should return 403 when CSRF tokens do not match', async () => {
        const res = await request(app)
          .post('/drivers/vehicle')
          .set('Cookie', `access_token=${driverToken}; csrf_token=${csrfToken}`)
          .set('X-CSRF-Token', 'wrong-token')
          .send({ vehicleId: 'ABC123' });

        expect(res.status).toBe(403);
        expect(res.body.code).toBe('csrf_mismatch');
      });

      it('should succeed when CSRF tokens match (double-submit)', async () => {
        const res = await request(app)
          .post('/drivers/vehicle')
          .set('Cookie', `access_token=${driverToken}; csrf_token=${csrfToken}`)
          .set('X-CSRF-Token', csrfToken)
          .send({ vehicleId: 'TEST123' });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({
          vehicleId: 'TEST123',
          hasVehicle: true,
        });
      });
    });

    describe('PATCH /drivers/vehicle', () => {
      it('should require CSRF token', async () => {
        const res = await request(app)
          .patch('/drivers/vehicle')
          .set('Cookie', `access_token=${driverToken}`)
          .send({ vehicleId: 'XYZ789' });

        expect(res.status).toBe(403);
        expect(res.body.code).toBe('csrf_mismatch');
      });

      it('should succeed with valid CSRF token', async () => {
        const res = await request(app)
          .patch('/drivers/vehicle')
          .set('Cookie', `access_token=${driverToken}; csrf_token=${csrfToken}`)
          .set('X-CSRF-Token', csrfToken)
          .send({ vehicleId: 'XYZ789' });

        expect(res.status).toBe(200);
        expect(res.body.vehicleId).toBe('XYZ789');
      });
    });

    describe('PATCH /users/me', () => {
      it('should require CSRF token', async () => {
        const res = await request(app)
          .patch('/users/me')
          .set('Cookie', `access_token=${driverToken}`)
          .send({ firstName: 'UpdatedName' });

        expect(res.status).toBe(403);
        expect(res.body.code).toBe('csrf_mismatch');
      });

      it('should succeed with valid CSRF token', async () => {
        const res = await request(app)
          .patch('/users/me')
          .set('Cookie', `access_token=${driverToken}; csrf_token=${csrfToken}`)
          .set('X-CSRF-Token', csrfToken)
          .send({ firstName: 'UpdatedName' });

        // Should not be 403 (CSRF passed)
        expect(res.status).not.toBe(403);
      });
    });
  });

  describe('CSRF not required for safe methods', () => {
    it('should allow GET /users/me without CSRF token', async () => {
      const res = await request(app)
        .get('/users/me')
        .set('Cookie', `access_token=${driverToken}`);

      expect(res.status).toBe(200);
      // No CSRF required for GET
    });

    it('should allow GET /drivers/vehicle without CSRF token', async () => {
      const res = await request(app)
        .get('/drivers/vehicle')
        .set('Cookie', `access_token=${driverToken}`);

      expect(res.status).toBe(200);
      // No CSRF required for GET
    });
  });

  describe('Integration: Login → Read CSRF → Use in request', () => {
    it('should complete full CSRF flow', async () => {
      // Step 1: Login
      const loginRes = await request(app)
        .post('/auth/login')
        .send({
          corporateEmail: testDriver.corporateEmail,
          password: testDriver.password,
        });

      expect(loginRes.status).toBe(200);

      // Step 2: Extract cookies
      const cookies = loginRes.headers['set-cookie'] as unknown as string[];
      const tokenCookie = cookies.find((c: string) => c.startsWith('access_token='));
      const csrfCookie = cookies.find((c: string) => c.startsWith('csrf_token='));

      expect(tokenCookie).toBeDefined();
      expect(csrfCookie).toBeDefined();

      // Extract token values
      const token = tokenCookie!.match(/access_token=([^;]+)/)?.[1];
      const csrf = csrfCookie!.match(/csrf_token=([^;]+)/)?.[1];

      expect(token).toBeDefined();
      expect(csrf).toBeDefined();

      // Step 3: Make state-changing request with CSRF token
      const patchRes = await request(app)
        .patch('/drivers/vehicle')
        .set('Cookie', `access_token=${token}; csrf_token=${csrf}`)
        .set('X-CSRF-Token', csrf!)
        .send({ vehicleId: 'FLOW123' });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.vehicleId).toBe('FLOW123');
    });
  });
});
