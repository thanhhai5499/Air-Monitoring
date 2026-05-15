const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const { connectDB } = require('./config/database');

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
const customCss = '.servers { display: none !important; }';
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customCss }));

// Mount auth routes with /auth prefix
app.use('/auth', authRoutes);

// Health check
app.get('/', (req, res) => res.send('Auth Service is running!'));

const PORT = process.env.PORT || 5001;

// Kết nối DB trước khi start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Auth Service listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to DB. Server not started.');
    process.exit(1);
  }); 