# 🚀 Event-Driven E-commerce System

A production-ready, event-driven e-commerce system built with microservices architecture using Node.js, TypeScript, RabbitMQ, and MongoDB. This system demonstrates advanced patterns for distributed systems, event-driven communication, and resilient message processing.

## 📋 Table of Contents

- [🏗️ System Architecture](#️-system-architecture)
- [🛠️ Services Overview](#️-services-overview)
- [🔄 Event Flow](#-event-flow)
- [🛠️ Infrastructure](#️-infrastructure)
- [🔧 Advanced Features](#-advanced-features)
- [📊 API Endpoints](#-api-endpoints)
- [🧪 Testing](#-testing)
- [🚀 Quick Start](#-quick-start)
- [🔍 Monitoring & Debugging](#-monitoring--debugging)
- [🛡️ Production Considerations](#️-production-considerations)
- [📁 Project Structure](#-project-structure)
- [🎯 Key Achievements](#-key-achievements)
- [🔧 Development Guide](#-development-guide)

## 🏗️ System Architecture

### **Microservices Architecture**
```
┌─────────────────┐    ┌──────────────────┐    ┌────────────────────┐
│  Order Service  │    │ Inventory Service│    │ Notification Service│
│   (Port 3001)   │    │   (Port 3002)    │    │    (Port 3003)     │
│                 │    │                  │    │                    │
│ • Order Mgmt    │    │ • Stock Control  │    │ • User Notifications│
│ • Event Init    │    │ • Availability   │    │ • Template Engine  │
│ • Status Track  │    │ • Deduction      │    │ • DLQ Handling     │
└─────────────────┘    └──────────────────┘    └────────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   RabbitMQ      │
                    │  (Port 5672)    │
                    │  UI: 15672      │
                    │                 │
                    │ • Message Broker│
                    │ • DLQ Support   │
                    │ • Persistent    │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   MongoDB       │
                    │  (Port 27017)   │
                    │                 │
                    │ • Order Data    │
                    │ • Inventory     │
                    │ • Templates     │
                    └─────────────────┘
```

### **Technology Stack**
- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Message Broker**: RabbitMQ (with Management UI)
- **Database**: MongoDB
- **Containerization**: Docker & Docker Compose
- **Testing**: Jest + Supertest
- **Package Management**: npm with monorepo structure

## 🛠️ Services Overview

### **1. Order Service** (`services/order-service/`)
**Purpose**: Order management and workflow initiation

**Key Features:**
- ✅ Order creation, retrieval, and cancellation
- ✅ Event-driven order status updates
- ✅ Idempotency for duplicate event prevention
- ✅ Health checks for MongoDB and RabbitMQ
- ✅ Comprehensive API with filtering

**Key Components:**
- **API Routes** (`src/api/routes.ts`)
  - `POST /api/orders` - Create new orders
  - `GET /api/orders/:orderId` - Get specific order
  - `GET /api/orders` - Get orders with filters (userId, status)
  - `DELETE /api/orders/:orderId` - Cancel orders
  - `GET /api/health` - Service health check

- **Business Logic** (`src/services/order.service.ts`)
  - `createOrder()` - Create new orders with validation
  - `getOrderById()` - Retrieve orders by ID
  - `updateOrderStatusFromInventoryUpdate()` - Update order status from inventory events
  - `getOrdersByUserId()` - Get orders for specific user
  - `getOrders()` - Get all orders with optional filters
  - `cancelOrder()` - Cancel existing orders

- **Event Handling** (`src/events/`)
  - **Publishers** (`publishers.ts`)
    - `publishOrderCreated()` - Emit when order is created
    - `publishOrderStatusUpdated()` - Emit when status changes
  - **Consumers** (`consumers.ts`)
    - `handleInventoryStatusUpdate()` - React to inventory updates

- **Models** (`src/models/`)
  - `order.model.ts` - Order schema with status tracking
  - `processed-event.model.ts` - Idempotency tracking for events

- **Testing** (`src/__tests__/`)
  - `order-api.test.ts` - API integration tests
  - `health-check.test.ts` - Health endpoint tests

### **2. Inventory Service** (`services/inventory-service/`)
**Purpose**: Inventory management and stock validation

**Key Features:**
- ✅ Real-time stock availability checking
- ✅ Inventory deduction and management
- ✅ Seeded test data for development
- ✅ Comprehensive validation and logging
- ✅ Health checks and API endpoints

**Key Components:**
- **API Routes** (`src/api/routes.ts`)
  - `GET /api/health` - Service health check
  - `GET /api/inventory/:productId` - Get specific product inventory
  - `POST /api/inventory/:productId` - Update product inventory
  - `GET /api/inventory` - Get all inventory summary

- **Business Logic** (`src/services/inventory.service.ts`)
  - `checkInventoryAvailability()` - Check stock levels for products
  - `deductInventory()` - Reduce stock quantities
  - `processOrder()` - Process order inventory requirements
  - `getInventory()` - Get current stock levels
  - `addInventory()` - Add stock to products
  - `getInventorySummary()` - Get comprehensive inventory overview

- **Event Handling** (`src/events/`)
  - **Consumers** (`consumers.ts`)
    - `handleOrderCreated()` - Process new order inventory requirements
  - **Publishers** (`publishers.ts`)
    - `publishInventoryStatusUpdated()` - Report inventory processing results

- **Models** (`src/models/`)
  - `inventory.model.ts` - Product inventory schema with name support

- **Utilities** (`src/utils/`)
  - `inventory-seeder.ts` - Seed test inventory data
  - `validation.ts` - Input validation and sanitization
  - `logger.ts` - Structured logging with configurable levels

### **3. Notification Service** (`services/notification-service/`)
**Purpose**: User notifications and communication

**Key Features:**
- ✅ Template-based notifications with variable substitution
- ✅ Dead Letter Queue (DLQ) for failed message handling
- ✅ Event replay mechanism for reprocessing failed messages
- ✅ Multiple notification types (email, SMS, push)
- ✅ Comprehensive validation and error handling

**Key Components:**
- **API Routes** (`src/api/routes.ts`)
  - `GET /api/health` - Service health check
  - `POST /api/notifications` - Send custom notifications
  - `GET /api/templates` - Get available notification templates

- **Business Logic** (`src/services/notification.service.ts`)
  - `sendSuccessNotification()` - Send success notifications
  - `sendFailureNotification()` - Send failure notifications
  - `processInventoryStatusUpdate()` - Process inventory status events
  - `sendCustomNotification()` - Send custom notifications with templates

- **Event Handling** (`src/events/`)
  - **Consumers** (`consumers.ts`)
    - `handleInventoryStatusUpdated()` - Process inventory status updates

- **Models** (`src/models/`)
  - `notification-template.model.ts` - Template storage and management

- **Utilities** (`src/utils/`)
  - `notification-seeder.ts` - Seed notification templates
  - `template-engine.ts` - Template processing with variable substitution
  - `validation.ts` - Input validation for notifications
  - `logger.ts` - Structured logging for notification events
  - `dlq-replay.ts` - Dead Letter Queue replay mechanism

## 🔄 Event Flow

### **Complete Order Processing Flow:**
```
1. User creates order via Order Service API
   ↓
2. Order Service: POST /api/orders
   ↓
3. Order Service: publishOrderCreated() → RabbitMQ
   ↓
4. Inventory Service: handleOrderCreated() ← RabbitMQ
   ↓
5. Inventory Service: checkInventoryAvailability()
   ↓
6. Inventory Service: publishInventoryStatusUpdated() → RabbitMQ
   ↓
7. Order Service: handleInventoryStatusUpdate() ← RabbitMQ
   ↓
8. Order Service: updateOrderStatusFromInventoryUpdate()
   ↓
9. Order Service: publishOrderStatusUpdated() → RabbitMQ
   ↓
10. Notification Service: handleInventoryStatusUpdated() ← RabbitMQ
   ↓
11. Notification Service: sendSuccessNotification() or sendFailureNotification()
```

### **Event Types & Payloads:**
```typescript
// order.created
{
  orderId: string;
  userId: string;
  products: Array<{productId: string; quantity: number}>;
  totalPrice: number;
  timestamp: string;
}

// inventory.status.updated
{
  orderId: string;
  userId: string;
  success: boolean;
  message: string;
  timestamp: string;
}

// order.status.updated
{
  orderId: string;
  userId: string;
  status: 'CONFIRMED' | 'CANCELLED';
  timestamp: string;
}
```

## 🛠️ Infrastructure

### **Docker Compose Setup:**
```yaml
# Core Infrastructure
- RabbitMQ (Port 5672, UI: 15672)
- MongoDB (Port 27017)

# Microservices
- Order Service (Port 3001)
- Inventory Service (Port 3002)
- Notification Service (Port 3003)
```

### **Shared Packages:**
- **`@ecommerce/event-types`** - Common event type definitions
- **TypeScript path mapping** - Consistent imports across services
- **Monorepo structure** - Shared packages and development

### **Volume Persistence:**
- **MongoDB Data**: `volumes/mongo/`
- **RabbitMQ Data**: `volumes/rabbitmq/`

## 🔧 Advanced Features

### **Error Handling & Resilience:**
- **Retry/Backoff Mechanism** - RabbitMQ connection resilience with exponential backoff
- **Dead Letter Queue (DLQ)** - Failed message handling with replay capability
- **Event Replay** - Reprocess failed messages from DLQ
- **Idempotency** - Prevent duplicate processing using event tracking
- **Circuit Breaker Pattern** - Graceful degradation for service failures

### **Data Management:**
- **Seeding Utilities** - Test data generation for development
- **Validation** - Input sanitization and validation across all services
- **Structured Logging** - Consistent logging with configurable levels
- **Health Checks** - Service and dependency status monitoring

### **Message Queue Features:**
- **Persistent Messages** - Survive broker restarts
- **Message Acknowledgments** - Reliable message processing
- **Queue Durability** - Survive broker restarts
- **Exchange Routing** - Flexible message routing patterns

### **Testing:**
- **Integration Tests** - End-to-end service testing with Jest
- **API Testing** - HTTP endpoint testing with Supertest
- **Health Check Tests** - Service availability verification
- **TypeScript Testing** - Full type safety in tests

## 📊 API Endpoints

### **Order Service (Port 3001):**
```http
POST   /api/orders          - Create new order
GET    /api/orders/:orderId - Get specific order
GET    /api/orders          - Get orders (with filters)
DELETE /api/orders/:orderId - Cancel order
GET    /api/health          - Service health check
```

### **Inventory Service (Port 3002):**
```http
GET    /api/health          - Service health check
GET    /api/inventory/:productId - Get specific product inventory
POST   /api/inventory/:productId - Update product inventory
GET    /api/inventory       - Get all inventory summary
```

### **Notification Service (Port 3003):**
```http
GET    /api/health          - Service health check
POST   /api/notifications   - Send custom notification
GET    /api/templates       - Get available templates
```

### **RabbitMQ Management (Port 15672):**
```http
http://localhost:15672
Username: user
Password: password
```

## 🧪 Testing

### **Running Tests:**
```bash
# Test Order Service
cd services/order-service
npm test

# Test Inventory Service
cd services/inventory-service
npm test

# Test Notification Service
cd services/notification-service
npm test
```

### **Test Coverage:**
- **API Integration Tests** - HTTP endpoint testing
- **Health Check Tests** - Service availability
- **Event Flow Tests** - Message queue integration
- **Error Handling Tests** - Failure scenarios

### **Test Configuration:**
- **Jest** - Test runner with TypeScript support
- **Supertest** - HTTP assertion library
- **ts-jest** - TypeScript Jest preset
- **Test Environment** - Isolated test containers

## 🚀 Quick Start

### **Prerequisites:**
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

### **1. Clone and Setup:**
```bash
# Clone the repository
git clone <repository-url>
cd event-driven-ecommerce

# Verify Docker is running
docker --version
docker-compose --version
```

### **2. Start the System:**
```bash
# Start all services
docker-compose up --build

# Or run in background
docker-compose up --build -d
```

### **3. Verify Services:**
```bash
# Check service health
curl http://localhost:3001/api/health
curl http://localhost:3002/api/health
curl http://localhost:3003/api/health

# Check RabbitMQ Management UI
open http://localhost:15672
# Username: user, Password: password
```

### **4. Test the System:**
```bash
# Create a test order
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "products": [{"productId": "prod1", "quantity": 2}],
    "totalPrice": 199.99
  }'

# Check inventory
curl http://localhost:3002/api/inventory

# Send custom notification
curl -X POST http://localhost:3003/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email",
    "recipient": "user@example.com",
    "template": "order_confirmation",
    "variables": {"orderId": "123", "total": "199.99"}
  }'
```

### **5. Run Tests:**
```bash
# Test all services
cd services/order-service && npm test
cd ../inventory-service && npm test
cd ../notification-service && npm test
```

## 🔍 Monitoring & Debugging

### **Service Logs:**
```bash
# View service logs
docker logs order-service
docker logs inventory-service
docker logs notification-service

# Follow logs in real-time
docker logs -f order-service
docker logs -f inventory-service
docker logs -f notification-service

# View all logs
docker-compose logs
```

### **Database Access:**
```bash
# Connect to MongoDB
docker exec -it mongodb mongosh

# List databases
show dbs

# Use specific database
use order-service
use inventory-service
use notification-service

# Query collections
db.orders.find()
db.inventory.find()
db.notificationtemplates.find()
```

### **Message Queue Monitoring:**
- **RabbitMQ Management UI**: http://localhost:15672
- **Queue Monitoring**: Check queues, exchanges, and message flow
- **DLQ Management**: Monitor and replay failed messages
- **Connection Status**: Monitor service connections

### **Health Checks:**
```bash
# Service health endpoints
curl http://localhost:3001/api/health
curl http://localhost:3002/api/health
curl http://localhost:3003/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "mongodb": "connected",
    "rabbitmq": "connected"
  }
}
```


## 📁 Project Structure

```
event-driven-ecommerce/
├── .gitignore                    # Root gitignore
├── docker-compose.yml            # Infrastructure setup
├── README.md                     # Project documentation
├── packages/
│   └── event-types/              # Shared event definitions
│       ├── .gitignore           # Package gitignore
│       ├── package.json         # Package configuration
│       ├── tsconfig.json        # TypeScript config
│       └── index.ts             # Event type exports
├── services/
│   ├── order-service/           # Order management service
│   │   ├── .gitignore          # Service gitignore
│   │   ├── Dockerfile          # Service container
│   │   ├── package.json        # Dependencies
│   │   ├── tsconfig.json       # TypeScript config
│   │   ├── jest.config.js      # Test configuration
│   │   └── src/
│   │       ├── api/            # API routes
│   │       ├── events/         # Event handlers
│   │       ├── models/         # Database models
│   │       ├── services/       # Business logic
│   │       ├── utils/          # Utilities
│   │       ├── __tests__/      # Integration tests
│   │       ├── config.ts       # Configuration
│   │       ├── rabbitmq.ts     # Message queue setup
│   │       └── server.ts       # Service entry point
│   ├── inventory-service/      # Inventory management service
│   │   ├── .gitignore          # Service gitignore
│   │   ├── Dockerfile          # Service container
│   │   ├── package.json        # Dependencies
│   │   ├── tsconfig.json       # TypeScript config
│   │   ├── jest.config.js      # Test configuration
│   │   └── src/
│   │       ├── api/            # API routes
│   │       ├── events/         # Event handlers
│   │       ├── models/         # Database models
│   │       ├── services/       # Business logic
│   │       ├── utils/          # Utilities
│   │       ├── __tests__/      # Integration tests
│   │       ├── config.ts       # Configuration
│   │       ├── rabbitmq.ts     # Message queue setup
│   │       └── server.ts       # Service entry point
│   └── notification-service/   # Notification service
│       ├── .gitignore          # Service gitignore
│       ├── Dockerfile          # Service container
│       ├── package.json        # Dependencies
│       ├── tsconfig.json       # TypeScript config
│       ├── jest.config.js      # Test configuration
│       └── src/
│           ├── api/            # API routes
│           ├── events/         # Event handlers
│           ├── models/         # Database models
│           ├── services/       # Business logic
│           ├── utils/          # Utilities
│           ├── __tests__/      # Integration tests
│           ├── config.ts       # Configuration
│           ├── rabbitmq.ts     # Message queue setup
│           └── server.ts       # Service entry point
└── volumes/                    # Persistent data storage
    ├── mongo/                  # MongoDB data
    └── rabbitmq/               # RabbitMQ data
```

## 🎯 Key Achievements

### **Architecture & Design:**
✅ **Event-Driven Architecture** - Loose coupling via message queues  
✅ **Microservices Pattern** - Independent, scalable services  
✅ **Type Safety** - Shared TypeScript types across services  
✅ **Containerization** - Docker-based deployment  
✅ **Monorepo Structure** - Shared packages and development  

### **Reliability & Resilience:**
✅ **Error Handling** - Comprehensive error management  
✅ **Dead Letter Queue (DLQ)** - Failed message handling  
✅ **Event Replay** - Reprocess failed messages  
✅ **Idempotency** - Prevent duplicate processing  
✅ **Retry/Backoff** - Connection resilience  
✅ **Health Checks** - Service monitoring  

### **Development & Testing:**
✅ **Integration Tests** - End-to-end service testing  
✅ **API Testing** - HTTP endpoint validation  
✅ **TypeScript** - Full type safety  
✅ **Structured Logging** - Consistent logging  
✅ **Validation** - Input sanitization  
✅ **Seeding** - Test data generation  

### **Infrastructure:**
✅ **Docker Compose** - Multi-container orchestration  
✅ **RabbitMQ** - Message broker with UI  
✅ **MongoDB** - Persistent data storage  
✅ **Volume Persistence** - Data survival across restarts  
✅ **Environment Configuration** - Flexible deployment  

### **Documentation:**
✅ **Comprehensive README** - Complete project documentation  
✅ **Code Comments** - Clear code structure  
✅ **API Documentation** - Endpoint specifications  
✅ **Architecture Diagrams** - Visual system overview  

## 🔧 Development Guide

### **Local Development:**
```bash
# Install dependencies for all services
cd services/order-service && npm install
cd ../inventory-service && npm install
cd ../notification-service && npm install
cd ../../packages/event-types && npm install

# Build shared package
cd packages/event-types && npm run build

# Run tests locally
cd services/order-service && npm test
```

### **Code Standards:**
- **TypeScript** - Strict type checking enabled
- **ESLint** - Code linting and formatting
- **Prettier** - Code formatting
- **Jest** - Testing framework
- **Git Hooks** - Pre-commit validation

### **Debugging:**
```bash
# Debug specific service
docker logs -f order-service

# Access service container
docker exec -it order-service sh

# Check RabbitMQ connections
docker exec -it rabbitmq rabbitmqctl list_connections

# Monitor MongoDB
docker exec -it mongodb mongosh --eval "db.serverStatus()"
```
