FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# .env is gitignored & dockerignored; use the Docker-specific template so Vite
# inlines VITE_API_BASE_URL_* into the bundle at build time.
COPY env.docker.template .env
RUN npm run build

FROM nginx:1.27-alpine

COPY proxy-headers.conf /etc/nginx/conf.d/proxy-headers.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
