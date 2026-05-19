# Air Monitoring Backend API

A comprehensive REST API for air quality monitoring system built with Node.js, Express, and SQL Server.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Complete CRUD operations for user administration
- **Station Management**: Manage air quality monitoring stations
- **Data Management**: Store and retrieve air quality measurements
- **Reporting**: Generate comprehensive air quality reports
- **Real-time Data**: Latest air quality data endpoints
- **Data Export**: Export data in JSON and CSV formats
- **Security**: Rate limiting, input validation, and security headers

## 📋 Prerequisites

- Node.js (v16 or higher)
- SQL Server (2016 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository and navigate to backend**
   ```bash
   cd BE
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   - Copy `config.env` and update with your SQL Server credentials
   - Update the database connection details:
     ```
     DB_SERVER=your_server_ip
     DB_PORT=1433
     DB_NAME=AirMonitoring
     DB_USER=your_username
     DB_PASSWORD=your_password
     ```

4. **Initialize database**
   ```bash
   node src/scripts/initDatabase.js
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 🗄️ Database Schema

### Users Table
- `id`: Primary key
- `username`: Unique username
- `email`: Unique email address
- `password`: Hashed password
- `fullName`: User's full name
- `role`: User role (admin, manager, user)
- `status`: Account status (active, inactive)
- `createdAt`: Account creation timestamp
- `lastLoginAt`: Last login timestamp

### Stations Table
- `id`: Primary key
- `name`: Station name
- `description`: Station description
- `location`: Station location
- `latitude`: GPS latitude
- `longitude`: GPS longitude
- `status`: Station status (active, inactive, maintenance)
- `installationDate`: Installation date
- `lastMaintenanceDate`: Last maintenance date
- `createdAt`: Record creation timestamp
- `updatedAt`: Record update timestamp

### AirQualityData Table
- `id`: Primary key
- `stationId`: Foreign key to Stations table
- `parameter`: Air quality parameter (PM2.5, PM10, NO2, etc.)
- `value`: Measured value
- `unit`: Unit of measurement
- `quality`: Air quality level (good, moderate, poor, very_poor)
- `timestamp`: Measurement timestamp

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile
- `POST /api/auth/change-password` - Change password

### Users (Admin/Manager only)
- `GET /api/users` - Get all users with pagination
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PATCH /api/users/:id/status` - Update user status
- `GET /api/users/stats/overview` - Get user statistics

### Stations
- `GET /api/stations` - Get all stations with pagination
- `GET /api/stations/:id` - Get station by ID
- `POST /api/stations` - Create new station
- `PUT /api/stations/:id` - Update station
- `DELETE /api/stations/:id` - Delete station
- `GET /api/stations/stats/overview` - Get station statistics
- `GET /api/stations/map/locations` - Get stations for map view

### Air Quality Data
- `GET /api/data` - Get air quality data with filters
- `GET /api/data/latest` - Get latest data for all stations
- `GET /api/data/station/:stationId` - Get data for specific station
- `POST /api/data` - Add new air quality data
- `GET /api/data/stats/overview` - Get data statistics

### Reports
- `POST /api/reports/generate` - Generate air quality report
- `GET /api/reports/templates` - Get report templates
- `GET /api/reports/parameters` - Get available parameters
- `GET /api/reports/stats` - Get report statistics
- `POST /api/reports/export` - Export data

### System
- `GET /api/health` - Health check endpoint

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### User Roles
- **admin**: Full access to all endpoints
- **manager**: Access to most endpoints, can manage stations and data
- **user**: Read-only access to data and reports

## 📊 Sample Data

The initialization script creates:

### Default Admin Account
- Username: `admin`
- Password: `admin123`

### Sample Stations
- Hanoi Central Station
- Ho Chi Minh City Station
- Da Nang Coastal Station
- Hue Historical Station

### Sample Air Quality Data
- 7 days of hourly data for all stations
- Parameters: PM2.5, PM10, NO2, SO2, O3, CO
- Realistic values with quality classifications

## 🛡️ Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: Parameterized queries
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers
- **Password Hashing**: bcrypt with salt rounds

## 📝 Environment Variables

Create a `config.env` file with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# SQL Server Configuration
DB_SERVER=27.71.25.65
DB_PORT=1433
DB_NAME=AirMonitoring
DB_USER=sa
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
```

## Deploy with Docker on IBM test server

Recommended deployment is from the repository root:

```bash
cp .env.example .env
nano .env
docker compose up -d --build
curl http://localhost:3000
```

The root compose file runs all backend services on an internal Docker network and exposes only the frontend/Nginx gateway on host port `3000`.

To run backend services only from this `BE` folder:

```bash
cd BE
docker compose up -d --build
```

This backend-only compose reads environment variables from `../.env`.

Required variables:

```env
DB_SERVER=your_sql_server_host_or_ip
DB_PORT=1433
DB_NAME=AirMonitoring
DB_USER=your_db_user
DB_PASSWORD=change_this_password
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=24h
CORS_ORIGIN=https://app.aiot-shtplabs.com,http://localhost:3000
DATA_API_KEY=change_this_api_key
```

Inside Docker, do not use `localhost` for SQL Server unless SQL Server is in the same container. Use a reachable host IP, LAN IP, Tailscale IP, or a database container service name.

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker (Optional)
```bash
docker build -t air-monitoring-backend .
docker run -p 5000:5000 air-monitoring-backend
```

## 📈 Performance

- Database connection pooling
- Optimized SQL queries with indexes
- Pagination for large datasets
- Efficient data aggregation

## 🔧 Development

### Project Structure
```
src/
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   └── auth.js              # Authentication middleware
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── users.js             # User management routes
│   ├── stations.js          # Station management routes
│   ├── data.js              # Air quality data routes
│   └── reports.js           # Report generation routes
├── scripts/
│   └── initDatabase.js      # Database initialization
└── server.js                # Main server file
```

### Adding New Endpoints

1. Create route file in `src/routes/`
2. Add middleware for authentication/authorization
3. Implement input validation
4. Add error handling
5. Register route in `server.js`

## 📞 Support

For issues and questions:
1. Check the API documentation
2. Review error logs
3. Verify database connection
4. Ensure proper authentication

## 📄 License

This project is licensed under the MIT License. 
