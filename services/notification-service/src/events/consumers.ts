import { ConsumeMessage } from 'amqplib';
import { InventoryStatusUpdatedEvent } from '@ecommerce/event-types';
import { NotificationService } from '../services/notification.service';

const notificationService = new NotificationService();

export async function handleInventoryStatusUpdated(msg: ConsumeMessage) {
  try {
    const event: InventoryStatusUpdatedEvent = JSON.parse(msg.content.toString());
    
    // Process the notification using the service layer
    const result = await notificationService.processInventoryStatusUpdate(event);
    
    if (!result.success) {
      console.error('Failed to send notification:', result.message);
    }
  } catch (error) {
    console.error('Error handling inventory.status.updated event:', error);
  }
} 