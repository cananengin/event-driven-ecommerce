import { channel, EXCHANGE_NAME } from '../rabbitmq';
import { v4 as uuidv4 } from 'uuid';
import { InventoryStatusUpdatedEvent } from '@ecommerce/event-types';

export function publishInventoryStatusUpdated(
  orderId: string, 
  status: 'SUCCESS' | 'FAILURE', 
  reason?: string
) {
  const event: InventoryStatusUpdatedEvent = {
    eventId: uuidv4(),
    version: '1.0',
    source: 'inventory-service',
    timestamp: new Date().toISOString(),
    type: 'inventory.status.updated',
    payload: {
      orderId,
      status,
      ...(reason ? { reason } : {})
    }
  };
  
  channel.publish(EXCHANGE_NAME, 'inventory.status.updated', Buffer.from(JSON.stringify(event)));
  console.log(`[x] Sent inventory.status.updated for order ${orderId}: ${status}`);
} 