const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Input Data Service API',
      version: '1.0.0',
      description: 'API documentation for Input Data Service',
    },
    servers: [
      { url: "http://localhost:5003" }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API Key for input-data-service'
        }
      }
    },
    security: [
      {
        ApiKeyAuth: []
      }
    ],
  },
  apis: [path.join(__dirname, '/routes/*.js')],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec; 