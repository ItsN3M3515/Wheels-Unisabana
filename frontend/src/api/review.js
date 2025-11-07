import client from './client';

/**
 * Review API endpoints
 */

/**
 * Create a review for a completed trip
 * @param {string} tripId - Trip ID
 * @param {Object} reviewData - Review data
 * @param {number} reviewData.rating - Rating (1-5)
 * @param {string} [reviewData.text] - Review text
 * @param {string[]} [reviewData.tags] - Tags array (max 5)
 * @returns {Promise<Object>} - Created review
 */
export async function createReview(tripId, reviewData) {
  const response = await client.post(`/trips/${tripId}/reviews`, reviewData);
  return response.data;
}

/**
 * Get my review for a specific trip
 * @param {string} tripId - Trip ID
 * @returns {Promise<Object>} - Review or 404 if not found
 */
export async function getMyReviewForTrip(tripId) {
  const response = await client.get(`/passengers/trips/${tripId}/reviews/me`);
  return response.data;
}

/**
 * Edit my review (within 24h window)
 * @param {string} tripId - Trip ID
 * @param {string} reviewId - Review ID
 * @param {Object} updates - Updates
 * @param {number} [updates.rating] - New rating
 * @param {string} [updates.text] - New text
 * @param {string[]} [updates.tags] - New tags
 * @returns {Promise<Object>} - Updated review
 */
export async function editMyReview(tripId, reviewId, updates) {
  const response = await client.patch(`/passengers/trips/${tripId}/reviews/${reviewId}`, updates);
  return response.data;
}

/**
 * Delete my review (soft delete within 24h window)
 * @param {string} tripId - Trip ID
 * @param {string} reviewId - Review ID
 * @returns {Promise<Object>} - {deleted: true}
 */
export async function deleteMyReview(tripId, reviewId) {
  const response = await client.delete(`/passengers/trips/${tripId}/reviews/${reviewId}`);
  return response.data;
}

/**
 * List reviews for a driver (public)
 * @param {string} driverId - Driver ID
 * @param {Object} [options] - Query options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.pageSize=10] - Items per page
 * @returns {Promise<Object>} - {items, page, pageSize, total, totalPages}
 */
export async function getDriverReviews(driverId, options = {}) {
  const response = await client.get(`/drivers/${driverId}/reviews`, {
    params: options,
  });
  return response.data;
}

/**
 * Get driver ratings aggregate (public)
 * @param {string} driverId - Driver ID
 * @returns {Promise<Object>} - {driverId, avgRating, count, histogram, updatedAt}
 */
export async function getDriverRatings(driverId) {
  const response = await client.get(`/drivers/${driverId}/ratings`);
  return response.data;
}

/**
 * Report a review
 * @param {string} reviewId - Review ID
 * @param {Object} reportData - Report data
 * @param {string} reportData.category - Report category
 * @param {string} [reportData.reason] - Reason for report
 * @returns {Promise<Object>} - {ok: true, category, reports}
 */
export async function reportReview(reviewId, reportData) {
  const response = await client.post(`/trips/reviews/${reviewId}/report`, reportData);
  return response.data;
}

/**
 * Admin: set review visibility (hide/unhide)
 * @param {string} reviewId
 * @param {'hide'|'unhide'} action
 * @param {string} [reason]
 * @returns {Promise<Object>}
 */
export async function adminSetVisibility(reviewId, action, reason) {
  const response = await client.patch(`/admin/reviews/${reviewId}/visibility`, { action, reason });
  return response.data;
}

