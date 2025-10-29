import client from './client';

/**
 * Trip Search API endpoints (Passenger)
 */

/**
 * Search for available published trips
 * @param {Object} [filters] - Optional filters
 * @param {string} [filters.qOrigin] - Search text for origin
 * @param {string} [filters.qDestination] - Search text for destination
 * @param {string} [filters.fromDate] - Minimum departure date (ISO 8601)
 * @param {string} [filters.toDate] - Maximum departure date (ISO 8601)
 * @param {number} [filters.page=1] - Page number
 * @param {number} [filters.pageSize=10] - Items per page (max 50)
 * @returns {Promise<Object>} - {items, page, pageSize, total, totalPages}
 */
export async function searchTrips(filters = {}) {
  const response = await client.get('/passengers/trips/search', {
    params: filters,
  });
  return response.data;
}

