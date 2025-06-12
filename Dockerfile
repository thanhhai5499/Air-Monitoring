# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Cài bash để tránh lỗi shell
RUN apk add --no-cache bash

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy toàn bộ source code
COPY . .

# Fix permission cho toàn bộ .bin sau khi đã copy code
RUN chmod -R 755 node_modules/.bin

# Build the app (dùng bash để chắc chắn không lỗi shell)
RUN /bin/bash -c "npm run build"

# Production stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 