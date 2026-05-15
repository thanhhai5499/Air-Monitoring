const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/database');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
dotenv.config({ path: require('path').resolve(__dirname, '../../config.env') });
const statisticsRoutes = require('./routes/statistics');

const app = express();

// CORS Configuration
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(o => o.trim()).filter(o => o);

if (allowedOrigins.length > 0) {
  // Use specific origins from config.env
  console.log('🌐 CORS Allowed Origins:', allowedOrigins);
  app.use(cors({ 
    origin: allowedOrigins, 
    credentials: true 
  }));
} else {
  // Allow all for local development (no CORS_ORIGIN set)
  console.log('🌐 CORS: Allow ALL origins (local dev mode)');
  app.use(cors());
}
app.use(express.json());

connectDB();

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Statistics Service API',
      version: '1.0.0',
      description: 'API documentation for Statistics Service'
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Mount routes (no prefix)
app.use('/', statisticsRoutes);
const customCss = '.servers { display: none !important; }';
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customCss }));

const PORT = process.env.PORT || 5007;
app.listen(PORT, () => {
  console.log(`Statistics service listening on port ${PORT}`);
}); 