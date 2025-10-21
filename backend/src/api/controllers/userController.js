const UserService = require('../../domain/services/UserService');

class UserController {
  constructor() {
    this.userService = new UserService();
  }

  /**
   * POST /users - Registrar nuevo usuario
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async register(req, res, next) {
    try {
      const { firstName, lastName, universityId, corporateEmail, phone, password, role } = req.body;
      const profilePhoto = req.file; // Archivo subido por Multer

      // Crear objeto con datos del usuario
      const userData = {
        firstName,
        lastName,
        universityId,
        corporateEmail,
        phone,
        password,
        role
      };

      // Registrar usuario usando el servicio
      const user = await this.userService.registerUser(userData, profilePhoto);

      // Respuesta exitosa
      res.status(201).json(user);

    } catch (error) {
      // Si hay archivo subido y ocurre error, limpiarlo
      if (req.file && req.file.path) {
        const fs = require('fs').promises;
        fs.unlink(req.file.path).catch(err => console.error('Error cleaning temp file:', err));
      }
      
      next(error);
    }
  }

  /**
   * GET /users/profile - Obtener perfil del usuario (stub para futuro)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getProfile(req, res, next) {
    // TODO: Implementar cuando se agregue autenticación
    res.status(501).json({
      code: 'not_implemented',
      message: 'Profile endpoint not implemented yet'
    });
  }

  /**
   * PUT /users/profile - Actualizar perfil del usuario (stub para futuro)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async updateProfile(req, res, next) {
    // TODO: Implementar cuando se agregue autenticación
    res.status(501).json({
      code: 'not_implemented',
      message: 'Profile update endpoint not implemented yet'
    });
  }
}

module.exports = UserController;

