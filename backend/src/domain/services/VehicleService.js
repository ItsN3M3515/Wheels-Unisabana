const MongoVehicleRepository = require('../../infrastructure/repositories/MongoVehicleRepository');
const CreateVehicleDto = require('../dtos/CreateVehicleDto');
const UpdateVehicleDto = require('../dtos/UpdateVehicleDto');
const VehicleResponseDto = require('../dtos/VehicleResponseDto');
const OneVehicleRuleError = require('../errors/OneVehicleRuleError');
const DuplicatePlateError = require('../errors/DuplicatePlateError');

/**
 * VehicleService - Business logic for vehicle operations
 * Enforces one-vehicle-per-driver business rule
 */
class VehicleService {
  constructor() {
    this.vehicleRepository = new MongoVehicleRepository();
  }

  /**
   * Create a new vehicle for a driver
   * @param {string} driverId - Driver ID from authentication
   * @param {Object} vehicleData - Vehicle creation data
   * @param {Object} files - Uploaded files (vehiclePhoto, soatPhoto)
   * @returns {Promise<VehicleResponseDto>} - Created vehicle response
   * @throws {OneVehicleRuleError} - If driver already has a vehicle
   * @throws {DuplicatePlateError} - If plate already exists
   */
  async createVehicle(driverId, vehicleData, files = {}) {
    try {
      // Check if driver already has a vehicle
      const hasVehicle = await this.vehicleRepository.driverHasVehicle(driverId);
      if (hasVehicle) {
        throw new OneVehicleRuleError(
          'Driver can only have one vehicle',
          'one_vehicle_rule',
          { driverId }
        );
      }

      // Check if plate already exists
      const plateExists = await this.vehicleRepository.plateExists(vehicleData.plate.toUpperCase());
      if (plateExists) {
        throw new DuplicatePlateError(
          'Vehicle plate already exists',
          'duplicate_plate',
          { plate: vehicleData.plate }
        );
      }

      // Handle image uploads
      const vehiclePhotoUrl = files.vehiclePhoto ? `/uploads/vehicles/${files.vehiclePhoto.filename}` : null;
      const soatPhotoUrl = files.soatPhoto ? `/uploads/vehicles/${files.soatPhoto.filename}` : null;

      // Create vehicle DTO
      const createVehicleDto = CreateVehicleDto.fromRequest(vehicleData, driverId);
      createVehicleDto.vehiclePhotoUrl = vehiclePhotoUrl;
      createVehicleDto.soatPhotoUrl = soatPhotoUrl;
      createVehicleDto.validate();

      // Create vehicle in repository
      const vehicle = await this.vehicleRepository.create(createVehicleDto.toObject());
      return VehicleResponseDto.fromEntity(vehicle);

    } catch (error) {
      // Cleanup uploaded files on error
      const fs = require('fs').promises;
      
      if (files.vehiclePhoto && files.vehiclePhoto.path) {
        try {
          await fs.unlink(files.vehiclePhoto.path);
        } catch (cleanupError) {
          console.error('Error cleaning up vehicle photo:', cleanupError);
        }
      }

      if (files.soatPhoto && files.soatPhoto.path) {
        try {
          await fs.unlink(files.soatPhoto.path);
        } catch (cleanupError) {
          console.error('Error cleaning up SOAT photo:', cleanupError);
        }
      }

      throw error;
    }
  }

  /**
   * Get vehicle by driver ID
   * @param {string} driverId - Driver ID
   * @returns {Promise<VehicleResponseDto|null>} - Vehicle response or null
   */
  async getVehicleByDriverId(driverId) {
    const vehicle = await this.vehicleRepository.findByDriverId(driverId);
    return vehicle ? VehicleResponseDto.fromEntity(vehicle) : null;
  }

  /**
   * Update vehicle by driver ID
   * @param {string} driverId - Driver ID
   * @param {Object} updates - Vehicle update data
   * @param {Object} files - Uploaded files (vehiclePhoto, soatPhoto)
   * @returns {Promise<VehicleResponseDto|null>} - Updated vehicle response or null
   */
  async updateVehicle(driverId, updates, files = {}) {
    try {
      // Check if vehicle exists
      const existingVehicle = await this.vehicleRepository.findByDriverId(driverId);
      if (!existingVehicle) {
        return null;
      }

      // Create update DTO
      const updateVehicleDto = UpdateVehicleDto.fromRequest(updates);
      updateVehicleDto.validate();

      const updateData = updateVehicleDto.toObject();

      // Handle image updates
      if (files.vehiclePhoto) {
        updateData.vehiclePhotoUrl = `/uploads/vehicles/${files.vehiclePhoto.filename}`;
        
        // Delete old photo if exists
        if (existingVehicle.vehiclePhotoUrl) {
          const fs = require('fs').promises;
          const path = require('path');
          const oldPath = path.join(__dirname, '../../../', existingVehicle.vehiclePhotoUrl);
          try {
            await fs.unlink(oldPath);
          } catch (err) {
            console.error('Error deleting old vehicle photo:', err);
          }
        }
      }

      if (files.soatPhoto) {
        updateData.soatPhotoUrl = `/uploads/vehicles/${files.soatPhoto.filename}`;
        
        // Delete old photo if exists
        if (existingVehicle.soatPhotoUrl) {
          const fs = require('fs').promises;
          const path = require('path');
          const oldPath = path.join(__dirname, '../../../', existingVehicle.soatPhotoUrl);
          try {
            await fs.unlink(oldPath);
          } catch (err) {
            console.error('Error deleting old SOAT photo:', err);
          }
        }
      }

      // Update vehicle
      const updatedVehicle = await this.vehicleRepository.updateByDriverId(driverId, updateData);
      return updatedVehicle ? VehicleResponseDto.fromEntity(updatedVehicle) : null;

    } catch (error) {
      // Cleanup uploaded files on error
      const fs = require('fs').promises;
      
      if (files.vehiclePhoto && files.vehiclePhoto.path) {
        try {
          await fs.unlink(files.vehiclePhoto.path);
        } catch (cleanupError) {
          console.error('Error cleaning up vehicle photo:', cleanupError);
        }
      }

      if (files.soatPhoto && files.soatPhoto.path) {
        try {
          await fs.unlink(files.soatPhoto.path);
        } catch (cleanupError) {
          console.error('Error cleaning up SOAT photo:', cleanupError);
        }
      }

      throw error;
    }
  }

  /**
   * Delete vehicle by driver ID
   * @param {string} driverId - Driver ID
   * @returns {Promise<boolean>} - True if deleted
   */
  async deleteVehicle(driverId) {
    try {
      // Get vehicle to cleanup images
      const vehicle = await this.vehicleRepository.findByDriverId(driverId);
      if (!vehicle) {
        return false;
      }

      // Delete vehicle
      const deleted = await this.vehicleRepository.deleteByDriverId(driverId);

      // Cleanup images after successful deletion
      if (deleted) {
        const fs = require('fs').promises;
        const path = require('path');

        if (vehicle.vehiclePhotoUrl) {
          const photoPath = path.join(__dirname, '../../../', vehicle.vehiclePhotoUrl);
          try {
            await fs.unlink(photoPath);
          } catch (err) {
            console.error('Error deleting vehicle photo:', err);
          }
        }

        if (vehicle.soatPhotoUrl) {
          const soatPath = path.join(__dirname, '../../../', vehicle.soatPhotoUrl);
          try {
            await fs.unlink(soatPath);
          } catch (err) {
            console.error('Error deleting SOAT photo:', err);
          }
        }
      }

      return deleted;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if driver has a vehicle
   * @param {string} driverId - Driver ID
   * @returns {Promise<boolean>} - True if driver has vehicle
   */
  async driverHasVehicle(driverId) {
    return await this.vehicleRepository.driverHasVehicle(driverId);
  }
}

module.exports = VehicleService;

