import { Router, Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { asyncHandler } from '@ecommerce/event-types';
import { channel } from '../rabbitmq';
import { NotificationTemplate } from '../models/notification-template.model';

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

// Send custom notification (direct message)
router.post('/notifications', asyncHandler(async (req: Request, res: Response) => {
  const { recipient, subject, message, type = 'email' } = req.body;
  
  if (!recipient || !subject || !message) {
    res.status(400).json({ message: 'recipient, subject, and message are required' });
    return;
  }
  
  const result = await notificationService.sendCustomNotification(recipient, subject, message);
  res.json(result);
}));

// Send template-based notification
router.post('/notifications/template', asyncHandler(async (req: Request, res: Response) => {
  const { type, recipient, template, variables } = req.body;
  
  if (!recipient || !template) {
    res.status(400).json({ message: 'recipient and template are required' });
    return;
  }
  
  try {
    // Find the template
    const templateDoc = await NotificationTemplate.findOne({ name: template });
    if (!templateDoc) {
      res.status(404).json({ message: `Template '${template}' not found` });
      return;
    }
    
    // Render the template with variables
    let content = templateDoc.content;
    let subject = templateDoc.subject;
    
    if (variables) {
      // Replace variables in content
      Object.keys(variables).forEach(key => {
        const placeholder = `{{${key}}}`;
        content = content.replace(new RegExp(placeholder, 'g'), variables[key]);
        if (subject) {
          subject = subject.replace(new RegExp(placeholder, 'g'), variables[key]);
        }
      });
    }
    
    // Send the notification
    const result = await notificationService.sendCustomNotification(recipient, subject || 'Notification', content, templateDoc.type);
    res.json({
      ...result,
      template: template,
      renderedContent: content,
      renderedSubject: subject
    });
    
  } catch (error) {
    console.error('Error sending template notification:', error);
    res.status(500).json({ message: 'Failed to send template notification', error: error instanceof Error ? error.message : String(error) });
  }
}));

// Get notification templates
router.get('/templates', asyncHandler(async (req: Request, res: Response) => {
  try {
    const templates = await NotificationTemplate.find({}).select('name type subject content variables');
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ message: 'Failed to fetch templates' });
  }
}));

// Get specific template
router.get('/templates/:name', asyncHandler(async (req: Request, res: Response) => {
  try {
    const template = await NotificationTemplate.findOne({ name: req.params.name });
    if (!template) {
      res.status(404).json({ message: `Template '${req.params.name}' not found` });
      return;
    }
    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ message: 'Failed to fetch template' });
  }
}));

export default router; 