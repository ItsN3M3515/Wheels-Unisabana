# 🔐 Backend Implementation Backup
## Wheels-Unisabana - User Registration & Vehicle Management

**Fecha de backup:** 21 de Octubre, 2025  
**Estado:** User Story 1.1 (100% completo) + User Story 1.2 (40% completo)

---

## 📁 Estructura de Carpetas Completa

```
backend/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── User.js
│   │   │   └── Vehicle.js
│   │   ├── dtos/
│   │   │   ├── CreateUserDto.js
│   │   │   ├── UserResponseDto.js
│   │   │   ├── CreateVehicleDto.js
│   │   │   ├── UpdateVehicleDto.js
│   │   │   └── VehicleResponseDto.js
│   │   ├── errors/
│   │   │   ├── DomainError.js
│   │   │   ├── ValidationError.js
│   │   │   ├── DuplicateError.js
│   │   │   ├── OneVehicleRuleError.js
│   │   │   └── DuplicatePlateError.js
│   │   ├── repositories/
│   │   │   ├── UserRepository.js
│   │   │   └── VehicleRepository.js
│   │   └── services/
│   │       ├── UserService.js
│   │       └── VehicleService.js
│   ├── infrastructure/
│   │   ├── database/
│   │   │   ├── connection.js
│   │   │   └── models/
│   │   │       ├── UserModel.js
│   │   │       └── VehicleModel.js
│   │   ├── repositories/
│   │   │   ├── MongoUserRepository.js
│   │   │   └── MongoVehicleRepository.js
│   │   └── storage/
│   │       ├── StorageProvider.js
│   │       ├── LocalStorageProvider.js
│   │       └── UploadManager.js
│   ├── api/
│   │   ├── controllers/
│   │   │   └── userController.js
│   │   ├── middlewares/
│   │   │   ├── correlationId.js
│   │   │   ├── errorHandler.js
│   │   │   ├── rateLimiter.js
│   │   │   ├── swagger.js
│   │   │   ├── uploadMiddleware.js
│   │   │   └── validateRequest.js
│   │   ├── routes/
│   │   │   └── userRoutes.js
│   │   └── validation/
│   │       └── userSchemas.js
│   ├── app.js
│   └── index.js
├── docs/
│   ├── openapi.yaml
│   ├── postman_collection.json
│   └── README.md
├── tests/
│   ├── setup.js
│   ├── unit/
│   │   └── domain/
│   │       ├── User.test.js
│   │       ├── dtos/
│   │       │   ├── CreateUserDto.test.js
│   │       │   └── UserResponseDto.test.js
│   │       ├── errors/
│   │       │   └── DomainError.test.js
│   │       └── services/
│   │           └── UserService.test.js
│   └── integration/
│       └── api/
│           ├── users.test.js
│           └── upload.test.js
├── .env.example
├── .gitignore
├── package.json
└── jest.config.js
```

---

## 📦 package.json

```json
{
  "name": "wheels-unisabana-backend",
  "version": "1.0.0",
  "description": "Backend API para el sistema de carpooling de la Universidad de La Sabana",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration"
  },
  "keywords": [
    "carpooling",
    "university",
    "api",
    "nodejs",
    "express"
  ],
  "author": "Wheels-Unisabana Team",
  "license": "MIT",
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "joi": "^17.11.0",
    "js-yaml": "^4.1.0",
    "mongoose": "^8.0.3",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.0",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "nodemon": "^3.0.2",
    "supertest": "^6.3.4"
  }
}
```

---

## 🔧 .env.example

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/wheels-unisabana?retryWrites=true&w=majority

# Server Configuration
NODE_ENV=development
PORT=3000

# Frontend Configuration
FRONTEND_URL=http://localhost:5173

# Upload Configuration
MAX_PROFILE_PHOTO_MB=5
UPLOAD_DIR=uploads/profiles
```

---

## 🚫 .gitignore

```gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# Test files
tests/
test-*.js
run-tests.js
setup-docs.js
check-docs.js
install-docs.js

# Upload directories
uploads/
public/uploads/

# Database files
*.db
*.sqlite
*.sqlite3

# Build directories
build/
dist/

# Editor directories and files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Temporary folders
tmp/
temp/

# ESLint cache
.eslintcache

# Prettier cache
.prettiercache

# Temporary test scripts
debug-endpoint.js
test-blueprint.js
test-contracts.js
test-docs-final.js
test-docs-robust.js
test-docs.js
test-endpoint.js
test-server.js
test-simple.js
test-upload.js
test-vehicle-domain.js
```

---

## 📝 Archivos Fuente Completos

### 1. Domain Layer

#### `src/domain/entities/User.js`

```javascript
class User {
  constructor({
    id,
    firstName,
    lastName,
    universityId,
    corporateEmail,
    phone,
    password,
    role,
    profilePhoto = null,
    createdAt,
    updatedAt
  }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.universityId = universityId;
    this.corporateEmail = corporateEmail;
    this.phone = phone;
    this.password = password;
    this.role = role;
    this.profilePhoto = profilePhoto;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromDocument(doc) {
    return new User({
      id: doc._id.toString(),
      firstName: doc.firstName,
      lastName: doc.lastName,
      universityId: doc.universityId,
      corporateEmail: doc.corporateEmail,
      phone: doc.phone,
      password: doc.password,
      role: doc.role,
      profilePhoto: doc.profilePhoto,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    });
  }

  isDriver() {
    return this.role === 'driver';
  }

  isPassenger() {
    return this.role === 'passenger';
  }
}

module.exports = User;
```

#### `src/domain/entities/Vehicle.js`

```javascript
class Vehicle {
  constructor({
    id,
    driverId,
    plate,
    brand,
    model,
    capacity,
    vehiclePhotoUrl = null,
    soatPhotoUrl = null,
    createdAt,
    updatedAt
  }) {
    this.id = id;
    this.driverId = driverId;
    this.plate = plate;
    this.brand = brand;
    this.model = model;
    this.capacity = capacity;
    this.vehiclePhotoUrl = vehiclePhotoUrl;
    this.soatPhotoUrl = soatPhotoUrl;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromDocument(doc) {
    return new Vehicle({
      id: doc._id.toString(),
      driverId: doc.driverId.toString(),
      plate: doc.plate,
      brand: doc.brand,
      model: doc.model,
      capacity: doc.capacity,
      vehiclePhotoUrl: doc.vehiclePhotoUrl,
      soatPhotoUrl: doc.soatPhotoUrl,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    });
  }
}

module.exports = Vehicle;
```

#### `src/domain/errors/DomainError.js`

```javascript
class DomainError extends Error {
  constructor(message, code, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
  }
}

module.exports = DomainError;
```

#### `src/domain/errors/ValidationError.js`

```javascript
const DomainError = require('./DomainError');

class ValidationError extends DomainError {
  constructor(message, code = 'invalid_schema', details = []) {
    super(message, code, 400);
    this.details = details;
  }
}

module.exports = ValidationError;
```

#### `src/domain/errors/DuplicateError.js`

```javascript
const DomainError = require('./DomainError');

class DuplicateError extends DomainError {
  constructor(message, code, metadata = {}) {
    super(message, code, 409);
    this.field = metadata.field;
    this.value = metadata.value;
  }
}

module.exports = DuplicateError;
```

#### `src/domain/errors/OneVehicleRuleError.js`

```javascript
const DomainError = require('./DomainError');

class OneVehicleRuleError extends DomainError {
  constructor(message = 'Driver already has a vehicle', code = 'one_vehicle_rule', driverId) {
    super(message, code, 409);
    this.driverId = driverId;
  }
}

module.exports = OneVehicleRuleError;
```

#### `src/domain/errors/DuplicatePlateError.js`

```javascript
const DomainError = require('./DomainError');

class DuplicatePlateError extends DomainError {
  constructor(message = 'Vehicle plate already exists', code = 'duplicate_plate', plate) {
    super(message, code, 409);
    this.plate = plate;
  }
}

module.exports = DuplicatePlateError;
```

#### `src/domain/dtos/CreateUserDto.js`

```javascript
class CreateUserDto {
  constructor({
    firstName,
    lastName,
    universityId,
    corporateEmail,
    phone,
    password,
    role,
    profilePhoto = null
  }) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.universityId = universityId;
    this.corporateEmail = corporateEmail;
    this.phone = phone;
    this.password = password;
    this.role = role;
    this.profilePhoto = profilePhoto;
  }

  static fromRequest(body) {
    return new CreateUserDto({
      firstName: body.firstName,
      lastName: body.lastName,
      universityId: body.universityId,
      corporateEmail: body.corporateEmail,
      phone: body.phone,
      password: body.password,
      role: body.role,
      profilePhoto: body.profilePhoto || null
    });
  }
}

module.exports = CreateUserDto;
```

#### `src/domain/dtos/UserResponseDto.js`

```javascript
class UserResponseDto {
  constructor({
    id,
    firstName,
    lastName,
    universityId,
    corporateEmail,
    phone,
    role,
    profilePhotoUrl = null,
    createdAt,
    updatedAt
  }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.universityId = universityId;
    this.corporateEmail = corporateEmail;
    this.phone = phone;
    this.role = role;
    this.profilePhotoUrl = profilePhotoUrl;
    
    if (role === 'driver') {
      this.driver = { hasVehicle: false };
    }
    
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromEntity(user) {
    return new UserResponseDto({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      universityId: user.universityId,
      corporateEmail: user.corporateEmail,
      phone: user.phone,
      role: user.role,
      profilePhotoUrl: user.profilePhoto,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  }

  static fromDocument(doc) {
    return new UserResponseDto({
      id: doc._id.toString(),
      firstName: doc.firstName,
      lastName: doc.lastName,
      universityId: doc.universityId,
      corporateEmail: doc.corporateEmail,
      phone: doc.phone,
      role: doc.role,
      profilePhotoUrl: doc.profilePhoto,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    });
  }
}

module.exports = UserResponseDto;
```

#### `src/domain/dtos/CreateVehicleDto.js`

```javascript
class CreateVehicleDto {
  constructor({
    driverId,
    plate,
    brand,
    model,
    capacity,
    vehiclePhotoUrl = null,
    soatPhotoUrl = null
  }) {
    this.driverId = driverId;
    this.plate = plate;
    this.brand = brand;
    this.model = model;
    this.capacity = capacity;
    this.vehiclePhotoUrl = vehiclePhotoUrl;
    this.soatPhotoUrl = soatPhotoUrl;
  }

  static fromRequest(body) {
    return new CreateVehicleDto({
      driverId: body.driverId,
      plate: body.plate,
      brand: body.brand,
      model: body.model,
      capacity: body.capacity,
      vehiclePhotoUrl: body.vehiclePhotoUrl || null,
      soatPhotoUrl: body.soatPhotoUrl || null
    });
  }
}

module.exports = CreateVehicleDto;
```

#### `src/domain/dtos/UpdateVehicleDto.js`

```javascript
class UpdateVehicleDto {
  constructor({
    brand,
    model,
    capacity,
    vehiclePhotoUrl,
    soatPhotoUrl
  }) {
    this.brand = brand;
    this.model = model;
    this.capacity = capacity;
    this.vehiclePhotoUrl = vehiclePhotoUrl;
    this.soatPhotoUrl = soatPhotoUrl;
  }

  static fromRequest(body) {
    return new UpdateVehicleDto({
      brand: body.brand,
      model: body.model,
      capacity: body.capacity,
      vehiclePhotoUrl: body.vehiclePhotoUrl,
      soatPhotoUrl: body.soatPhotoUrl
    });
  }
}

module.exports = UpdateVehicleDto;
```

#### `src/domain/dtos/VehicleResponseDto.js`

```javascript
class VehicleResponseDto {
  constructor({
    id,
    driverId,
    plate,
    brand,
    model,
    capacity,
    vehiclePhotoUrl,
    soatPhotoUrl,
    createdAt,
    updatedAt
  }) {
    this.id = id;
    this.driverId = driverId;
    this.plate = plate;
    this.brand = brand;
    this.model = model;
    this.capacity = capacity;
    this.vehiclePhotoUrl = vehiclePhotoUrl;
    this.soatPhotoUrl = soatPhotoUrl;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromEntity(vehicle) {
    return new VehicleResponseDto({
      id: vehicle.id,
      driverId: vehicle.driverId,
      plate: vehicle.plate,
      brand: vehicle.brand,
      model: vehicle.model,
      capacity: vehicle.capacity,
      vehiclePhotoUrl: vehicle.vehiclePhotoUrl,
      soatPhotoUrl: vehicle.soatPhotoUrl,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt
    });
  }

  static fromDocument(doc) {
    return new VehicleResponseDto({
      id: doc._id.toString(),
      driverId: doc.driverId.toString(),
      plate: doc.plate,
      brand: doc.brand,
      model: doc.model,
      capacity: doc.capacity,
      vehiclePhotoUrl: doc.vehiclePhotoUrl,
      soatPhotoUrl: doc.soatPhotoUrl,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    });
  }
}

module.exports = VehicleResponseDto;
```

#### `src/domain/repositories/UserRepository.js`

```javascript
class UserRepository {
  async create(userData) {
    throw new Error('Method not implemented');
  }

  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByEmail(email) {
    throw new Error('Method not implemented');
  }

  async findByUniversityId(universityId) {
    throw new Error('Method not implemented');
  }

  async update(id, updates) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async exists(field, value) {
    throw new Error('Method not implemented');
  }
}

module.exports = UserRepository;
```

#### `src/domain/repositories/VehicleRepository.js`

```javascript
class VehicleRepository {
  async create(vehicleData) {
    throw new Error('Method not implemented');
  }

  async findByDriverId(driverId) {
    throw new Error('Method not implemented');
  }

  async findByPlate(plate) {
    throw new Error('Method not implemented');
  }

  async update(id, updates) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async exists(field, value) {
    throw new Error('Method not implemented');
  }
}

module.exports = VehicleRepository;
```

#### `src/domain/services/UserService.js`

```javascript
const MongoUserRepository = require('../../infrastructure/repositories/MongoUserRepository');
const CreateUserDto = require('../dtos/CreateUserDto');
const UserResponseDto = require('../dtos/UserResponseDto');
const DuplicateError = require('../errors/DuplicateError');
const { getUploadManager } = require('../../api/middlewares/uploadMiddleware');

class UserService {
  constructor() {
    this.userRepository = new MongoUserRepository();
  }

  async registerUser(userData, file = null) {
    const uploadManager = getUploadManager();
    let uploadedFileUrl = null;
    let userId = null;

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

      // Subir archivo si existe
      if (file) {
        const tempUserId = `temp-${Date.now()}`;
        uploadedFileUrl = await uploadManager.uploadFile(file, tempUserId);
      }

      // Crear usuario
      const userDto = CreateUserDto.fromRequest({
        ...userData,
        profilePhoto: uploadedFileUrl
      });

      const user = await this.userRepository.create(userDto);
      userId = user.id;

      // Si hay archivo temporal, renombrarlo con el ID real
      if (uploadedFileUrl && uploadedFileUrl.includes('temp-')) {
        const newUrl = uploadedFileUrl.replace(/temp-\d+/, userId);
        await uploadManager.storageProvider.renameFile?.(uploadedFileUrl, newUrl);
        user.profilePhoto = newUrl;
      }

      return UserResponseDto.fromEntity(user);
    } catch (error) {
      // Cleanup en caso de error
      if (uploadedFileUrl) {
        await uploadManager.cleanupUserFiles(userId || 'temp').catch(console.error);
      }
      if (file && file.path) {
        await uploadManager.storageProvider.deleteFile(file.path).catch(console.error);
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

  async updateUser(id, updates) {
    const user = await this.userRepository.update(id, updates);
    return UserResponseDto.fromEntity(user);
  }
}

module.exports = UserService;
```

#### `src/domain/services/VehicleService.js`

```javascript
const MongoVehicleRepository = require('../../infrastructure/repositories/MongoVehicleRepository');
const CreateVehicleDto = require('../dtos/CreateVehicleDto');
const VehicleResponseDto = require('../dtos/VehicleResponseDto');
const OneVehicleRuleError = require('../errors/OneVehicleRuleError');
const DuplicatePlateError = require('../errors/DuplicatePlateError');
const { getUploadManager } = require('../../api/middlewares/uploadMiddleware');

class VehicleService {
  constructor() {
    this.vehicleRepository = new MongoVehicleRepository();
    this.uploadManager = getUploadManager();
  }

  async createVehicle(driverId, vehicleData, vehicleFile = null, soatFile = null) {
    let vehiclePhotoUrl = null;
    let soatPhotoUrl = null;

    try {
      // Verificar regla de un vehículo por conductor
      const existingVehicle = await this.vehicleRepository.findByDriverId(driverId);
      if (existingVehicle) {
        throw new OneVehicleRuleError(null, null, driverId);
      }

      // Verificar placa duplicada
      const plateExists = await this.vehicleRepository.exists('plate', vehicleData.plate);
      if (plateExists) {
        throw new DuplicatePlateError(null, null, vehicleData.plate);
      }

      // Subir imágenes si existen
      if (vehicleFile) {
        vehiclePhotoUrl = await this.uploadManager.uploadFile(vehicleFile, `vehicle-${driverId}`);
      }
      if (soatFile) {
        soatPhotoUrl = await this.uploadManager.uploadFile(soatFile, `soat-${driverId}`);
      }

      // Crear vehículo
      const vehicleDto = CreateVehicleDto.fromRequest({
        ...vehicleData,
        driverId,
        vehiclePhotoUrl,
        soatPhotoUrl
      });

      const vehicle = await this.vehicleRepository.create(vehicleDto);
      return VehicleResponseDto.fromEntity(vehicle);
    } catch (error) {
      // Cleanup en caso de error
      if (vehiclePhotoUrl) {
        await this.uploadManager.deleteFile(vehiclePhotoUrl).catch(console.error);
      }
      if (soatPhotoUrl) {
        await this.uploadManager.deleteFile(soatPhotoUrl).catch(console.error);
      }
      throw error;
    }
  }

  async getVehicleByDriverId(driverId) {
    const vehicle = await this.vehicleRepository.findByDriverId(driverId);
    if (!vehicle) {
      return null;
    }
    return VehicleResponseDto.fromEntity(vehicle);
  }

  async updateVehicle(id, updates, vehicleFile = null, soatFile = null) {
    const vehicle = await this.vehicleRepository.findByDriverId(updates.driverId);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    let vehiclePhotoUrl = vehicle.vehiclePhotoUrl;
    let soatPhotoUrl = vehicle.soatPhotoUrl;

    try {
      // Reemplazar imágenes si se proveen nuevas
      if (vehicleFile) {
        if (vehiclePhotoUrl) {
          await this.uploadManager.deleteFile(vehiclePhotoUrl).catch(console.error);
        }
        vehiclePhotoUrl = await this.uploadManager.uploadFile(vehicleFile, `vehicle-${updates.driverId}`);
      }

      if (soatFile) {
        if (soatPhotoUrl) {
          await this.uploadManager.deleteFile(soatPhotoUrl).catch(console.error);
        }
        soatPhotoUrl = await this.uploadManager.uploadFile(soatFile, `soat-${updates.driverId}`);
      }

      const updatedVehicle = await this.vehicleRepository.update(id, {
        ...updates,
        vehiclePhotoUrl,
        soatPhotoUrl
      });

      return VehicleResponseDto.fromEntity(updatedVehicle);
    } catch (error) {
      throw error;
    }
  }

  async deleteVehicle(id) {
    await this.vehicleRepository.delete(id);
  }
}

module.exports = VehicleService;
```

---

### 2. Infrastructure Layer

#### `src/infrastructure/database/connection.js`

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log('✓ Mongoose connected to DB');
    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
    console.log(`✓ Database: ${conn.connection.name}`);

    // Verificar y crear índices
    try {
      await conn.connection.db.collection('users').createIndexes([
        { key: { corporateEmail: 1 }, unique: true, name: 'corporateEmail_unique' },
        { key: { universityId: 1 }, unique: true, name: 'universityId_unique' }
      ]);

      await conn.connection.db.collection('vehicles').createIndexes([
        { key: { plate: 1 }, unique: true, name: 'plate_unique' },
        { key: { driverId: 1 }, unique: true, name: 'driverId_unique' }
      ]);

      console.log('✓ Indexes verified and created');
    } catch (indexError) {
      console.warn('⚠️  Index creation warning:', indexError.message);
    }

    return conn;
  } catch (error) {
    console.error('✗ MongoDB connection error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

module.exports = connectDB;
```

#### `src/infrastructure/database/models/UserModel.js`

```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters'],
    maxlength: [60, 'First name cannot exceed 60 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters'],
    maxlength: [60, 'Last name cannot exceed 60 characters']
  },
  universityId: {
    type: String,
    required: [true, 'University ID is required'],
    unique: true,
    trim: true
  },
  corporateEmail: {
    type: String,
    required: [true, 'Corporate email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: {
      values: ['passenger', 'driver'],
      message: 'Role must be either passenger or driver'
    }
  },
  profilePhoto: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  strict: true,
  strictQuery: false
});

// Pre-save middleware para normalización
userSchema.pre('save', function(next) {
  if (this.corporateEmail) {
    this.corporateEmail = this.corporateEmail.toLowerCase();
  }
  if (this.phone && !this.phone.startsWith('+')) {
    this.phone = '+' + this.phone;
  }
  next();
});

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;
```

#### `src/infrastructure/database/models/VehicleModel.js`

```javascript
const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Driver ID is required'],
    unique: true,
    index: true
  },
  plate: {
    type: String,
    required: [true, 'Plate is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z]{3}\d{3}$/, 'Plate must be in format ABC123'],
    index: true
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true,
    minlength: [2, 'Brand must be at least 2 characters'],
    maxlength: [60, 'Brand cannot exceed 60 characters']
  },
  model: {
    type: String,
    required: [true, 'Model is required'],
    trim: true,
    minlength: [1, 'Model must be at least 1 character'],
    maxlength: [60, 'Model cannot exceed 60 characters']
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1']
  },
  vehiclePhotoUrl: {
    type: String,
    default: null
  },
  soatPhotoUrl: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  strict: true,
  strictQuery: false
});

const VehicleModel = mongoose.model('Vehicle', vehicleSchema);

module.exports = VehicleModel;
```

#### `src/infrastructure/repositories/MongoUserRepository.js`

```javascript
const UserRepository = require('../../domain/repositories/UserRepository');
const UserModel = require('../database/models/UserModel');
const User = require('../../domain/entities/User');
const DuplicateError = require('../../domain/errors/DuplicateError');
const ValidationError = require('../../domain/errors/ValidationError');

class MongoUserRepository extends UserRepository {
  async create(userData) {
    try {
      const user = new UserModel(userData);
      const savedUser = await user.save();
      return User.fromDocument(savedUser);
    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        const code = field === 'corporateEmail' ? 'duplicate_email' : 'duplicate_universityId';
        throw new DuplicateError(
          `${field} already exists`,
          code,
          { field, value: error.keyValue[field] }
        );
      }

      if (error.name === 'ValidationError') {
        const details = Object.keys(error.errors).map(key => ({
          field: key,
          issue: error.errors[key].message
        }));
        throw new ValidationError('Validation failed', 'invalid_schema', details);
      }

      throw error;
    }
  }

  async findById(id) {
    const doc = await UserModel.findById(id);
    return doc ? User.fromDocument(doc) : null;
  }

  async findByEmail(email) {
    const doc = await UserModel.findOne({ corporateEmail: email.toLowerCase() });
    return doc ? User.fromDocument(doc) : null;
  }

  async findByUniversityId(universityId) {
    const doc = await UserModel.findOne({ universityId });
    return doc ? User.fromDocument(doc) : null;
  }

  async exists(field, value) {
    const query = {};
    query[field] = field === 'corporateEmail' ? value.toLowerCase() : value;
    const count = await UserModel.countDocuments(query);
    return count > 0;
  }

  async update(id, updates) {
    const doc = await UserModel.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!doc) {
      throw new Error('User not found');
    }
    return User.fromDocument(doc);
  }

  async delete(id) {
    await UserModel.findByIdAndDelete(id);
  }
}

module.exports = MongoUserRepository;
```

#### `src/infrastructure/repositories/MongoVehicleRepository.js`

```javascript
const VehicleRepository = require('../../domain/repositories/VehicleRepository');
const VehicleModel = require('../database/models/VehicleModel');
const Vehicle = require('../../domain/entities/Vehicle');
const OneVehicleRuleError = require('../../domain/errors/OneVehicleRuleError');
const DuplicatePlateError = require('../../domain/errors/DuplicatePlateError');
const ValidationError = require('../../domain/errors/ValidationError');

class MongoVehicleRepository extends VehicleRepository {
  async create(vehicleData) {
    try {
      const vehicle = new VehicleModel(vehicleData);
      const savedVehicle = await vehicle.save();
      return Vehicle.fromDocument(savedVehicle);
    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        if (field === 'driverId') {
          throw new OneVehicleRuleError(null, null, error.keyValue[field]);
        }
        if (field === 'plate') {
          throw new DuplicatePlateError(null, null, error.keyValue[field]);
        }
      }

      if (error.name === 'ValidationError') {
        const details = Object.keys(error.errors).map(key => ({
          field: key,
          issue: error.errors[key].message
        }));
        throw new ValidationError('Validation failed', 'invalid_schema', details);
      }

      throw error;
    }
  }

  async findByDriverId(driverId) {
    const doc = await VehicleModel.findOne({ driverId });
    return doc ? Vehicle.fromDocument(doc) : null;
  }

  async findByPlate(plate) {
    const doc = await VehicleModel.findOne({ plate: plate.toUpperCase() });
    return doc ? Vehicle.fromDocument(doc) : null;
  }

  async exists(field, value) {
    const query = {};
    query[field] = field === 'plate' ? value.toUpperCase() : value;
    const count = await VehicleModel.countDocuments(query);
    return count > 0;
  }

  async update(id, updates) {
    const doc = await VehicleModel.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!doc) {
      throw new Error('Vehicle not found');
    }
    return Vehicle.fromDocument(doc);
  }

  async delete(id) {
    await VehicleModel.findByIdAndDelete(id);
  }
}

module.exports = MongoVehicleRepository;
```

#### `src/infrastructure/storage/StorageProvider.js`

```javascript
class StorageProvider {
  async uploadFile(file, destinationPath) {
    throw new Error('Method not implemented');
  }

  async deleteFile(filePath) {
    throw new Error('Method not implemented');
  }

  async getFileUrl(filePath) {
    throw new Error('Method not implemented');
  }

  async cleanupUserFiles(userId) {
    throw new Error('Method not implemented');
  }
}

module.exports = StorageProvider;
```

#### `src/infrastructure/storage/LocalStorageProvider.js`

```javascript
const StorageProvider = require('./StorageProvider');
const path = require('path');
const fs = require('fs').promises;

class LocalStorageProvider extends StorageProvider {
  constructor(baseDir = process.env.UPLOAD_DIR || 'uploads/profiles') {
    super();
    this.baseDir = path.resolve(baseDir);
    fs.mkdir(this.baseDir, { recursive: true }).catch(console.error);
  }

  async uploadFile(file, userId) {
    const ext = path.extname(file.originalname);
    const filename = `${userId}-${Date.now()}${ext}`;
    const filePath = path.join(this.baseDir, filename);
    
    await fs.rename(file.path, filePath);
    
    return `/uploads/profiles/${filename}`;
  }

  async deleteFile(filePath) {
    try {
      const fullPath = path.join(this.baseDir, path.basename(filePath));
      const exists = await fs.access(fullPath).then(() => true).catch(() => false);
      if (exists) {
        await fs.unlink(fullPath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  async getFileUrl(filePath) {
    return filePath;
  }

  async cleanupUserFiles(userId) {
    try {
      const files = await fs.readdir(this.baseDir);
      const userFiles = files.filter(f => f.startsWith(`${userId}-`));
      
      for (const file of userFiles) {
        await this.deleteFile(path.join(this.baseDir, file));
      }
    } catch (error) {
      console.error('Error cleaning up user files:', error);
    }
  }
}

module.exports = LocalStorageProvider;
```

#### `src/infrastructure/storage/UploadManager.js`

```javascript
const LocalStorageProvider = require('./LocalStorageProvider');

class UploadManager {
  constructor(storageProvider = new LocalStorageProvider()) {
    this.storageProvider = storageProvider;
  }

  async uploadFile(file, userId) {
    return this.storageProvider.uploadFile(file, userId);
  }

  async deleteFile(filePath) {
    return this.storageProvider.deleteFile(filePath);
  }

  async cleanupUserFiles(userId) {
    return this.storageProvider.cleanupUserFiles(userId);
  }
}

module.exports = UploadManager;
```

---

### 3. API Layer

#### `src/api/controllers/userController.js`

```javascript
const UserService = require('../../domain/services/UserService');
const UserResponseDto = require('../../domain/dtos/UserResponseDto');

class UserController {
  constructor() {
    this.userService = new UserService();
  }

  async register(req, res, next) {
    try {
      const userDto = await this.userService.registerUser(req.body, req.file);
      res.status(201).json(userDto);
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const user = await this.userService.getUserById(req.userId);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const user = await this.userService.updateUser(req.userId, req.body);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
```

#### `src/api/middlewares/correlationId.js`

```javascript
const { v4: uuidv4 } = require('uuid');

const correlationId = (req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || uuidv4();
  res.setHeader('X-Correlation-ID', req.correlationId);
  next();
};

module.exports = correlationId;
```

#### `src/api/middlewares/errorHandler.js`

```javascript
const errorHandler = (err, req, res, next) => {
  console.error('Error caught by errorHandler:', {
    message: err.message,
    code: err.code,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  // DomainError y subclases
  if (err.code && err.statusCode) {
    return res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      ...(err.details && { details: err.details }),
      ...(err.field && { field: err.field }),
      ...(err.value && { value: err.value })
    });
  }

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      code: 'payload_too_large',
      message: 'File size exceeds the maximum allowed limit',
      correlationId: req.correlationId
    });
  }

  // Multer file type error
  if (err.message === 'Unsupported file type. Only JPEG, PNG, and WebP are allowed.') {
    return res.status(400).json({
      code: 'invalid_file_type',
      message: 'Unsupported MIME type',
      correlationId: req.correlationId
    });
  }

  // Default error
  res.status(500).json({
    code: 'internal_server_error',
    message: 'Internal server error',
    correlationId: req.correlationId
  });
};

module.exports = errorHandler;
```

#### `src/api/middlewares/rateLimiter.js`

```javascript
const rateLimit = require('express-rate-limit');

const publicRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    code: 'rate_limit_exceeded',
    message: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    code: 'rate_limit_exceeded',
    message: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { publicRateLimiter, authRateLimiter };
```

#### `src/api/middlewares/swagger.js`

```javascript
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

function loadOpenAPISpec() {
  try {
    const yamlPath = path.join(__dirname, '../../docs/openapi.yaml');
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    const spec = yaml.load(yamlContent);
    
    console.log('✅ OpenAPI YAML loaded successfully');
    
    if (process.env.API_BASE_URL) {
      spec.servers = [{ url: process.env.API_BASE_URL }];
    }
    
    return spec;
  } catch (error) {
    console.warn('⚠️  Could not load openapi.yaml, using fallback configuration');
    console.warn('Error:', error.message);
    
    // Fallback configuration
    return {
      openapi: '3.0.3',
      info: {
        title: 'Wheels-Unisabana API',
        version: '1.0.0',
        description: 'API para el sistema de carpooling de la Universidad de La Sabana',
        contact: {
          name: 'Wheels-Unisabana Team',
          email: 'support@wheels-unisabana.edu.co'
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT'
        }
      },
      servers: [
        {
          url: process.env.API_BASE_URL || 'http://localhost:3000',
          description: 'Development server'
        }
      ],
      tags: [
        { name: 'System', description: 'System health and status endpoints' },
        { name: 'Users', description: 'User registration and profile management' }
      ],
      paths: {
        '/health': {
          get: {
            summary: 'Health check',
            tags: ['System'],
            responses: {
              '200': {
                description: 'Service is healthy',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'ok' },
                        timestamp: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        '/api/users': {
          post: {
            summary: 'Register a new user',
            tags: ['Users'],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/CreateUserRequest' },
                  examples: {
                    passenger: {
                      summary: 'Passenger registration',
                      value: {
                        firstName: 'Juan',
                        lastName: 'Pérez',
                        universityId: '202420001',
                        corporateEmail: 'juan.perez@unisabana.edu.co',
                        phone: '+573001234567',
                        password: 'SecurePass123!',
                        role: 'passenger'
                      }
                    },
                    driver: {
                      summary: 'Driver registration',
                      value: {
                        firstName: 'María',
                        lastName: 'García',
                        universityId: '202420002',
                        corporateEmail: 'maria.garcia@unisabana.edu.co',
                        phone: '+573007654321',
                        password: 'DriverPass123!',
                        role: 'driver'
                      }
                    }
                  }
                },
                'multipart/form-data': {
                  schema: {
                    type: 'object',
                    properties: {
                      firstName: { type: 'string' },
                      lastName: { type: 'string' },
                      universityId: { type: 'string' },
                      corporateEmail: { type: 'string' },
                      phone: { type: 'string' },
                      password: { type: 'string' },
                      role: { type: 'string', enum: ['passenger', 'driver'] },
                      profilePhoto: { type: 'string', format: 'binary' }
                    }
                  },
                  example: {
                    firstName: 'Juan',
                    lastName: 'Pérez',
                    universityId: '202420001',
                    corporateEmail: 'juan.perez@unisabana.edu.co',
                    phone: '+573001234567',
                    password: 'SecurePass123!',
                    role: 'passenger'
                  }
                }
              }
            },
            responses: {
              '201': {
                description: 'User created successfully',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/UserResponse' }
                  }
                }
              },
              '400': {
                description: 'Validation error',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/ValidationError' },
                    examples: {
                      invalidSchema: {
                        summary: 'Invalid schema',
                        value: {
                          code: 'invalid_schema',
                          message: 'Validation failed',
                          details: [
                            { field: 'corporateEmail', issue: 'must be a corporate domain' },
                            { field: 'firstName', issue: 'min length 2' }
                          ]
                        }
                      }
                    }
                  }
                }
              },
              '409': {
                description: 'Duplicate user',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/DuplicateEmailError' },
                    examples: {
                      duplicateEmail: {
                        summary: 'Duplicate email',
                        value: {
                          code: 'duplicate_email',
                          message: 'Corporate email already exists'
                        }
                      },
                      duplicateUniversityId: {
                        summary: 'Duplicate university ID',
                        value: {
                          code: 'duplicate_universityId',
                          message: 'University ID already exists'
                        }
                      }
                    }
                  }
                }
              },
              '413': {
                description: 'File too large',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        code: { type: 'string', example: 'payload_too_large' },
                        message: { type: 'string', example: 'File exceeds limit' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      components: {
        schemas: {
          CreateUserRequest: {
            type: 'object',
            required: ['firstName', 'lastName', 'universityId', 'corporateEmail', 'phone', 'password', 'role'],
            properties: {
              firstName: { type: 'string', minLength: 2, maxLength: 60 },
              lastName: { type: 'string', minLength: 2, maxLength: 60 },
              universityId: { type: 'string', pattern: '^\\d{9}$' },
              corporateEmail: { type: 'string', format: 'email', pattern: '@unisabana\\.edu\\.co$' },
              phone: { type: 'string', pattern: '^\\+57[0-9]{10}$' },
              password: { type: 'string', minLength: 8 },
              role: { type: 'string', enum: ['passenger', 'driver'] }
            }
          },
          UserResponse: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              universityId: { type: 'string' },
              corporateEmail: { type: 'string' },
              phone: { type: 'string' },
              role: { type: 'string' },
              profilePhotoUrl: { type: 'string', nullable: true },
              driver: {
                type: 'object',
                properties: {
                  hasVehicle: { type: 'boolean' }
                }
              },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          },
          ValidationError: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string' },
                    issue: { type: 'string' }
                  }
                }
              }
            }
          },
          DuplicateEmailError: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' }
            }
          },
          DuplicateUniversityIdError: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' }
            }
          }
        },
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    };
  }
}

const swaggerOptions = {
  definition: loadOpenAPISpec(),
  apis: []
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

const serveSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));
  app.get('/docs', (req, res) => res.redirect('/api-docs'));
};

module.exports = { serveSwagger, swaggerSpec };
```

#### `src/api/middlewares/uploadMiddleware.js`

```javascript
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const UploadManager = require('../../infrastructure/storage/UploadManager');

const uploadDir = process.env.UPLOAD_DIR || 'uploads/profiles';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'temp-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Only JPEG, PNG, and WebP are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: (process.env.MAX_PROFILE_PHOTO_MB || 5) * 1024 * 1024
  }
});

const uploadManager = new UploadManager();

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        code: 'payload_too_large',
        message: 'File size exceeds the maximum allowed limit'
      });
    }
    return res.status(400).json({
      code: 'upload_error',
      message: err.message
    });
  }
  
  if (err) {
    return res.status(400).json({
      code: 'invalid_file_type',
      message: err.message
    });
  }
  
  next();
};

const cleanupOnError = async (req, res, next) => {
  if (req.file && req.file.path) {
    const originalSend = res.send;
    res.send = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        return originalSend.call(this, data);
      }
      
      uploadManager.storageProvider.deleteFile(req.file.path).catch(console.error);
      return originalSend.call(this, data);
    };
  }
  next();
};

const getUploadManager = () => uploadManager;

module.exports = { upload, handleUploadError, cleanupOnError, getUploadManager };
```

#### `src/api/middlewares/validateRequest.js`

```javascript
const ValidationError = require('../../domain/errors/ValidationError');

const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        issue: detail.message
      }));

      const validationError = new ValidationError(
        'Validation failed',
        'invalid_schema',
        details
      );

      return next(validationError);
    }

    req[source] = value;
    next();
  };
};

module.exports = validateRequest;
```

#### `src/api/routes/userRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const validateRequest = require('../middlewares/validateRequest');
const { createUserSchema } = require('../validation/userSchemas');
const { publicRateLimiter } = require('../middlewares/rateLimiter');
const { upload, handleUploadError, cleanupOnError } = require('../middlewares/uploadMiddleware');

const userController = new UserController();

router.post(
  '/',
  publicRateLimiter,
  upload.single('profilePhoto'),
  handleUploadError,
  cleanupOnError,
  validateRequest(createUserSchema, 'body'),
  userController.register.bind(userController)
);

module.exports = router;
```

#### `src/api/validation/userSchemas.js`

```javascript
const Joi = require('joi');

const createUserSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(2)
    .max(60)
    .required()
    .messages({
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name cannot exceed 60 characters',
      'any.required': 'First name is required'
    }),
  
  lastName: Joi.string()
    .trim()
    .min(2)
    .max(60)
    .required()
    .messages({
      'string.min': 'Last name must be at least 2 characters',
      'string.max': 'Last name cannot exceed 60 characters',
      'any.required': 'Last name is required'
    }),
  
  universityId: Joi.string()
    .trim()
    .pattern(/^\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'University ID must be 9 digits',
      'any.required': 'University ID is required'
    }),
  
  corporateEmail: Joi.string()
    .trim()
    .email()
    .pattern(/@unisabana\.edu\.co$/)
    .required()
    .messages({
      'string.email': 'Must be a valid email',
      'string.pattern.base': 'Must be a corporate email (@unisabana.edu.co)',
      'any.required': 'Corporate email is required'
    }),
  
  phone: Joi.string()
    .trim()
    .pattern(/^\+57[0-9]{10}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone must be in E.164 format (+57XXXXXXXXXX)',
      'any.required': 'Phone is required'
    }),
  
  password: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'any.required': 'Password is required'
    }),
  
  role: Joi.string()
    .valid('passenger', 'driver')
    .required()
    .messages({
      'any.only': 'Role must be either passenger or driver',
      'any.required': 'Role is required'
    })
});

module.exports = { createUserSchema };
```

#### `src/app.js`

```javascript
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const correlationId = require('./api/middlewares/correlationId');
const errorHandler = require('./api/middlewares/errorHandler');
const { serveSwagger } = require('./api/middlewares/swagger');
const userRoutes = require('./api/routes/userRoutes');

const app = express();

// Security & Logging
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(morgan('combined'));
app.use(correlationId);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/users', userRoutes);

// Documentation
serveSwagger(app);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    code: 'not_found',
    message: 'Route not found',
    path: req.path
  });
});

// Error handler
app.use(errorHandler);

module.exports = app;
```

#### `src/index.js`

```javascript
require('dotenv').config();
const app = require('./app');
const connectDB = require('./infrastructure/database/connection');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`👤 User registration: http://localhost:${PORT}/api/users`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
```

---

## 🎯 Comandos de Instalación Rápida

```bash
# Navegar a la carpeta backend
cd backend

# Instalar dependencias
npm install

# Crear archivo .env (copiar de .env.example y completar)
cp .env.example .env

# Ejecutar en modo desarrollo
npm run dev

# Ejecutar tests
npm test
npm run test:unit
npm run test:integration
npm run test:coverage
```

---

## 📌 Notas Importantes

1. **Multer version:** Usar `multer@1.4.5-lts.1` (no 2.x)
2. **MongoDB:** Configurar `MONGODB_URI` en `.env` con credenciales válidas
3. **Tests:** Carpeta `tests/` está en `.gitignore` (no se sube al repo)
4. **Uploads:** Carpeta `uploads/` está en `.gitignore` (no se sube al repo)
5. **Scripts temporales:** Todos los `test-*.js` están en `.gitignore`

---

## ✅ Estado de Implementación

- [x] User Story 1.1 - Initial Registration (100%)
- [ ] User Story 1.2 - Vehicle Management (40%)
  - [x] Domain layer
  - [ ] API layer
  - [ ] Tests

---

**Backup creado:** 21 de Octubre, 2025  
**Proyecto:** Wheels-Unisabana  
**Epic:** User Registration & Profile Management

