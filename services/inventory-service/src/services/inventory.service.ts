import { Inventory } from '../models/inventory.model';
import { InventoryStatusUpdatedEvent, OrderCreatedEvent, InsufficientInventoryError, ProductNotFoundError, ErrorFactory } from '@ecommerce/event-types';

export interface InventoryCheckResult {
  allAvailable: boolean;
  unavailableReason?: string;
}

export interface InventoryUpdateResult {
  success: boolean;
  status: 'SUCCESS' | 'FAILURE';
  reason?: string;
}

export class InventoryService {
  /**
   * Check if all products in an order have sufficient inventory
   */
  async checkInventoryAvailability(products: Array<{ productId: string; quantity: number }>): Promise<InventoryCheckResult> {
    try {
      for (const item of products) {
        const inventory = await Inventory.findOne({ productId: item.productId });
        if (!inventory) {
          throw new ProductNotFoundError(item.productId);
        }
        if (inventory.quantity < item.quantity) {
          throw new InsufficientInventoryError(item.productId, item.quantity, inventory.quantity);
        }
      }
      return { allAvailable: true };
    } catch (error) {
      // Re-throw if it's already an EcommerceError
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      
      throw ErrorFactory.database('Failed to check inventory availability', { 
        products, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Deduct inventory for products
   */
  async deductInventory(products: Array<{ productId: string; quantity: number }>): Promise<void> {
    try {
      for (const item of products) {
        await Inventory.updateOne(
          { productId: item.productId },
          { $inc: { quantity: -item.quantity } }
        );
      }
    } catch (error) {
      throw ErrorFactory.database('Failed to deduct inventory', { 
        products, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Process an order and return the result
   */
  async processOrder(orderEvent: OrderCreatedEvent): Promise<InventoryUpdateResult> {
    try {
      const { orderId, products } = orderEvent.payload;
      
      // Check inventory availability
      await this.checkInventoryAvailability(products);
      
      // Deduct inventory
      await this.deductInventory(products);
      
      return {
        success: true,
        status: 'SUCCESS'
      };
    } catch (error) {
      console.error('Error processing order:', error);
      
      // Re-throw if it's already an EcommerceError
      if (error instanceof Error && 'code' in error) {
        const reason = error.message;
        return {
          success: false,
          status: 'FAILURE',
          reason
        };
      }
      
      throw ErrorFactory.database('Failed to process order', { 
        orderId: orderEvent.payload.orderId, 
        products: orderEvent.payload.products,
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Get inventory for a specific product
   */
  async getInventory(productId: string): Promise<any> {
    try {
      const inventory = await Inventory.findOne({ productId });
      if (!inventory) {
        throw new ProductNotFoundError(productId);
      }
      return inventory;
    } catch (error) {
      // Re-throw if it's already an EcommerceError
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      
      throw ErrorFactory.database('Failed to get inventory', { 
        productId, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Add inventory to a product
   */
  async addInventory(productId: string, quantity: number): Promise<void> {
    try {
      const result = await Inventory.updateOne(
        { productId },
        { $inc: { quantity } },
        { upsert: true }
      );
      
      if (result.matchedCount === 0 && result.upsertedCount === 0) {
        throw new ProductNotFoundError(productId);
      }
    } catch (error) {
      // Re-throw if it's already an EcommerceError
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      
      throw ErrorFactory.database('Failed to add inventory', { 
        productId, 
        quantity, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Get inventory summary
   */
  async getInventorySummary(): Promise<{ total: number; products: any[] }> {
    try {
      const products = await Inventory.find({}).sort({ productId: 1 });
      const total = products.reduce((sum, product) => sum + product.quantity, 0);
      
      return {
        total,
        products: products.map(p => ({
          productId: p.productId,
          quantity: p.quantity,
          name: p.name
        }))
      };
    } catch (error) {
      throw ErrorFactory.database('Failed to get inventory summary', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }
} 