export interface BaseEvent {
  eventId: string;
  version: string;
  source: string;
  timestamp: string;
}

export interface OrderCreatedEvent extends BaseEvent {
  type: 'order.created';
  payload: {
    orderId: string;
    userId: string;
    products: { productId: string; quantity: number }[];
    totalPrice: number;
  };
}

export interface InventoryStatusUpdatedEvent extends BaseEvent {
  type: 'inventory.status.updated';
  payload: {
    orderId: string;
    status: 'SUCCESS' | 'FAILURE';
    reason?: string;
  };
}

export interface OrderStatusUpdatedEvent extends BaseEvent {
  type: 'order.status.updated';
  payload: {
    orderId: string;
    status: 'CONFIRMED' | 'CANCELLED';
    userId: string;
  };
}

export type AppEvent = OrderCreatedEvent | InventoryStatusUpdatedEvent | OrderStatusUpdatedEvent;
