import { Router, Request, Response } from 'express';
import { InventoryService } from '../services/inventory.service';
import mongoose from 'mongoose';
import { channel } from '../rabbitmq';

const router = Router();
const inventoryService = new InventoryService();

// Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'inventory-service',
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
      service: 'inventory-service',
      error: 'Health check failed'
    });
  }
});

// Get inventory for a product
router.get('/inventory/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const quantity = await inventoryService.getInventory(productId);
    
    res.status(200).json({
      productId,
      quantity,
      available: quantity > 0
    });
  } catch (error) {
    console.error('Error getting inventory:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Add inventory for a product
router.post('/inventory/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { quantity, name } = req.body;
    
    if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
      return res.status(400).json({ message: 'Valid quantity is required' });
    }
    
    await inventoryService.addInventory(productId, quantity);
    
    res.status(200).json({
      message: `Added ${quantity} units to product ${productId}`,
      productId,
      quantity
    });
  } catch (error) {
    console.error('Error adding inventory:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get inventory summary
router.get('/inventory', async (req: Request, res: Response) => {
  try {
    const summary = await inventoryService.getInventorySummary();
    res.status(200).json(summary);
  } catch (error) {
    console.error('Error getting inventory summary:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router; 