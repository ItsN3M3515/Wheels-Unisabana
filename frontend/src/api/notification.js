import client from './client';

/**
 * Notification API endpoints
 */

/**
 * List notifications for current user
 * @param {Object} [options] - Query options
 * @param {string} [options.status='all'] - 'unread' or 'all'
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.pageSize=10] - Items per page
 * @returns {Promise<Object>} - {items, page, pageSize, total, totalPages}
 */
export async function getNotifications(options = {}) {
  const response = await client.get('/notifications', {
    params: options,
  });
  return response.data;
}

/**
 * Mark notifications as read
 * @param {string[]} notificationIds - Array of notification IDs
 * @returns {Promise<Object>} - {updated: number}
 */
export async function markNotificationsAsRead(notificationIds) {
  const response = await client.patch('/notifications/read', {
    ids: notificationIds,
  });
  return response.data;
}

