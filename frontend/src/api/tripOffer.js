import client from './client';

/**
 * Trip Offer API endpoints (Driver only)
 */

/**
 * Create a new trip offer
 * @param {Object} tripData - Trip offer data
 * @param {string} tripData.vehicleId - Vehicle ID
 * @param {Object} tripData.origin - Origin location {text, geo: {lat, lng}}
 * @param {Object} tripData.destination - Destination location {text, geo: {lat, lng}}
 * @param {string} tripData.departureAt - Departure date-time (ISO 8601)
 * @param {string} tripData.estimatedArrivalAt - Estimated arrival date-time (ISO 8601)
 * @param {number} tripData.pricePerSeat - Price per seat
 * @param {number} tripData.totalSeats - Total available seats
 * @param {string} [tripData.status='published'] - Trip status ('draft' | 'published')
 * @param {string} [tripData.notes] - Optional notes for passengers
 * @returns {Promise<Object>} - Created trip offer
 */
export async function createTripOffer(tripData) {
  const response = await client.post('/drivers/trips', tripData);
  return response.data;
}

/**
 * List my trip offers with optional filters
 * @param {Object} [filters] - Optional filters
 * @param {string|string[]} [filters.status] - Filter by status
 * @param {string} [filters.fromDate] - Filter trips from this date
 * @param {string} [filters.toDate] - Filter trips until this date
 * @param {number} [filters.page=1] - Page number
 * @param {number} [filters.pageSize=10] - Items per page
 * @returns {Promise<Object>} - {items, page, pageSize, total, totalPages}
 */
export async function getMyTripOffers(filters = {}) {
  const response = await client.get('/drivers/trips', {
    params: filters,
  });
  return response.data;
}

/**
 * Update a trip offer
 * @param {string} tripId - Trip offer ID
 * @param {Object} updates - Fields to update
 * @param {number} [updates.pricePerSeat] - New price
 * @param {number} [updates.totalSeats] - New total seats
 * @param {string} [updates.notes] - New notes
 * @param {string} [updates.status] - New status
 * @returns {Promise<Object>} - Updated trip offer
 */
export async function updateTripOffer(tripId, updates) {
  const response = await client.patch(`/drivers/trips/${tripId}`, updates);
  return response.data;
}

/**
 * Get a single trip offer by ID
 * @param {string} tripId - Trip offer ID
 * @returns {Promise<Object>} - Trip offer details
 */
export async function getTripOfferById(tripId) {
  const response = await client.get(`/drivers/trips/${tripId}`);
  return response.data;
}

/**
 * Cancel a trip offer (update status to 'canceled')
 * @param {string} tripId - Trip offer ID
 * @returns {Promise<Object>} - Updated trip offer
 */
export async function cancelTripOffer(tripId) {
  return updateTripOffer(tripId, { status: 'canceled' });
}

/**
 * Publish a draft trip offer
 * @param {string} tripId - Trip offer ID
 * @returns {Promise<Object>} - Updated trip offer
 */
export async function publishTripOffer(tripId) {
  return updateTripOffer(tripId, { status: 'published' });
}

/**
 * Start a trip (change status from published to in_progress)
 * @param {string} tripId - Trip offer ID
 * @returns {Promise<Object>} - Updated trip offer
 */
export async function startTrip(tripId) {
  const response = await client.post(`/drivers/trips/${tripId}/start`);
  return response.data;
}

/**
 * Complete a trip (change status from in_progress to completed)
 * @param {string} tripId - Trip offer ID
 * @returns {Promise<Object>} - Updated trip offer
 */
export async function completeTrip(tripId) {
  const response = await client.post(`/drivers/trips/${tripId}/complete`);
  return response.data;
}

/**
 * Get booking requests for a specific trip
 * @param {string} tripId - Trip offer ID
 * @param {Object} [filters] - Optional filters
 * @param {string|string[]} [filters.status] - Filter by status
 * @returns {Promise<Object>} - {items, total}
 */
export async function getTripBookings(tripId, filters = {}) {
  const response = await client.get(`/drivers/trips/${tripId}/bookings`, {
    params: filters,
  });
  return response.data;
}

/**
 * Accept a booking request
 * @param {string} tripId - Trip offer ID
 * @param {string} bookingId - Booking request ID
 * @returns {Promise<Object>} - Updated booking
 */
export async function acceptBooking(tripId, bookingId) {
  const response = await client.post(`/drivers/trips/${tripId}/bookings/${bookingId}/accept`);
  return response.data;
}

/**
 * Decline a booking request
 * @param {string} tripId - Trip offer ID
 * @param {string} bookingId - Booking request ID
 * @param {string} [reason] - Optional decline reason
 * @returns {Promise<Object>} - Updated booking
 */
export async function declineBooking(tripId, bookingId, reason = '') {
  const response = await client.post(`/drivers/trips/${tripId}/bookings/${bookingId}/decline`, {
    reason,
  });
  return response.data;
}

