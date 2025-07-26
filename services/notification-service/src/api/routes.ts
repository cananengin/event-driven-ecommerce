import { Router, Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { channel } from '../rabbitmq';

const router = Router();
const notificationService = new NotificationService();

// Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'notification-service',
      error: 'Health check failed'
    });
  }
});

// Send custom notification
router.post('/notifications', async (req: Request, res: Response) => {
  try {
    const { recipient, subject, message, type = 'email' } = req.body;
    
    if (!recipient || !message) {
      return res.status(400).json({ message: 'Recipient and message are required' });
    }
    
    const result = await notificationService.sendCustomNotification(recipient, subject, message);
    
    if (!result.success) {
      return res.status(500).json({ message: result.message });
    }
    
    res.status(200).json({
      message: 'Notification sent successfully',
      type,
      recipient
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get notification templates
router.get('/templates', async (req: Request, res: Response) => {
  try {
    // This would typically fetch from a database
    const templates = [
      {
        name: 'order-success',
        type: 'email',
        subject: 'Order Confirmed',
        content: 'Dear {{userName}}, your order {{orderId}} has been confirmed.'
      },
      {
        name: 'order-failure',
        type: 'email',
        subject: 'Order Failed',
        content: 'Dear {{userName}}, we encountered an issue with your order {{orderId}}.'
      }
    ];
    
    res.status(200).json(templates);
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router; 