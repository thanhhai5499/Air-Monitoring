const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/user');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const { connectDB } = require('./config/database');
const authMiddleware = require('./middleware/auth');

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

// Mount user routes (no prefix)
app.use('/', userRoutes);

// Health check
app.get('/', (req, res) => res.send('User Service is running!'));

const PORT = process.env.PORT || 5002;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`User Service listening on port ${PORT}`);
    });
    
    // Khởi động job tự động cập nhật status manager khi hết hạn
    const { checkAndUpdateExpiredManagers } = require('./userExpirationJob');
    // Chạy ngay khi start
    checkAndUpdateExpiredManagers();
    // Lặp mỗi 1 giờ
    setInterval(checkAndUpdateExpiredManagers, 3600000);
  })
  .catch((err) => {
    console.error('Failed to connect to DB. Server not started.');
    process.exit(1);
  }); 