import { NotificationTemplate } from '../models/notification-template.model';

export interface SeedTemplate {
  name: string;
  type: 'email' | 'sms' | 'push';
  subject?: string;
  content: string;
  variables: string[];
}

export class NotificationSeeder {
  /**
   * Seed notification templates
   */
  static async seedTemplates(templates: SeedTemplate[]): Promise<void> {
    try {
      console.log('Seeding notification templates...');
      
      for (const template of templates) {
        await NotificationTemplate.updateOne(
          { name: template.name },
          { 
            $set: { 
              type: template.type,
              subject: template.subject,
              content: template.content,
              variables: template.variables
            }
          },
          { upsert: true }
        );
        console.log(`✓ Seeded template ${template.name}: ${template.type}`);
      }
      
      console.log('Notification templates seeding completed!');
    } catch (error) {
      console.error('Error seeding notification templates:', error);
      throw error;
    }
  }

  /**
   * Seed default notification templates
   */
  static async seedDefaultTemplates(): Promise<void> {
    const defaultTemplates: SeedTemplate[] = [
      {
        name: 'order-success',
        type: 'email',
        subject: 'Order Confirmed - Your order has been processed successfully',
        content: 'Dear {{userName}}, your order {{orderId}} has been confirmed and is being prepared for shipment. Total: ${{totalPrice}}',
        variables: ['userName', 'orderId', 'totalPrice']
      },
      {
        name: 'order-failure',
        type: 'email',
        subject: 'Order Failed - We encountered an issue with your order',
        content: 'Dear {{userName}}, we encountered an issue processing your order {{orderId}}. Reason: {{reason}}. Please try again or contact support.',
        variables: ['userName', 'orderId', 'reason']
      },
      {
        name: 'order-status-update',
        type: 'sms',
        content: 'Order {{orderId}} status updated to {{status}}. Track at: {{trackingUrl}}',
        variables: ['orderId', 'status', 'trackingUrl']
      },
      {
        name: 'inventory-alert',
        type: 'push',
        content: 'Low stock alert: {{productName}} is running low ({{quantity}} remaining)',
        variables: ['productName', 'quantity']
      }
    ];
    
    await this.seedTemplates(defaultTemplates);
  }

  /**
   * Clear all notification templates
   */
  static async clearTemplates(): Promise<void> {
    try {
      await NotificationTemplate.deleteMany({});
      console.log('Notification templates cleared');
    } catch (error) {
      console.error('Error clearing notification templates:', error);
      throw error;
    }
  }

  /**
   * Get current templates summary
   */
  static async getTemplatesSummary(): Promise<{ total: number; templates: any[] }> {
    try {
      const templates = await NotificationTemplate.find({}).sort({ name: 1 });
      
      return {
        total: templates.length,
        templates: templates.map(t => ({
          name: t.name,
          type: t.type,
          subject: t.subject,
          variables: t.variables
        }))
      };
    } catch (error) {
      console.error('Error getting templates summary:', error);
      return { total: 0, templates: [] };
    }
  }
} 