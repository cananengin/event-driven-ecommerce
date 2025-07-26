import { ConsumeMessage } from 'amqplib';
import { InventoryStatusUpdatedEvent } from '@ecommerce/event-types';
import { OrderService } from '../services/order.service';
import { publishOrderStatusUpdated } from './publishers';

const orderService = new OrderService();

export async function handleInventoryStatusUpdate(msg: ConsumeMessage) {
  try {
    const event: InventoryStatusUpdatedEvent = JSON.parse(msg.content.toString());
    
    // Update order status using the service layer
    const result = await orderService.updateOrderStatusFromInventoryUpdate(event);
    
    if (!result.success) {
      console.error('Failed to update order status:', result.error);
      return;
    }
    
    if (result.order && (result.order.status === 'CONFIRMED' || result.order.status === 'CANCELLED')) {
      // Publish order status updated event
      publishOrderStatusUpdated(result.order.id, result.order.status, result.order.userId);
    }
  } catch (error) {
    console.error('Error handling inventory.status.updated event:', error);
  }
}
