import client from './client';

/**
 * Submit driver verification profile (multipart/form-data)
 * Expects fields: fullName, documentNumber, licenseNumber, licenseExpiresAt, soatNumber, soatExpiresAt
 * Files: govIdFront (required), govIdBack (optional), driverLicense (required), soat (required)
 */
export async function submitVerification(formData) {
  // formData should be a FormData instance
  const response = await client.post('/drivers/verification', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
}

/**
 * Get current driver's verification profile (non-PII)
 */
export async function getMyVerification() {
  const response = await client.get('/drivers/verification');
  return response.data;
}
