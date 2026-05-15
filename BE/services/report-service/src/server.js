const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { connectDB } = require('./config/database');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerSpec = require('./swagger');

const app = express();
const PORT = process.env.PORT || 5005;

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
app.use(bodyParser.json());

// Kết nối DB
connectDB().catch(err => {
    console.error('DB connection error:', err);
    process.exit(1);
});

// Routes (no prefix)
app.use('/', require('./routes/report'));

// Health check
app.get('/', (req, res) => {
    res.send('Report Service is running');
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        service: 'Report Service',
        timestamp: new Date().toISOString()
    });
});

const customCss = '.servers { display: none !important; }';
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customCss }));

app.listen(PORT, () => {
    console.log(`Report Service listening on port ${PORT}`);
}); 