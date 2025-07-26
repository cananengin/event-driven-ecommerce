import { Router, Request, Response } from 'express';
import { OrderService } from '../services/order.service';
import { publishOrderCreated } from '../events/publishers';
import { asyncHandler } from '@ecommerce/event-types';
import mongoose from 'mongoose';
import { channel } from '../rabbitmq';

const router = Router();
const orderService = new OrderService();

// Health check endpoint
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'order-service',
    checks: {
      database: 'unknown',
      rabbitmq: 'unknown'
    }
  };

  // Check MongoDB connection
  try {
    if (mongoose.connection.readyState === 1) {
      health.checks.database = 'connected';
    } else {
      health.checks.database = 'disconnected';
      health.status = 'unhealthy';
    }
  } catch (error) {
    health.checks.database = 'error';
    health.status = 'unhealthy';
  }

  // Check RabbitMQ connection
  try {
    if (channel && channel.connection) {
      health.checks.rabbitmq = 'connected';
    } else {
      health.checks.rabbitmq = 'disconnected';
      health.status = 'unhealthy';
    }
  } catch (error) {
    health.checks.rabbitmq = 'error';
    health.status = 'unhealthy';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
}));

// Create order
router.post('/orders', asyncHandler(async (req: Request, res: Response) => {
  const { userId, products, totalPrice } = req.body;
  
  // Create order using the service layer
  const result = await orderService.createOrder({ userId, products, totalPrice });
  
  // Publish event
  publishOrderCreated(result.order!);
  
  res.status(201).json({ 
    message: 'Order created and is being processed.', 
    orderId: result.order!._id 
  });
}));

// Get order by ID
router.get('/orders/:orderId', asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  
  const order = await orderService.getOrderById(orderId);
  if (!order) {
    res.status(404).json({ message: 'Order not found' });
    return;
  }
  
  res.json(order);
}));

// Get orders with filters
router.get('/orders', asyncHandler(async (req: Request, res: Response) => {
  const { userId, status } = req.query;
  const filter: { userId?: string; status?: string } = {};
  
  if (userId) filter.userId = userId as string;
  if (status) filter.status = status as string;
  
  const orders = await orderService.getOrders(filter);
  res.json(orders);
}));

// Cancel order
router.delete('/orders/:orderId', asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { userId } = req.body;
  
  if (!userId) {
    res.status(400).json({ message: 'userId is required' });
    return;
  }
  
  const result = await orderService.cancelOrder(orderId, userId);
  
  if (result.success) {
    res.json({ message: 'Order cancelled successfully' });
  } else {
    res.status(400).json({ message: result.error });
  }
}));

export default router;
