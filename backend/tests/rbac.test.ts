import request from 'supertest';
import { app } from '../src/server';
import { User } from '../src/models/User';
import { authService } from '../src/services/authService';

describe('RBAC Middleware Tests', () => {
  let passengerToken: string;
  let driverToken: string;
  let adminToken: string;

  const testUsers = {
    passenger: {
      corporateEmail: 'passenger.test@uni.edu',
      password: 'PassengerPass123!',
      firstName: 'Test',
      lastName: 'Passenger',
      universityId: 'PASS123',
      role: 'passenger' as const,
      phone: '+573001111111',
    },
    driver: {
      corporateEmail: 'driver.test@uni.edu',
      password: 'DriverPass123!',
      firstName: 'Test',
      lastName: 'Driver',
      universityId: 'DRV123',
      role: 'driver' as const,
      phone: '+573002222222',
    },
    admin: {
      corporateEmail: 'admin.test@uni.edu',
      password: 'AdminPass123!',
      firstName: 'Test',
      lastName: 'Admin',
      universityId: 'ADM123',
      role: 'admin' as const,
      phone: '+573003333333',
    },
  };

  beforeAll(async () => {
    // Create test users with hashed passwords
    for (const [key, userData] of Object.entries(testUsers)) {
      const passwordHash = await authService.hashPassword(userData.password);
      await User.deleteOne({ corporateEmail: userData.corporateEmail }).catch(() => {});
      await User.create({ ...userData, passwordHash }).catch(() => {});
    }

    // Generate tokens for each role
    const passengerUser = await User.findOne({ corporateEmail: testUsers.passenger.corporateEmail });
    const driverUser = await User.findOne({ corporateEmail: testUsers.driver.corporateEmail });
    const adminUser = await User.findOne({ corporateEmail: testUsers.admin.corporateEmail });

    if (passengerUser) {
      passengerToken = authService.signAccessToken({
        sub: String((passengerUser as any)._id),
        role: passengerUser.role,
        email: passengerUser.corporateEmail,
      });
    }

    if (driverUser) {
      driverToken = authService.signAccessToken({
        sub: String((driverUser as any)._id),
        role: driverUser.role,
        email: driverUser.corporateEmail,
      });
    }

    if (adminUser) {
      adminToken = authService.signAccessToken({
        sub: String((adminUser as any)._id),
        role: adminUser.role,
        email: adminUser.corporateEmail,
      });
    }
  }, 30000);

  afterAll(async () => {
    // Clean up test users
    for (const userData of Object.values(testUsers)) {
      await User.deleteOne({ corporateEmail: userData.corporateEmail }).catch(() => {});
    }
  }, 15000);

  describe('requireAuth middleware', () => {
    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/users/me');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        code: 'unauthorized',
        message: 'Missing or invalid session',
      });
    });

    it('should return 401 when invalid token is provided', async () => {
      const res = await request(app)
        .get('/users/me')
        .set('Cookie', 'access_token=invalid-token');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        code: 'unauthorized',
        message: 'Missing or invalid session',
      });
    });

    it('should allow access with valid token', async () => {
      const res = await request(app)
        .get('/users/me')
        .set('Cookie', `access_token=${passengerToken}`);

      expect(res.status).not.toBe(401);
    });
  });

  describe('requireRole middleware', () => {
    describe('Driver-only endpoints', () => {
      it('should allow driver to access /drivers/vehicle', async () => {
        const res = await request(app)
          .get('/drivers/vehicle')
          .set('Cookie', `access_token=${driverToken}`);

        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
      });

      it('should deny passenger from accessing /drivers/vehicle', async () => {
        const res = await request(app)
          .get('/drivers/vehicle')
          .set('Cookie', `access_token=${passengerToken}`);

        expect(res.status).toBe(403);
        expect(res.body).toEqual({
          code: 'forbidden',
          message: 'Access denied. Required role: driver',
        });
      });

      it('should deny admin from accessing /drivers/vehicle', async () => {
        const res = await request(app)
          .get('/drivers/vehicle')
          .set('Cookie', `access_token=${adminToken}`);

        expect(res.status).toBe(403);
        expect(res.body.code).toBe('forbidden');
      });

      it('should return 401 when no token provided for driver endpoint', async () => {
        const res = await request(app).get('/drivers/vehicle');

        expect(res.status).toBe(401);
        expect(res.body).toEqual({
          code: 'unauthorized',
          message: 'Missing or invalid session',
        });
      });
    });

    describe('All authenticated users', () => {
      it('should allow passenger to access /users/me', async () => {
        const res = await request(app)
          .get('/users/me')
          .set('Cookie', `access_token=${passengerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.role).toBe('passenger');
      });

      it('should allow driver to access /users/me', async () => {
        const res = await request(app)
          .get('/users/me')
          .set('Cookie', `access_token=${driverToken}`);

        expect(res.status).toBe(200);
        expect(res.body.role).toBe('driver');
      });

      it('should allow admin to access /users/me', async () => {
        const res = await request(app)
          .get('/users/me')
          .set('Cookie', `access_token=${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.role).toBe('admin');
      });
    });
  });

  describe('Driver vehicle operations', () => {
    it('should allow driver to POST vehicle', async () => {
      const res = await request(app)
        .post('/drivers/vehicle')
        .set('Cookie', `access_token=${driverToken}`)
        .send({ vehicleId: 'ABC123' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        vehicleId: 'ABC123',
        hasVehicle: true,
      });
    });

    it('should allow driver to GET vehicle', async () => {
      const res = await request(app)
        .get('/drivers/vehicle')
        .set('Cookie', `access_token=${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('vehicleId');
      expect(res.body).toHaveProperty('hasVehicle');
    });

    it('should allow driver to PATCH vehicle', async () => {
      const res = await request(app)
        .patch('/drivers/vehicle')
        .set('Cookie', `access_token=${driverToken}`)
        .send({ vehicleId: 'XYZ789' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        vehicleId: 'XYZ789',
        hasVehicle: true,
      });
    });

    it('should deny passenger from POST vehicle', async () => {
      const res = await request(app)
        .post('/drivers/vehicle')
        .set('Cookie', `access_token=${passengerToken}`)
        .send({ vehicleId: 'ABC123' });

      expect(res.status).toBe(403);
    });
  });
});
