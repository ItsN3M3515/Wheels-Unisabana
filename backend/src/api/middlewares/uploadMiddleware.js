const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear directorio de uploads si no existe
const uploadDir = process.env.UPLOAD_DIR || 'uploads/profiles';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de storage para Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único: timestamp-random.extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Only JPEG, PNG, and WebP are allowed.'), false);
  }
};

// Configuración de Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_PROFILE_PHOTO_MB || '5') * 1024 * 1024 // 5MB por defecto
  }
});

// Middleware para manejar errores de Multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        code: 'payload_too_large',
        message: 'File exceeds limit',
        correlationId: req.correlationId
      });
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        code: 'invalid_file_type',
        message: 'Unexpected file field',
        correlationId: req.correlationId
      });
    }
  }
  
  if (err && err.message === 'Unsupported file type. Only JPEG, PNG, and WebP are allowed.') {
    return res.status(400).json({
      code: 'invalid_file_type',
      message: 'Unsupported MIME type',
      correlationId: req.correlationId
    });
  }
  
  next(err);
};

// Middleware para cleanup automático en caso de error
const cleanupOnError = async (req, res, next) => {
  // Si hay archivo subido, limpiarlo en caso de error
  if (req.file && req.file.path) {
    const originalSend = res.send;
    res.send = function(data) {
      // Si la respuesta es exitosa (2xx), no limpiar
      if (res.statusCode >= 200 && res.statusCode < 300) {
        return originalSend.call(this, data);
      }
      
      // Si hay error, limpiar archivo
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
      return originalSend.call(this, data);
    };
  }
  
  next();
};

module.exports = {
  upload,
  handleUploadError,
  cleanupOnError
};

