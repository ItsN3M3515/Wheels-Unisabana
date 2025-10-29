import client from './client';

/**
 * Auth API endpoints
 */

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.corporateEmail - Corporate email (@unisabana.edu.co)
 * @param {string} userData.password - Password (min 8 chars)
 * @param {string} userData.firstName - First name
 * @param {string} userData.lastName - Last name
 * @param {string} userData.role - User role ('passenger' | 'driver')
 * @param {string} userData.phone - Phone number
 * @param {string} userData.universityId - University ID
 * @returns {Promise<Object>} - User data
 */
export async function register(userData) {
  const response = await client.post('/auth/register', userData);
  return response.data;
}

/**
 * Login user
 * @param {string} corporateEmail - Corporate email
 * @param {string} password - Password
 * @returns {Promise<Object>} - User data with JWT cookie set
 */
export async function login(corporateEmail, password) {
  const response = await client.post('/auth/login', {
    corporateEmail,
    password,
  });
  return response.data;
}

/**
 * Logout user
 * @returns {Promise<void>}
 */
export async function logout() {
  await client.post('/auth/logout');
}

/**
 * Get current user profile
 * @returns {Promise<Object>} - User data
 */
export async function getCurrentUser() {
  const response = await client.get('/auth/me');
  return response.data;
}

/**
 * Change password (authenticated)
 * @param {Object} passwordData - Password change data
 * @param {string} passwordData.currentPassword - Current password
 * @param {string} passwordData.newPassword - New password
 * @returns {Promise<Object>} - { ok: true }
 */
export async function changePassword(passwordData) {
  const response = await client.patch('/auth/password', passwordData);
  return response.data;
}

