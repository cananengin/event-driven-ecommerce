FROM node:18-alpine

WORKDIR /usr/src/app

# Copy shared package and build it
COPY packages/event-types /usr/src/packages/event-types
WORKDIR /usr/src/packages/event-types
RUN npm install && npm run build

# Go back to app directory
WORKDIR /usr/src/app

# Copy package files
COPY services/order-service/package.json ./
COPY services/order-service/package-lock.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY services/order-service/. .

# Fix: Remove any existing, then create and copy shared package to node_modules
RUN rm -rf node_modules/@ecommerce/event-types && \
    mkdir -p node_modules/@ecommerce/event-types && \
    cp -r /usr/src/packages/event-types/dist/* node_modules/@ecommerce/event-types/ && \
    cp /usr/src/packages/event-types/package.json node_modules/@ecommerce/event-types/

# Build the application
RUN npm run build

EXPOSE 3001

CMD ["node", "dist/server.js"]
