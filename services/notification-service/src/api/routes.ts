import { Router, Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { asyncHandler } from '@ecommerce/event-types';
import { channel } from '../rabbitmq';

const router = Router();
const notificationService = new NotificationService();

// Health check endpoint
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'notification-service',
    checks: {
      rabbitmq: 'unknown'
    }
  };

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

// Send custom notification
router.post('/notifications', asyncHandler(async (req: Request, res: Response) => {
  const { recipient, subject, message, type = 'email' } = req.body;
  
  if (!recipient || !subject || !message) {
    res.status(400).json({ message: 'recipient, subject, and message are required' });
    return;
  }
  
  const result = await notificationService.sendCustomNotification(recipient, subject, message);
  res.json(result);
}));

// Get notification templates
router.get('/templates', asyncHandler(async (req: Request, res: Response) => {
  const templates = [
    {
      name: 'order-success',
      type: 'email',
      subject: 'Order Confirmed',
      content: 'Your order {{orderId}} has been confirmed and is being processed.'
    },
    {
      name: 'order-failure',
      type: 'email',
      subject: 'Order Failed',
      content: 'Your order {{orderId}} failed: {{reason}}'
    }
  ];
  
  res.json(templates);
}));

export default router; 