import { ConsumeMessage } from 'amqplib';
import { OrderCreatedEvent } from '@ecommerce/event-types';
import { InventoryService } from '../services/inventory.service';
import { publishInventoryStatusUpdated } from './publishers';

const inventoryService = new InventoryService();

export async function handleOrderCreated(msg: ConsumeMessage) {
  try {
    const event: OrderCreatedEvent = JSON.parse(msg.content.toString());
    const { orderId } = event.payload;
    
    // Process the order using the service layer
    const result = await inventoryService.processOrder(event);

    // Publish inventory.status.updated event using the publisher
    publishInventoryStatusUpdated(orderId, result.status, result.reason);
  } catch (error) {
    console.error('Error handling order.created event:', error);
  }
} 