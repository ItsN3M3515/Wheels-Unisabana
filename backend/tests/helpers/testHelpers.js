/**
 * Test Helpers
 * Common utilities for integration tests
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

/**
 * Connect to test database
 */
async function connectTestDB() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wheels-unisabana-test';
  await mongoose.connect(mongoUri);
}

/**
 * Disconnect from test database
 */
async function disconnectTestDB() {
  await mongoose.connection.close();
}

/**
 * Clear all collections in test database
 */
async function clearDatabase() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

/**
 * Create a test user (driver or passenger)
 */
async function createTestUser(role = 'driver') {
  const randomId = Math.floor(300000 + Math.random() * 99999);
  return {
    firstName: 'Test',
    lastName: role === 'driver' ? 'Driver' : 'Passenger',
    universityId: `${randomId}`,
    corporateEmail: `test${randomId}@unisabana.edu.co`,
    phone: '+573001234567',
    password: 'TestPass123!',
    role
  };
}

/**
 * Generate random plate
 */
function generateRandomPlate() {
  const letters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                  String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                  String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const numbers = Math.floor(100 + Math.random() * 900);
  return `${letters}${numbers}`;
}

/**
 * Create test image file
 */
function createTestImage(filename = 'test-image.jpg') {
  const testDir = path.join(__dirname, '../test-files');
  
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  // Create a small valid JPEG (1x1 pixel, red)
  const validJpeg = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01,
    0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x09, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF,
    0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0xD2, 0xCF, 0x20,
    0xFF, 0xD9
  ]);
  
  const imagePath = path.join(testDir, filename);
  fs.writeFileSync(imagePath, validJpeg);
  return imagePath;
}

/**
 * Create large test file (for testing size limits)
 */
function createLargeTestFile(filename = 'large-file.jpg', sizeMB = 6) {
  const testDir = path.join(__dirname, '../test-files');
  
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const buffer = Buffer.alloc(sizeMB * 1024 * 1024);
  const filePath = path.join(testDir, filename);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

/**
 * Cleanup test files
 */
function cleanupTestFiles() {
  const testDir = path.join(__dirname, '../test-files');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
}

/**
 * Count files in uploads directory
 */
function countUploadedFiles(subfolder = 'vehicles') {
  const uploadsDir = path.join(__dirname, '../../uploads', subfolder);
  if (!fs.existsSync(uploadsDir)) {
    return 0;
  }
  return fs.readdirSync(uploadsDir).length;
}

/**
 * Cleanup uploads directory
 */
function cleanupUploads(subfolder = 'vehicles') {
  const uploadsDir = path.join(__dirname, '../../uploads', subfolder);
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    files.forEach(file => {
      fs.unlinkSync(path.join(uploadsDir, file));
    });
  }
}

module.exports = {
  connectTestDB,
  disconnectTestDB,
  clearDatabase,
  createTestUser,
  generateRandomPlate,
  createTestImage,
  createLargeTestFile,
  cleanupTestFiles,
  countUploadedFiles,
  cleanupUploads
};

