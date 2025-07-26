FROM node:18-alpine
WORKDIR /usr/src/app

# Install and build shared event-types package
COPY packages/event-types /usr/src/packages/event-types
WORKDIR /usr/src/packages/event-types
RUN npm install && npm run build

# Install and build service
WORKDIR /usr/src/app
COPY services/order-service/package.json ./
COPY services/order-service/package-lock.json ./
RUN npm install --legacy-peer-deps
COPY services/order-service/. .

# Copy built event-types to /usr/src/app/event-types for TypeScript path alias
RUN mkdir -p /usr/src/app/event-types \
  && cp -r /usr/src/packages/event-types/dist/* /usr/src/app/event-types/ \
  && cp /usr/src/packages/event-types/package.json /usr/src/app/event-types/ \
  && cp /usr/src/packages/event-types/dist/index.d.ts /usr/src/app/event-types/

RUN npm run build

EXPOSE 3000
CMD [ "npm", "start" ]
