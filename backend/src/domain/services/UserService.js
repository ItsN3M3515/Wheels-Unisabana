const MongoUserRepository = require('../../infrastructure/repositories/MongoUserRepository');
const CreateUserDto = require('../dtos/CreateUserDto');
const UserResponseDto = require('../dtos/UserResponseDto');
const DuplicateError = require('../errors/DuplicateError');
const bcrypt = require('bcrypt');

class UserService {
  constructor() {
    this.userRepository = new MongoUserRepository();
  }

  async registerUser(userData, file = null) {
    try {
      // Verificar duplicados antes de subir archivo
      const emailExists = await this.userRepository.exists('corporateEmail', userData.corporateEmail);
      if (emailExists) {
        throw new DuplicateError('Corporate email already exists', 'duplicate_email', {
          field: 'corporateEmail',
          value: userData.corporateEmail
        });
      }

      const universityIdExists = await this.userRepository.exists('universityId', userData.universityId);
      if (universityIdExists) {
        throw new DuplicateError('University ID already exists', 'duplicate_universityId', {
          field: 'universityId',
          value: userData.universityId
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 10);

      // Preparar datos del usuario
      const userDto = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        universityId: userData.universityId,
        corporateEmail: userData.corporateEmail,
        phone: userData.phone,
        password: passwordHash,
        role: userData.role,
        profilePhoto: file ? `/uploads/profiles/${file.filename}` : null
      };

      // Crear usuario
      const user = await this.userRepository.create(userDto);
      return UserResponseDto.fromEntity(user);

    } catch (error) {
      // Cleanup file on error if it was uploaded
      if (file && file.path) {
        const fs = require('fs').promises;
        try {
          await fs.unlink(file.path);
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      }
      throw error;
    }
  }

  async getUserById(id) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return UserResponseDto.fromEntity(user);
  }

  async getUserByEmail(email) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return null;
    }
    return UserResponseDto.fromEntity(user);
  }

  async updateUser(id, updates) {
    const user = await this.userRepository.update(id, updates);
    return UserResponseDto.fromEntity(user);
  }
}

module.exports = UserService;

