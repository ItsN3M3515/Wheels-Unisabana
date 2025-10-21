const express = require('express');
const router = express.Router();

/**
 * AUTH ROUTES - STUB
 * TODO: Implementar autenticación JWT completa
 * 
 * Endpoints planeados:
 * - POST /auth/login - Iniciar sesión
 * - POST /auth/logout - Cerrar sesión
 * - POST /auth/refresh - Renovar token
 */

// Stub para login
router.post('/login', (req, res) => {
  res.status(501).json({
    code: 'not_implemented',
    message: 'Login endpoint not implemented yet. Coming soon with Epic 2 - Authentication.'
  });
});

// Stub para logout
router.post('/logout', (req, res) => {
  res.status(501).json({
    code: 'not_implemented',
    message: 'Logout endpoint not implemented yet. Coming soon with Epic 2 - Authentication.'
  });
});

module.exports = router;

