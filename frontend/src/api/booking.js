import client from './client';

/**
 * Booking API endpoints (Passenger only)
 */

/**
 * List my booking requests
 * @param {Object} [filters] - Optional filters
 * @param {string|string[]} [filters.status] - Filter by status (pending, accepted, declined, canceled_by_passenger, expired)
 * @param {string} [filters.fromDate] - Filter from this date
 * @param {string} [filters.toDate] - Filter until this date
 * @param {number} [filters.page=1] - Page number
 * @param {number} [filters.pageSize=10] - Items per page
 * @returns {Promise<Object>} - {items, page, pageSize, total, totalPages}
 */
export async function getMyBookings(filters = {}) {
  const response = await client.get('/passengers/bookings', {
    params: filters,
  });
  return response.data;
}

/**
 * Create a booking request for a trip
 * @param {Object} bookingData
 * @param {string} bookingData.tripId - Trip ID
 * @param {number} bookingData.seats - Number of seats
 * @param {string} [bookingData.note] - Optional note
 * @returns {Promise<Object>} - Created booking
 */
export async function createBooking(bookingData) {
  const response = await client.post('/passengers/bookings', bookingData);
  return response.data;
}

/**
 * Cancel a booking request
 * @param {string} bookingId - Booking ID
 * @param {string} [reason] - Optional cancellation reason
 * @returns {Promise<Object>} - Cancellation result
 */
export async function cancelBooking(bookingId, reason = '') {
  const response = await client.post(`/passengers/bookings/${bookingId}/cancel`, {
    reason,
  });
  return response.data;
}

/**
 * Get a specific booking by ID
 * @param {string} bookingId - Booking ID
 * @returns {Promise<Object>} - Booking details
 */
export async function getBookingById(bookingId) {
  const response = await client.get(`/passengers/bookings/${bookingId}`);
  return response.data;
}

