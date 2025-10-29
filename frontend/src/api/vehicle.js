import client from './client';

/**
 * Vehicle API endpoints
 */

/**
 * Register a new vehicle for the current driver
 * @param {Object} vehicleData - Vehicle data
 * @param {string} vehicleData.licensePlate - License plate
 * @param {string} vehicleData.brand - Vehicle brand
 * @param {string} vehicleData.model - Vehicle model  
 * @param {string} vehicleData.color - Vehicle color
 * @param {number} vehicleData.year - Vehicle year
 * @param {number} vehicleData.capacity - Passenger capacity
 * @param {File} [vehicleData.vehiclePhoto] - Vehicle photo
 * @param {File} [vehicleData.soatPhoto] - SOAT document photo
 * @returns {Promise<Object>} - Vehicle data
 */
export async function registerVehicle(vehicleData) {
  const formData = new FormData();
  
  formData.append('plate', vehicleData.licensePlate);
  formData.append('brand', vehicleData.brand);
  formData.append('model', vehicleData.model);
  formData.append('capacity', vehicleData.capacity.toString());
  
  if (vehicleData.vehiclePhoto) {
    formData.append('vehiclePhoto', vehicleData.vehiclePhoto);
  }
  
  if (vehicleData.soatPhoto) {
    formData.append('soatPhoto', vehicleData.soatPhoto);
  }

  const response = await client.post('/api/drivers/vehicle', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
}

/**
 * Get current driver's vehicle
 * @returns {Promise<Object>} - Vehicle data
 */
export async function getMyVehicle() {
  const response = await client.get('/api/drivers/vehicle');
  return response.data;
}

/**
 * Update current driver's vehicle
 * @param {Object} updates - Vehicle updates
 * @returns {Promise<Object>} - Updated vehicle data
 */
export async function updateMyVehicle(updates) {
  // If there are files, use FormData
  if (updates.vehiclePhoto || updates.soatPhoto) {
    const formData = new FormData();
    
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && updates[key] !== null) {
        if (key === 'vehiclePhoto' || key === 'soatPhoto') {
          formData.append(key, updates[key]);
        } else {
          formData.append(key, updates[key].toString());
        }
      }
    });

    const response = await client.patch('/api/drivers/vehicle', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Otherwise, send JSON
  const response = await client.patch('/api/drivers/vehicle', updates);
  return response.data;
}

/**
 * Delete current driver's vehicle
 * @returns {Promise<void>}
 */
export async function deleteMyVehicle() {
  await client.delete('/api/drivers/vehicle');
}

