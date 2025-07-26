import { channel, EXCHANGE_NAME } from '../rabbitmq';
import { v4 as uuidv4 } from 'uuid';
import { OrderCreatedEvent, OrderStatusUpdatedEvent } from '@ecommerce/event-types';
import { IOrder } from '../models/order.model';

export function publishOrderCreated(order: IOrder) {
  const event: OrderCreatedEvent = {
    eventId: uuidv4(), version: '1.0', source: 'order-service', timestamp: new Date().toISOString(),
    type: 'order.created',
    payload: {
      orderId: order._id.toString(), userId: order.userId, products: order.products, totalPrice: order.totalPrice
    },
  };
  channel.publish(EXCHANGE_NAME, 'order.created', Buffer.from(JSON.stringify(event)));
  console.log(`[x] Sent order.created: '${event.eventId}'`);
}

export function publishOrderStatusUpdated(orderId: string, status: 'CONFIRMED' | 'CANCELLED', userId: string) {
  const event: OrderStatusUpdatedEvent = {
    eventId: uuidv4(), version: '1.0', source: 'order-service', timestamp: new Date().toISOString(),
    type: 'order.status.updated',
    payload: { orderId, status, userId }
  };
  channel.publish(EXCHANGE_NAME, 'order.status.updated', Buffer.from(JSON.stringify(event)));
  console.log(`[x] Sent order.status.updated: '${event.eventId}' for order ${orderId}`);
}
