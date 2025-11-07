import client from './client';

/**
 * User API endpoints
 */

/**
 * Get current user profile
 * @returns {Promise<Object>} - User profile data
 */
export async function getMyProfile() {
  const response = await client.get('/api/users/me');
  return response.data;
}

/**
 * Toggle user role between passenger and driver
 * @returns {Promise<Object>} - Updated user data with new role
 */
export async function toggleRole() {
  const response = await client.post('/api/users/me/toggle-role');
  return response.data;
}

/**
 * Report a user from a specific trip
 * @param {string} userId - User ID to report
 * @param {Object} reportData - Report data
 * @param {string} reportData.tripId - Trip ID where the incident occurred
 * @param {string} reportData.category - Report category (abuse, harassment, fraud, no_show, unsafe_behavior, other)
 * @param {string} [reportData.reason] - Optional reason (max 500 chars)
 * @returns {Promise<Object>} - Report response
 */
export async function reportUser(userId, reportData) {
  const response = await client.post(`/api/users/${userId}/report`, reportData);
  return response.data;
}

/**
 * Get all reports made about the current user
 * @returns {Promise<Object>} - Reports received by the current user
 */
export async function getMyReportsReceived() {
  const response = await client.get('/api/users/me/reports-received');
  return response.data;
}
