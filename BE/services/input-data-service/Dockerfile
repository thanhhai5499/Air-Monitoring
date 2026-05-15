FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install && npm install -g concurrently

COPY . .

EXPOSE 5003
CMD ["concurrently", "node src/server.js", "node src/statisticsJob.js"] 