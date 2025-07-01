# Deployment Guide - Air Monitoring Admin

## Prerequisites

- Docker và Docker Compose đã được cài đặt trên server
- Domain `admin.aiot-shtplabs.com` đã được cấu hình DNS trỏ về server

## Quick Deployment

### 1. Clone và cài đặt
```bash
git clone <repository-url>
cd Air-Monitoring-Admin
```

### 2. Deploy với script
```bash
chmod +x deploy.sh
./deploy.sh
```

### 3. Deploy thủ công
```bash
# Build và chạy container
docker-compose up --build -d

# Kiểm tra status
docker-compose ps

# Xem logs
docker-compose logs -f
```

## Cấu hình

### Port
- Ứng dụng chạy trên port **3001**
- URL: `http://admin.aiot-shtplabs.com:3001`

### Environment Variables
Có thể thêm các biến môi trường trong `docker-compose.yml`:
```yaml
environment:
  - NODE_ENV=production
  - REACT_APP_API_URL=https://api.aiot-shtplabs.com
```

### Nginx Configuration
File `nginx.conf` đã được cấu hình để:
- Serve React app với routing support
- Enable gzip compression
- Cache static assets
- Security headers
- Health check endpoint

## Management Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# Update and redeploy
docker-compose down
docker-compose up --build -d
```

## Troubleshooting

### Kiểm tra container status
```bash
docker-compose ps
docker-compose logs air-monitoring-admin
```

### Kiểm tra nginx logs
```bash
docker exec air-monitoring-admin tail -f /var/log/nginx/error.log
```

### Rebuild nếu có lỗi
```bash
docker-compose down
docker system prune -f
docker-compose up --build -d
```

## SSL/HTTPS Setup

Để cấu hình HTTPS, thêm SSL certificate và cập nhật `nginx.conf`:

```nginx
server {
    listen 443 ssl;
    server_name admin.aiot-shtplabs.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # ... rest of configuration
}
```

## Monitoring

Container có health check tự động. Kiểm tra:
```bash
docker inspect air-monitoring-admin | grep Health -A 10
``` 