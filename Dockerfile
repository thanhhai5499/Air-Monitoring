# Build stage
FROM node:20-alpine as build

# Set working directory
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
FROM node:20-alpine

WORKDIR /app

COPY --from=build /app .

EXPOSE 3001

CMD ["npm", "run", "preview"] 