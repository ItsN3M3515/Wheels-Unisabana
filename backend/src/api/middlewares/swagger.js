const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

// Configuración simplificada de Swagger
const swaggerOptions = {
  definition: {
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
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    tags: [
      { name: 'System', description: 'Endpoints del sistema' },
      { name: 'Users', description: 'Gestión de usuarios' },
      { name: 'Vehicles', description: 'Gestión de vehículos (drivers)' }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token para autenticación (implementación futura)'
        }
      }
    }
  },
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../controllers/*.js')
  ]
};

// Generar especificación
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware para servir Swagger UI
const swaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #2c3e50 }
  `,
  customSiteTitle: 'Wheels-Unisabana API Documentation',
  customfavIcon: '/favicon.ico'
};

// Middleware para servir la documentación
const serveSwagger = (app) => {
  // Servir Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
  
  // Servir especificación JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  
  // Redireccionar root de docs a Swagger UI
  app.get('/docs', (req, res) => {
    res.redirect('/api-docs');
  });
  
  console.log('📚 Swagger UI available at /api-docs');
};

module.exports = {
  swaggerSpec,
  serveSwagger
};

