#!/bin/bash

echo "🚀 Starting deployment of Air Monitoring Admin..."

# Stop existing containers
echo "📦 Stopping existing containers..."
docker-compose down

# Build and start containers
echo "🔨 Building and starting containers..."
docker-compose up --build -d

# Wait for container to be ready
echo "⏳ Waiting for container to be ready..."
sleep 10

# Check container status
echo "🔍 Checking container status..."
docker-compose ps

# Show logs
echo "📋 Recent logs:"
docker-compose logs --tail=20

echo "✅ Deployment completed!"
echo "🌐 Application is running at: http://admin.aiot-shtplabs.com:3001" 