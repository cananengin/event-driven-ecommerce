import { Inventory } from '../models/inventory.model';
import { InventoryStatusUpdatedEvent, OrderCreatedEvent } from '@ecommerce/event-types';

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
    for (const item of products) {
      const inventory = await Inventory.findOne({ productId: item.productId });
      if (!inventory || inventory.quantity < item.quantity) {
        return {
          allAvailable: false,
          unavailableReason: `Product ${item.productId} is out of stock or insufficient quantity.`
        };
      }
    }
    return { allAvailable: true };
  }

  /**
   * Deduct inventory for all products in an order
   */
  async deductInventory(products: Array<{ productId: string; quantity: number }>): Promise<void> {
    for (const item of products) {
      await Inventory.updateOne(
        { productId: item.productId },
        { $inc: { quantity: -item.quantity } }
      );
    }
  }

  /**
   * Process an order and return the result
   */
  async processOrder(orderEvent: OrderCreatedEvent): Promise<InventoryUpdateResult> {
    const { orderId, products } = orderEvent.payload;
    
    // Check inventory availability
    const checkResult = await this.checkInventoryAvailability(products);
    
    if (checkResult.allAvailable) {
      // Deduct inventory
      await this.deductInventory(products);
      return {
        success: true,
        status: 'SUCCESS'
      };
    } else {
      return {
        success: false,
        status: 'FAILURE',
        reason: checkResult.unavailableReason
      };
    }
  }

  /**
   * Get current inventory for a product
   */
  async getInventory(productId: string): Promise<number> {
    const inventory = await Inventory.findOne({ productId });
    return inventory ? inventory.quantity : 0;
  }

  /**
   * Add inventory for a product
   */
  async addInventory(productId: string, quantity: number): Promise<void> {
    await Inventory.updateOne(
      { productId },
      { $inc: { quantity } },
      { upsert: true }
    );
  }

  /**
   * Get inventory summary for all products
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
      console.error('Error getting inventory summary:', error);
      return { total: 0, products: [] };
    }
  }
} 