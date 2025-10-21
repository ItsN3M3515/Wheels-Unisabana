const rateLimit = require('express-rate-limit');

/**
 * Rate limiter para rutas públicas (registro)
 * 10 requests por minuto por IP
 */
const publicRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo 10 requests por IP por ventana
  message: {
    code: 'rate_limit_exceeded',
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true, // Incluir headers de rate limit en response
  legacyHeaders: false, // Deshabilitar headers X-RateLimit-*
  skip: (req) => {
    // Saltar rate limiting en desarrollo
    return process.env.NODE_ENV === 'development';
  }
});

/**
 * Rate limiter más permisivo para otras rutas
 * 100 requests por minuto por IP
 */
const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // máximo 100 requests por IP por ventana
  message: {
    code: 'rate_limit_exceeded',
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  publicRateLimiter,
  generalRateLimiter
};

