import client from './client';

/**
 * User API endpoints
 */

/**
 * Get current user profile (detailed)
 * @returns {Promise<Object>} - Full user profile
 */
export async function getMyProfile() {
  const response = await client.get('/api/users/me');
  return response.data;
}

/**
 * Update current user profile
 * @param {Object} updates - Profile updates
 * @param {string} [updates.firstName] - First name
 * @param {string} [updates.lastName] - Last name
 * @param {string} [updates.phone] - Phone number (E.164 format)
 * @param {File} [updates.profilePhoto] - Profile photo file
 * @returns {Promise<Object>} - Updated user profile
 */
export async function updateMyProfile(updates) {
  // If there's a file, use FormData
  if (updates.profilePhoto) {
    const formData = new FormData();
    
    if (updates.firstName) formData.append('firstName', updates.firstName);
    if (updates.lastName) formData.append('lastName', updates.lastName);
    if (updates.phone) formData.append('phone', updates.phone);
    formData.append('profilePhoto', updates.profilePhoto);

    const response = await client.patch('/api/users/me', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Otherwise, send JSON
  const response = await client.patch('/api/users/me', updates);
  return response.data;
}

/**
 * Toggle user role between passenger and driver
 * @returns {Promise<Object>} - Updated user profile with new role
 */
export async function toggleRole() {
  const response = await client.post('/api/users/me/toggle-role');
  return response.data;
}

