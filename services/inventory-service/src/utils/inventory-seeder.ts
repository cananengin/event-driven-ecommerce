import { Inventory } from '../models/inventory.model';

export interface SeedProduct {
  productId: string;
  quantity: number;
  name?: string;
}

export class InventorySeeder {
  /**
   * Seed initial inventory data
   */
  static async seedInventory(products: SeedProduct[]): Promise<void> {
    try {
      console.log('Seeding inventory data...');
      
      for (const product of products) {
        await Inventory.updateOne(
          { productId: product.productId },
          { 
            $set: { 
              quantity: product.quantity,
              ...(product.name && { name: product.name })
            }
          },
          { upsert: true }
        );
        console.log(`✓ Seeded product ${product.productId}: ${product.quantity} units`);
      }
      
      console.log('Inventory seeding completed!');
    } catch (error) {
      console.error('Error seeding inventory:', error);
      throw error;
    }
  }

  /**
   * Seed default test inventory
   */
  static async seedDefaultInventory(): Promise<void> {
    const defaultProducts: SeedProduct[] = [
      { productId: 'prod1', quantity: 100, name: 'Laptop' },
      { productId: 'prod2', quantity: 50, name: 'Mouse' },
      { productId: 'prod3', quantity: 200, name: 'Keyboard' },
      { productId: 'prod4', quantity: 75, name: 'Monitor' },
      { productId: 'prod5', quantity: 25, name: 'Headphones' }
    ];
    
    await this.seedInventory(defaultProducts);
  }

  /**
   * Clear all inventory data
   */
  static async clearInventory(): Promise<void> {
    try {
      await Inventory.deleteMany({});
      console.log('Inventory data cleared');
    } catch (error) {
      console.error('Error clearing inventory:', error);
      throw error;
    }
  }

  /**
   * Get current inventory summary
   */
  static async getInventorySummary(): Promise<{ total: number; products: any[] }> {
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