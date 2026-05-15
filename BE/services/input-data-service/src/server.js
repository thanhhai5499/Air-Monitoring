require('dotenv').config({ path: __dirname + '/../config.env' });
if (!process.env.DATA_API_KEY) {
  require('dotenv').config({ path: 'config.env' });
}
const express = require('express');
const cors = require('cors');
const inputDataRoutes = require('./routes/inputData');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const { connectDB } = require('./config/database');

const app = express();
app.use(express.json());

// Cấu hình CORS - Allow all (Public API for IoT devices)
app.use(cors());

// Swagger docs
const customCss = '.servers { display: none !important; }';
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customCss }));

// Mount input-data routes (no prefix)
app.use('/', inputDataRoutes);

// Health check
app.get('/', (req, res) => res.send('Input Data Service is running!'));

const PORT = process.env.PORT || 5003;

// Kết nối DB trước khi start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
    });
  })
  .catch((err) => {
    process.exit(1);
  }); 