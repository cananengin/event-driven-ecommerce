import { Router, Request, Response } from 'express';
import { InventoryService } from '../services/inventory.service';
import { asyncHandler } from '@ecommerce/event-types';
import mongoose from 'mongoose';
import { channel } from '../rabbitmq';

const router = Router();
const inventoryService = new InventoryService();

// Health check endpoint
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
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
}));

// Get inventory for specific product
router.get('/inventory/:productId', asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  
  const inventory = await inventoryService.getInventory(productId);
  res.json(inventory);
}));

// Update inventory for specific product
router.post('/inventory/:productId', asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  
  if (typeof quantity !== 'number' || quantity < 0) {
    res.status(400).json({ message: 'Quantity must be a positive number' });
    return;
  }
  
  await inventoryService.addInventory(productId, quantity);
  res.json({ message: 'Inventory updated successfully' });
}));

// Get all inventory summary
router.get('/inventory', asyncHandler(async (req: Request, res: Response) => {
  const summary = await inventoryService.getInventorySummary();
  res.json(summary);
}));

export default router; 