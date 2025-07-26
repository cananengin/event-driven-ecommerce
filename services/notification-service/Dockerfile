FROM node:18-alpine

WORKDIR /usr/src/app

# Copy shared package and build it
COPY packages/event-types /usr/src/packages/event-types
WORKDIR /usr/src/packages/event-types
RUN npm install && npm run build

# Go back to app directory
WORKDIR /usr/src/app

# Copy package files
COPY services/notification-service/package.json ./
COPY services/notification-service/package-lock.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY services/notification-service/. .

# Fix: Remove any existing, then create and copy shared package to node_modules
RUN rm -rf node_modules/@ecommerce/event-types && \
    mkdir -p node_modules/@ecommerce/event-types && \
    cp -r /usr/src/packages/event-types/dist/* node_modules/@ecommerce/event-types/ && \
    cp /usr/src/packages/event-types/package.json node_modules/@ecommerce/event-types/

# Build the application
RUN npm run build || true

EXPOSE 3003

CMD ["node", "dist/server.js"] 