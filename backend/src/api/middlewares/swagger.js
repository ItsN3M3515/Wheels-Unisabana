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
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'access_token',
          description: 'JWT stored in httpOnly cookie'
        }
      },
      schemas: {
        // Error Schemas
        ErrorValidation: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'invalid_schema' },
            message: { type: 'string', example: 'Validation failed' },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'firstName' },
                  issue: { type: 'string', example: 'min length 2' }
                }
              }
            },
            correlationId: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' }
          }
        },
        ErrorConflict: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'duplicate_email' },
            message: { type: 'string', example: 'corporateEmail already exists' },
            correlationId: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' }
          }
        },
        ErrorUnauthorized: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'unauthorized' },
            message: { type: 'string', example: 'Missing or invalid session' },
            correlationId: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' }
          }
        },
        ErrorForbidden: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'immutable_field' },
            message: { type: 'string', example: 'One or more fields cannot be updated' },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'corporateEmail' },
                  issue: { type: 'string', example: 'immutable' }
                }
              }
            },
            correlationId: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' }
          }
        },
        ErrorPayloadTooLarge: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'payload_too_large' },
            message: { type: 'string', example: 'File exceeds limit' },
            correlationId: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' }
          }
        },
        // User Schemas
        UserResponseDto: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '665e2a...f1' },
            role: { type: 'string', enum: ['passenger', 'driver'], example: 'passenger' },
            firstName: { type: 'string', example: 'Ana' },
            lastName: { type: 'string', example: 'Ruiz' },
            universityId: { type: 'string', example: '202420023' },
            corporateEmail: { type: 'string', format: 'email', example: 'aruiz@unisabana.edu.co' },
            phone: { type: 'string', example: '+573001112233' },
            profilePhotoUrl: { type: 'string', nullable: true, example: 'https://cdn.example/u/665e2a/avatar.jpg' },
            driver: {
              type: 'object',
              nullable: true,
              properties: {
                hasVehicle: { type: 'boolean', example: false }
              },
              description: 'Only present for role=driver'
            }
          }
        },
        UpdateProfileRequest: {
          type: 'object',
          properties: {
            firstName: { type: 'string', minLength: 2, maxLength: 50, example: 'Ana María' },
            lastName: { type: 'string', minLength: 2, maxLength: 50, example: 'Ruiz García' },
            phone: { type: 'string', pattern: '^\\+[1-9]\\d{1,14}$', example: '+573001112233' }
          },
          description: 'At least one field required'
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

