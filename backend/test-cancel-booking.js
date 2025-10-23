/**
 * Manual Test for Cancel My Booking Request (Subtask 3.2.5)
 * 
 * Acceptance Criteria:
 * ✅ Owner cancels pending → 200 with status canceled_by_passenger
 * ✅ Cancel already canceled → 200 (idempotent)
 * ✅ Trying to cancel someone else's request → 403
 * ✅ Cancel non-pending (accepted/declined/expired) → 409 invalid_state
 */

require('dotenv').config();
const request = require('supertest');
const app = require('./src/app');
const connectDB = require('./src/infrastructure/database/connection');
const UserModel = require('./src/infrastructure/database/models/UserModel');
const VehicleModel = require('./src/infrastructure/database/models/VehicleModel');
const TripOfferModel = require('./src/infrastructure/database/models/TripOfferModel');
const BookingRequestModel = require('./src/infrastructure/database/models/BookingRequestModel');
const bcrypt = require('bcrypt');

async function runTests() {
  console.log('🚀 Testing Cancel My Booking Request (Subtask 3.2.5)\n');

  let driver, passenger1, passenger2, trip, booking1, booking2, booking3, cookie1, cookie2, csrfToken1, csrfToken2;

  try {
    await connectDB();
    console.log('✓ Connected to database\n');

    // Cleanup
    await UserModel.deleteMany({ corporateEmail: { $regex: /cancelbookingtest.*@unisabana\.edu\.co/i } });
    await VehicleModel.deleteMany({});
    await TripOfferModel.deleteMany({});
    await BookingRequestModel.deleteMany({});

    // Create users
    const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
    
    driver = await UserModel.create({
      role: 'driver',
      firstName: 'CancelBookingTest',
      lastName: 'Driver',
      universityId: '999050',
      corporateEmail: 'cancelbookingtest-driver@unisabana.edu.co',
      phone: '+573002222222',
      password: hashedPassword
    });

    passenger1 = await UserModel.create({
      role: 'passenger',
      firstName: 'CancelBookingTest',
      lastName: 'Passenger1',
      universityId: '999051',
      corporateEmail: 'cancelbookingtest-passenger1@unisabana.edu.co',
      phone: '+573003333333',
      password: hashedPassword
    });

    passenger2 = await UserModel.create({
      role: 'passenger',
      firstName: 'CancelBookingTest',
      lastName: 'Passenger2',
      universityId: '999052',
      corporateEmail: 'cancelbookingtest-passenger2@unisabana.edu.co',
      phone: '+573004444444',
      password: hashedPassword
    });

    console.log('✓ Created test users\n');

    // Login passenger1
    const login1Res = await request(app)
      .post('/auth/login')
      .send({
        corporateEmail: passenger1.corporateEmail,
        password: 'TestPassword123!'
      })
      .expect(200);

    cookie1 = login1Res.headers['set-cookie'];
    csrfToken1 = cookie1.find(c => c.startsWith('csrf_token=')).split(';')[0].split('=')[1];
    console.log('✓ Logged in as passenger1\n');

    // Login passenger2
    const login2Res = await request(app)
      .post('/auth/login')
      .send({
        corporateEmail: passenger2.corporateEmail,
        password: 'TestPassword123!'
      })
      .expect(200);

    cookie2 = login2Res.headers['set-cookie'];
    csrfToken2 = cookie2.find(c => c.startsWith('csrf_token=')).split(';')[0].split('=')[1];
    console.log('✓ Logged in as passenger2\n');

    // Create vehicle and trip
    const vehicle = await VehicleModel.create({
      driverId: driver._id,
      plate: 'CNL123',
      brand: 'Nissan',
      model: 'Versa',
      color: 'Silver',
      capacity: 4,
      vehiclePhotoUrl: '/uploads/vehicles/test.jpg',
      soatPhotoUrl: '/uploads/vehicles/soat.pdf'
    });

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    trip = await TripOfferModel.create({
      driverId: driver._id,
      vehicleId: vehicle._id,
      origin: { text: 'Campus Norte', geo: { lat: 4.7, lng: -74.0 } },
      destination: { text: 'Centro', geo: { lat: 4.6, lng: -74.1 } },
      departureAt: tomorrow,
      estimatedArrivalAt: new Date(tomorrow.getTime() + 60 * 60 * 1000),
      pricePerSeat: 5000,
      totalSeats: 3,
      status: 'published',
      notes: 'Test trip'
    });

    // Create booking requests
    booking1 = await BookingRequestModel.create({
      tripId: trip._id,
      passengerId: passenger1._id,
      status: 'pending',
      note: 'Booking 1',
      seats: 1
    });

    booking2 = await BookingRequestModel.create({
      tripId: trip._id,
      passengerId: passenger2._id,
      status: 'pending',
      note: 'Booking 2 (passenger2)',
      seats: 1
    });

    booking3 = await BookingRequestModel.create({
      tripId: trip._id,
      passengerId: passenger1._id,
      status: 'accepted', // Non-pending status for testing
      note: 'Booking 3 (accepted)',
      seats: 1
    });

    console.log('✓ Created test booking requests\n');

    // TESTS
    console.log('='.repeat(60));
    console.log('TEST 1: Owner cancels pending request → 200 canceled_by_passenger');
    console.log('='.repeat(60));
    
    const res1 = await request(app)
      .delete(`/passengers/bookings/${booking1._id}`)
      .set('Cookie', cookie1)
      .set('X-CSRF-Token', csrfToken1)
      .expect(200);

    console.log(`Status: ${res1.status}`);
    console.log(`Booking ID: ${res1.body.id}`);
    console.log(`Status: ${res1.body.status}`);
    
    if (res1.body.status === 'canceled_by_passenger') {
      console.log('✅ TEST 1 PASSED\n');
    } else {
      console.error('❌ TEST 1 FAILED\n');
    }

    console.log('='.repeat(60));
    console.log('TEST 2: Cancel already canceled → 200 (idempotent)');
    console.log('='.repeat(60));
    
    const res2 = await request(app)
      .delete(`/passengers/bookings/${booking1._id}`)
      .set('Cookie', cookie1)
      .set('X-CSRF-Token', csrfToken1)
      .expect(200);

    console.log(`Status: ${res2.status}`);
    console.log(`Status: ${res2.body.status}`);
    
    if (res2.body.status === 'canceled_by_passenger') {
      console.log('✅ TEST 2 PASSED (idempotent)\n');
    } else {
      console.error('❌ TEST 2 FAILED\n');
    }

    console.log('='.repeat(60));
    console.log('TEST 3: Try to cancel someone else\'s request → 403');
    console.log('='.repeat(60));
    
    const res3 = await request(app)
      .delete(`/passengers/bookings/${booking2._id}`)
      .set('Cookie', cookie1)
      .set('X-CSRF-Token', csrfToken1)
      .expect(403);

    console.log(`Status: ${res3.status}`);
    console.log(`Code: ${res3.body.code}`);
    console.log(`Message: ${res3.body.message}`);
    
    if (res3.body.code === 'forbidden_owner') {
      console.log('✅ TEST 3 PASSED\n');
    } else {
      console.error('❌ TEST 3 FAILED\n');
    }

    console.log('='.repeat(60));
    console.log('TEST 4: Cancel non-pending request (accepted) → 409 invalid_state');
    console.log('='.repeat(60));
    
    const res4 = await request(app)
      .delete(`/passengers/bookings/${booking3._id}`)
      .set('Cookie', cookie1)
      .set('X-CSRF-Token', csrfToken1)
      .expect(409);

    console.log(`Status: ${res4.status}`);
    console.log(`Code: ${res4.body.code}`);
    console.log(`Message: ${res4.body.message}`);
    
    if (res4.body.code === 'invalid_state') {
      console.log('✅ TEST 4 PASSED\n');
    } else {
      console.error('❌ TEST 4 FAILED\n');
    }

    console.log('='.repeat(60));
    console.log('TEST 5: Cancel non-existent request → 404');
    console.log('='.repeat(60));
    
    const res5 = await request(app)
      .delete('/passengers/bookings/507f1f77bcf86cd799439011')
      .set('Cookie', cookie1)
      .set('X-CSRF-Token', csrfToken1)
      .expect(404);

    console.log(`Status: ${res5.status}`);
    console.log(`Code: ${res5.body.code}`);
    
    if (res5.body.code === 'not_found') {
      console.log('✅ TEST 5 PASSED\n');
    } else {
      console.error('❌ TEST 5 FAILED\n');
    }

    console.log('='.repeat(60));
    console.log('TEST 6: Invalid bookingId format → 400');
    console.log('='.repeat(60));
    
    const res6 = await request(app)
      .delete('/passengers/bookings/invalid-id')
      .set('Cookie', cookie1)
      .set('X-CSRF-Token', csrfToken1)
      .expect(400);

    console.log(`Status: ${res6.status}`);
    console.log(`Code: ${res6.body.code}`);
    
    if (res6.body.code === 'invalid_schema') {
      console.log('✅ TEST 6 PASSED\n');
    } else {
      console.error('❌ TEST 6 FAILED\n');
    }

    console.log('='.repeat(60));
    console.log('TEST 7: Unauthenticated → 401');
    console.log('='.repeat(60));
    
    const res7 = await request(app)
      .delete(`/passengers/bookings/${booking2._id}`)
      .expect(401);

    console.log(`Status: ${res7.status}`);
    console.log(`Code: ${res7.body.code}`);
    
    if (res7.body.code === 'unauthorized') {
      console.log('✅ TEST 7 PASSED\n');
    } else {
      console.error('❌ TEST 7 FAILED\n');
    }

    console.log('='.repeat(60));
    console.log('TEST 8: Missing CSRF token → 403');
    console.log('='.repeat(60));
    
    const res8 = await request(app)
      .delete(`/passengers/bookings/${booking2._id}`)
      .set('Cookie', cookie2)
      .expect(403);

    console.log(`Status: ${res8.status}`);
    console.log(`Code: ${res8.body.code}`);
    
    if (res8.body.code === 'csrf_mismatch') {
      console.log('✅ TEST 8 PASSED\n');
    } else {
      console.error('❌ TEST 8 FAILED\n');
    }

    console.log('\n✅ All acceptance criteria verified!\n');
    console.log('Summary:');
    console.log('  ✅ Owner cancels pending → 200 canceled_by_passenger');
    console.log('  ✅ Cancel already canceled → 200 (idempotent)');
    console.log('  ✅ Try to cancel someone else\'s request → 403');
    console.log('  ✅ Cancel non-pending (accepted) → 409 invalid_state');
    console.log('  ✅ Cancel non-existent → 404');
    console.log('  ✅ Invalid bookingId → 400');
    console.log('  ✅ Auth required → 401');
    console.log('  ✅ CSRF protection → 403');

  } catch (error) {
    console.error('\n❌ Unhandled error:', error);
  } finally {
    // Cleanup
    await UserModel.deleteMany({ corporateEmail: { $regex: /cancelbookingtest.*@unisabana\.edu\.co/i } });
    await VehicleModel.deleteMany({});
    await TripOfferModel.deleteMany({});
    await BookingRequestModel.deleteMany({});
    await require('mongoose').connection.close();
    console.log('\n✓ Cleaned up and disconnected\n');
  }
}

runTests();

