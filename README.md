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

```bash
# Test Order Service
cd services/order-service && npm test

# Test Inventory Service  
cd ../inventory-service && npm test

# Test Notification Service
cd ../notification-service && npm test
```

## Monitoring

### View Logs:
```bash
# Watch logs in real-time
docker logs -f order-service
docker logs -f inventory-service
docker logs -f notification-service

# Check RabbitMQ Management UI
open http://localhost:15672
```

### Database Access:
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
- **Retry Logic** - Automatic retry on failures
- **Dead Letter Queue** - Failed message handling
- **Idempotency** - Prevents duplicate processing
- **Health Checks** - Service monitoring

### Scalability:
- **Microservices** - Independent service scaling
- **Message Queues** - Handle high concurrency
- **Docker** - Consistent deployment
- **TypeScript** - Type safety and maintainability


