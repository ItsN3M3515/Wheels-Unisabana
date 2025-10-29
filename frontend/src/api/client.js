import axios from 'axios';

/**
 * Axios client configured for Wheels UniSabana API
 * - Includes credentials (JWT cookies)
 * - Automatically adds CSRF token to state-changing requests
 * - Base URL from environment variable
 */

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true, // Important: Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Get CSRF token from cookies
 */
function getCsrfToken() {
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Request interceptor: Add CSRF token to state-changing requests
 */
client.interceptors.request.use(
  (config) => {
    const csrfToken = getCsrfToken();
    
    // Add CSRF token to POST, PUT, PATCH, DELETE requests
    if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method.toUpperCase())) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor: Handle common errors
 */
client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        code: 'network_error',
        message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
        originalError: error,
      });
    }

    // Handle API errors with consistent format
    const apiError = {
      status: error.response.status,
      code: error.response.data?.code || 'unknown_error',
      message: error.response.data?.message || 'Ocurrió un error inesperado',
      details: error.response.data?.details || null,
      originalError: error,
    };

    return Promise.reject(apiError);
  }
);

export default client;

