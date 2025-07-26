# Event-Driven E-commerce System

This project showcases a backend architecture for handling e-commerce order processing using microservices and event-driven communication. It's built with Node.js, TypeScript, RabbitMQ, and MongoDB, and focuses on creating a scalable and fault-tolerant infrastructure.

The goal was to simulate how real-world distributed systems handle things like message sequencing, retries, idempotency, and resilience — and to build a working example from the ground up.

## What This System Does

Imagine you're ordering a laptop online:
1. **You click "Buy Now"** → Order Service creates your order
2. **System checks stock** → Inventory Service verifies we have the laptop
3. **Order gets confirmed** → Your order status updates to "Confirmed"
4. **You get notified** → Notification Service sends you an email

All of this happens automatically, reliably, and can handle thousands of orders simultaneously.

## How It's Built

### The Three Core Services:

```
┌─────────────────┐    ┌──────────────────┐    ┌────────────────────┐
│  Order Service  │    │ Inventory Service│    │ Notification Service│
│   (Port 3001)   │    │   (Port 3002)    │    │    (Port 3003)     │
│  (Container:3000)│   │  (Container:3000)│    │   (Container:3000) │
│                 │    │                  │    │                    │
│ • Creates orders│    │ • Checks stock   │    │ • Sends emails     │
│ • Tracks status │    │ • Updates qty    │    │ • SMS notifications│
│ • Manages flow  │    │ • Validates      │    │ • Handles failures │
└─────────────────┘    └──────────────────┘    └────────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   RabbitMQ      │
                    │  Message Broker │
                    │  Port 5672      │
                    │  UI: 15672      │
                    │                 │
                    │ • Delivers msgs │
                    │ • Handles fails │
                    │ • Keeps history │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   MongoDB       │
                    │  Database       │
                    │  Port 27017     │
                    │                 │
                    │ • Stores orders │
                    │ • Tracks stock  │
                    │ • Saves templates│
                    └─────────────────┘
```

### Technology Stack:
- **Node.js 18+** - Fast, reliable JavaScript runtime
- **TypeScript** - Type-safe development
- **RabbitMQ** - Message broker for service communication
- **MongoDB** - Flexible database for data persistence
- **Docker** - Containerization for consistent deployment
- **Jest** - Testing framework for reliability

### Port Configuration:
- **Order Service**: Host port 3001 → Container port 3000
- **Inventory Service**: Host port 3002 → Container port 3000
- **Notification Service**: Host port 3003 → Container port 3000
- **RabbitMQ**: Host port 5672 (AMQP), 15672 (Management UI)
- **MongoDB**: Host port 27017

## Services

### 1. Order Service - The Central Coordinator
**What it does:** Manages the entire order lifecycle - from creation to completion.

**Key features:**
- Creates orders with validation
- Tracks order status in real-time
- Prevents duplicate processing (idempotency)
- Handles errors gracefully
- Provides health monitoring

**API Endpoints:**
```bash
POST   /api/orders          # Create new order
GET    /api/orders/:id      # Get specific order
GET    /api/orders          # Get orders with filters
DELETE /api/orders/:id      # Cancel order
GET    /api/health          # Service health check
```

### 2. Inventory Service - The Stock Manager
**What it does:** Ensures product availability and manages stock levels.

**Key features:**
- Real-time stock checking
- Automatic inventory updates
- Prevents overselling
- Comes with test data
- Provides inventory summaries

**API Endpoints:**
```bash
GET    /api/health          # Service health check
GET    /api/inventory/:id   # Get specific product inventory
POST   /api/inventory/:id   # Update product inventory
GET    /api/inventory       # Get all inventory summary
```

### 3. Notification Service - The Communication Hub
**What it does:** Keeps customers informed about their orders and system events.

**Key features:**
- Template-based email notifications
- SMS notification support
- Smart failure recovery (Dead Letter Queue)
- Template engine with variable substitution
- Reliable message delivery

**API Endpoints:**
```bash
GET    /api/health          # Service health check
POST   /api/notifications   # Send custom notification
GET    /api/templates       # Get available templates
```

## The Event Flow

Here's what happens when you order a laptop:

```
1. User: "I want a laptop!" 
   ↓
2. Order Service: "Got it! Creating order #12345"
   ↓
3. RabbitMQ: "Hey Inventory, someone wants a laptop!"
   ↓
4. Inventory Service: "Let me check... Yes! We have 5 laptops"
   ↓
5. Inventory Service: "Order #12345 - APPROVED!"
   ↓
6. Order Service: "Great! Order #12345 is now CONFIRMED"
   ↓
7. Notification Service: "Sending confirmation email to customer"
   ↓
8. User: "Order confirmed and email received!"
```

## Getting Started

### Prerequisites:
- Docker and Docker Compose
- A terminal
- Basic understanding of microservices

### Environment Setup:
Each service includes a `.env.example` file that shows the required environment variables. Copy these to `.env` files if you need to customize the configuration:

```bash
# For local development (optional)
cp services/order-service/.env.example services/order-service/.env
cp services/inventory-service/.env.example services/inventory-service/.env
cp services/notification-service/.env.example services/notification-service/.env
cp .env.example .env
```

### Step 1: Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd event-driven-ecommerce

# Verify Docker is available
docker --version
```

### Step 2: Start the System
```bash
# Start all services
docker-compose up --build

# Or run in background
docker-compose up --build -d
```

### Step 3: Verify Services
```bash
# Check service health
curl http://localhost:3001/api/health
curl http://localhost:3002/api/health  
curl http://localhost:3003/api/health

# Open RabbitMQ Management UI
open http://localhost:15672
# Username: user, Password: password
```

### Step 4: Test the System
```bash
# Create a test order
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "products": [{"productId": "prod1", "quantity": 1}],
    "totalPrice": 999.99
  }'

# Check inventory
curl http://localhost:3002/api/inventory

# Send a notification
curl -X POST http://localhost:3003/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email",
    "recipient": "user@example.com",
    "template": "order_confirmation",
    "variables": {"orderId": "123", "total": "999.99"}
  }'
```

## Testing

### Running Tests
```bash
# Test all services
cd services/order-service && npm test
cd services/inventory-service && npm test  
cd services/notification-service && npm test

# Or test from root directory
docker-compose exec order-service npm test
docker-compose exec inventory-service npm test
docker-compose exec notification-service npm test
```

### Test Coverage
Our comprehensive test suite covers:

#### **Order Service Tests:**
- ✅ Order creation and validation
- ✅ Health check endpoints
- ✅ Error handling scenarios
- ✅ Event publishing verification

#### **Inventory Service Tests:**
- ✅ Service connectivity (MongoDB, RabbitMQ)
- ✅ Health check validation
- ✅ Inventory management operations

#### **Notification Service Tests:**
- ✅ RabbitMQ connection verification
- ✅ Health check endpoints
- ✅ Template-based notifications

### Test Results Summary
```
📊 Total Test Suites: 4
📈 Total Tests: 7
📈 Passed: 7 ✅
📈 Failed: 0 ❌
📈 Success Rate: 100%
⏱️  Average Execution Time: ~3.5 seconds per service
```

### End-to-End Testing
The system has been thoroughly tested with real scenarios:

#### **Successful Order Flow:**
```
1. Order Created → Order Service
2. Inventory Checked → Inventory Service  
3. Order Confirmed → Order Service
4. Notification Sent → Notification Service
5. Database Updated → MongoDB
6. Events Processed → RabbitMQ
```

#### **Error Scenarios Tested:**
- ✅ Insufficient inventory handling
- ✅ Order cancellation (confirmed vs pending)
- ✅ Invalid data validation
- ✅ Service failure recovery
- ✅ Message queue resilience

## Monitoring

### Real-Time Monitoring
```bash
# Watch all service logs in real-time
docker-compose logs -f --tail=0

# Monitor specific service
docker logs -f order-service
docker logs -f inventory-service
docker logs -f notification-service

# Check RabbitMQ Management UI
open http://localhost:15672
# Username: user, Password: password
```

### Live Event Flow Example
Here's what you'll see in real-time during order processing:

```
order-service         | [x] Sent order.created: 'afa94c91-4d65-4ed1-91f2-576f0255fcc2'
inventory-service     | [x] Sent inventory.status.updated for order 6884e8d11e22879763d08252: SUCCESS
notification-service  | [Notification] Order 6884e8d11e22879763d08252 has been confirmed and is being processed.
order-service         | [v] Received inventory.status.updated for order 6884e8d11e22879763d08252
order-service         | Order 6884e8d11e22879763d08252 status updated to CONFIRMED
order-service         | [x] Sent order.status.updated: '077bea84-40fa-4ee0-87bd-675b9ef6e9a7' for order 6884e8d11e22879763d08252
```

### Error Handling Examples
The system gracefully handles various error scenarios:

```
# Insufficient inventory
inventory-service     | [x] Sent inventory.status.updated for order 6884e9c61e22879763d08273: FAILURE
inventory-service     | Error processing order: InsufficientInventoryError: Insufficient inventory for product prod2: requested 2, available 0
notification-service  | [Notification] Order 6884e9c61e22879763d08273 failed: Insufficient inventory for product prod2: requested 2, available 0
order-service         | Order 6884e9c61e22879763d08273 status updated to CANCELLED

# Order cancellation error
order-service         | Error cancelling order: OrderCancellationError: Cannot cancel order: Cannot cancel confirmed order
```

### View Logs:
```bash
# Connect to MongoDB
docker exec -it mongodb mongosh

# See orders
use order-service
db.orders.find()

# Check inventory
use inventory-service  
db.inventory.find()
```

## Key Features

### Resilience:
- **Retry Logic** - Automatic retry on failures with exponential backoff
- **Dead Letter Queue** - Failed message handling with replay capability
- **Idempotency** - Prevents duplicate processing using unique event IDs
- **Health Checks** - Comprehensive service monitoring
- **Circuit Breaker Pattern** - Graceful degradation under load

### Scalability:
- **Microservices** - Independent service scaling and deployment
- **Message Queues** - Handle high concurrency with RabbitMQ
- **Docker** - Consistent deployment across environments
- **TypeScript** - Type safety and maintainability
- **Event-Driven Architecture** - Loose coupling between services


