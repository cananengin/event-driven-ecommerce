FROM node:18-alpine
WORKDIR /usr/src/app

# Install and build shared event-types package
COPY packages/event-types /usr/src/packages/event-types
WORKDIR /usr/src/packages/event-types
RUN npm install && npm run build

# Install and build service
WORKDIR /usr/src/app
COPY services/notification-service/package*.json ./
RUN npm install
COPY services/notification-service/. .
RUN npm run build || true

EXPOSE 3000
CMD ["node", "dist/server.js"] 