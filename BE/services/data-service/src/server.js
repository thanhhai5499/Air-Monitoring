const express = require('express');
// const statisticsRoutes = require('./routes/statistics'); // Đã xóa
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const { connectDB } = require('./config/database');
const cors = require('cors');
const path = require('path');

const averageDayRoutes = require('./routes/averageDay');
const sensorLatestRoutes = require('./routes/sensorLatest');
const newsRoutes = require('./routes/news');
const uploadImageRoutes = require('./routes/uploadImage');

const app = express();
app.use(express.json());

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

// Swagger docs
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Data Service API',
      version: '1.0.0',
      description: 'API documentation for Data Service'
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

const customCss = '.servers { display: none !important; }';
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customCss }));

// Mount routes (no prefix)
app.use('/', averageDayRoutes);
app.use('/', sensorLatestRoutes);
app.use('/', newsRoutes);
app.use('/', uploadImageRoutes);
app.use('/uploads', (req, res, next) => {
  console.log('Request to /uploads:', req.url);
  next();
});
app.use('/uploads', express.static('/app/uploads'));

// Health check
app.get('/', (req, res) => res.send('Data Service is running!'));

const PORT = process.env.PORT || 5004;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Data Service listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to DB. Server not started.');
    process.exit(1);
  }); 