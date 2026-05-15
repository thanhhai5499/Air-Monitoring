const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/database');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
dotenv.config({ path: require('path').resolve(__dirname, '../../config.env') });
const sensorRouter = require('./routes/sensor');
const stationRoutes = require('./routes/station');

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

// Swagger docs - Mount TRƯỚC các routes khác để tránh bị chặn
const customCss = '.servers { display: none !important; }';
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customCss }));

// Mount routes (no prefix) - Mount SAU Swagger
app.use('/', sensorRouter);
app.use('/', stationRoutes);

const PORT = process.env.PORT || 5006;
app.listen(PORT, () => {
  console.log(`Station service listening on port ${PORT}`);
}); 