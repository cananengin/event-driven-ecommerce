import { Order, IOrder } from '../models/order.model';
import { ProcessedEvent } from '../models/processed-event.model';
import { OrderCreatedEvent, InventoryStatusUpdatedEvent } from '@ecommerce/event-types';

export interface CreateOrderRequest {
  userId: string;
  products: Array<{ productId: string; quantity: number }>;
  totalPrice: number;
}

export interface CreateOrderResult {
  success: boolean;
  order?: IOrder;
  error?: string;
}

export interface UpdateOrderStatusResult {
  success: boolean;
  order?: IOrder;
  error?: string;
}

export class OrderService {
  /**
   * Create a new order
   */
  async createOrder(orderData: CreateOrderRequest): Promise<CreateOrderResult> {
    try {
      const newOrder = new Order({
        ...orderData,
        status: 'PENDING'
      });
      
      await newOrder.save();
      
      return {
        success: true,
        order: newOrder
      };
    } catch (error) {
      console.error('Error creating order:', error);
      return {
        success: false,
        error: 'Failed to create order'
      };
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<IOrder | null> {
    try {
      return await Order.findById(orderId);
    } catch (error) {
      console.error('Error getting order:', error);
      return null;
    }
  }

  /**
   * Update order status based on inventory status update
   */
  async updateOrderStatusFromInventoryUpdate(event: InventoryStatusUpdatedEvent): Promise<UpdateOrderStatusResult> {
    try {
      const { eventId, payload } = event;

      // Check if event was already processed (idempotency)
      if (await ProcessedEvent.findOne({ eventId })) {
        console.log(`Event ${eventId} already processed. Skipping.`);
        return {
          success: true
        };
      }

      console.log(`[v] Received inventory.status.updated for order ${payload.orderId}`);
      
      const order = await Order.findById(payload.orderId);
      if (!order) {
        return {
          success: false,
          error: 'Order not found'
        };
      }

      // Update order status based on inventory result
      order.status = payload.status === 'SUCCESS' ? 'CONFIRMED' : 'CANCELLED';
      await order.save();
      
      console.log(`Order ${payload.orderId} status updated to ${order.status}`);

      // Mark event as processed
      await ProcessedEvent.create({ eventId });

      return {
        success: true,
        order
      };
    } catch (error) {
      console.error('Error updating order status:', error);
      return {
        success: false,
        error: 'Failed to update order status'
      };
    }
  }

  /**
   * Get all orders for a user
   */
  async getOrdersByUserId(userId: string): Promise<IOrder[]> {
    try {
      return await Order.find({ userId }).sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error getting user orders:', error);
      return [];
    }
  }

  /**
   * Get all orders with optional status filter
   */
  async getOrders(status?: string): Promise<IOrder[]> {
    try {
      const filter = status ? { status } : {};
      return await Order.find(filter).sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error getting orders:', error);
      return [];
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string, userId: string): Promise<UpdateOrderStatusResult> {
    try {
      const order = await Order.findOne({ _id: orderId, userId });
      if (!order) {
        return {
          success: false,
          error: 'Order not found or not authorized'
        };
      }

      if (order.status === 'CANCELLED') {
        return {
          success: false,
          error: 'Order is already cancelled'
        };
      }

      order.status = 'CANCELLED';
      await order.save();

      return {
        success: true,
        order
      };
    } catch (error) {
      console.error('Error cancelling order:', error);
      return {
        success: false,
        error: 'Failed to cancel order'
      };
    }
  }
} 