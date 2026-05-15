# 📚 Swagger API Documentation Links

## Quick Access Links

```
http://localhost:5001/api-docs   # Auth Service
http://localhost:5002/api-docs   # User Service
http://localhost:5003/api-docs   # Input Data Service
http://localhost:5004/api-docs   # Data Service
http://localhost:5005/api-docs   # Report Service
http://localhost:5006/api-docs   # Station Service
http://localhost:5007/api-docs   # Statistics Service
```

## Service Details

### 🔐 Auth Service (Port 5001)
**Link:** http://localhost:5001/api-docs
- POST /login
- POST /register
- POST /google-oauth

### 👤 User Service (Port 5002)
**Link:** http://localhost:5002/api-docs
- GET /profile
- POST /change-password
- GET /managers
- GET /google
- PUT /:id/status

### 📥 Input Data Service (Port 5003)
**Link:** http://localhost:5003/api-docs
- POST / (IoT data input)

### 📊 Data Service (Port 5004)
**Link:** http://localhost:5004/api-docs
- GET /average-day
- GET /sensor-latest
- GET /news
- POST /news
- PUT /news/:id
- DELETE /news/:id
- POST /image

### 📋 Report Service (Port 5005)
**Link:** http://localhost:5005/api-docs
- POST /filter
- GET /indicators
- GET /sensor-types
- GET /station-sensors

### 🏢 Station Service (Port 5006)
**Link:** http://localhost:5006/api-docs
- GET /list
- GET /detailed-list
- GET /:id
- POST /
- PUT /:id
- GET /sensor-thresholds
- POST /sensor
- PUT /sensor/:id
- POST /sensor-threshold
- PUT /sensor-threshold/:id

### 📈 Statistics Service (Port 5007)
**Link:** http://localhost:5007/api-docs
- GET /daily
- GET /monthly
- GET /hourly (NEW - Dữ liệu theo giờ cho Heat Map)
- GET /distribution (NEW - Phân bố % mức độ chất lượng)
