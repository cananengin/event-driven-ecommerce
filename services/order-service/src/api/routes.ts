import { Router, Request, Response } from 'express';
import { OrderService } from '../services/order.service';
import { publishOrderCreated } from '../events/publishers';
import mongoose from 'mongoose';
import { channel } from '../rabbitmq';

const router = Router();
const orderService = new OrderService();

// Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'order-service',
      error: 'Health check failed'
    });
  }
});

router.post('/orders', async (req: Request, res: Response) => {
  try {
    const { userId, products, totalPrice } = req.body;
    
    // Create order using the service layer
    const result = await orderService.createOrder({ userId, products, totalPrice });
    
    if (!result.success) {
      return res.status(500).json({ message: result.error });
    }
    
    // Publish event
    publishOrderCreated(result.order!);
    
    res.status(201).json({ 
      message: 'Order created and is being processed.', 
      orderId: result.order!._id 
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/orders/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const order = await orderService.getOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.status(200).json(order);
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/orders', async (req: Request, res: Response) => {
  try {
    const { userId, status } = req.query;
    
    let orders;
    if (userId) {
      orders = await orderService.getOrdersByUserId(userId as string);
    } else {
      orders = await orderService.getOrders(status as string);
    }
    
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.delete('/orders/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }
    
    const result = await orderService.cancelOrder(orderId, userId);
    
    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }
    
    res.status(200).json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
