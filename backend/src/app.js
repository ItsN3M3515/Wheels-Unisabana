const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

// Middlewares personalizados
const correlationId = require('./api/middlewares/correlationId');
const errorHandler = require('./api/middlewares/errorHandler');
const { generalRateLimiter } = require('./api/middlewares/rateLimiter');
const { serveSwagger } = require('./api/middlewares/swagger');

// Rutas
const userRoutes = require('./api/routes/userRoutes');
const authRoutes = require('./api/routes/authRoutes');

const app = express();

// Trust proxy para rate limiting y IPs reales
app.set('trust proxy', 1);

// Global middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('combined'));
app.use(cookieParser());
app.use(correlationId);
app.use(generalRateLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    correlationId: req.correlationId
  });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/auth', authRoutes);

// Swagger Documentation
serveSwagger(app);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    code: 'not_found',
    message: 'Endpoint not found',
    correlationId: req.correlationId
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;

