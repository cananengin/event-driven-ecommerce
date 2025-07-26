import { Order, IOrder } from '../models/order.model';
import { ProcessedEvent } from '../models/processed-event.model';
import { OrderCreatedEvent, InventoryStatusUpdatedEvent, OrderNotFoundError, OrderCancellationError, EventAlreadyProcessedError, ErrorFactory } from '@ecommerce/event-types';

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
      throw ErrorFactory.database('Failed to create order', { orderData, error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<IOrder | null> {
    try {
      return await Order.findById(orderId);
    } catch (error) {
      console.error('Error getting order by ID:', error);
      throw ErrorFactory.database('Failed to retrieve order', { orderId, error: error instanceof Error ? error.message : String(error) });
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
        throw new EventAlreadyProcessedError(eventId);
      }

      console.log(`[v] Received inventory.status.updated for order ${payload.orderId}`);
      
      const order = await Order.findById(payload.orderId);
      if (!order) {
        throw new OrderNotFoundError(payload.orderId);
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
      
      // Re-throw if it's already an EcommerceError
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      
      throw ErrorFactory.database('Failed to update order status', { 
        eventId: event.eventId, 
        orderId: event.payload.orderId,
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Get orders by user ID
   */
  async getOrdersByUserId(userId: string): Promise<IOrder[]> {
    try {
      return await Order.find({ userId }).sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error getting orders by user ID:', error);
      throw ErrorFactory.database('Failed to retrieve user orders', { userId, error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Get all orders with optional filters
   */
  async getOrders(filter: { userId?: string; status?: string } = {}): Promise<IOrder[]> {
    try {
      return await Order.find(filter).sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error getting orders:', error);
      throw ErrorFactory.database('Failed to retrieve orders', { filter, error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const order = await Order.findOne({ _id: orderId, userId });
      
      if (!order) {
        throw new OrderNotFoundError(orderId);
      }

      if (order.status === 'CANCELLED') {
        throw new OrderCancellationError(orderId, 'Order is already cancelled');
      }

      if (order.status === 'CONFIRMED') {
        throw new OrderCancellationError(orderId, 'Cannot cancel confirmed order');
      }

      order.status = 'CANCELLED';
      await order.save();
      
      return { success: true };
    } catch (error) {
      console.error('Error cancelling order:', error);
      
      // Re-throw if it's already an EcommerceError
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      
      throw ErrorFactory.database('Failed to cancel order', { 
        orderId, 
        userId,
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }
} 