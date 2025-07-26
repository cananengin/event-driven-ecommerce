import { InventoryStatusUpdatedEvent, TemplateNotFoundError, InvalidRecipientError, ErrorFactory } from '@ecommerce/event-types';

export interface NotificationResult {
  success: boolean;
  message: string;
  type: 'SUCCESS' | 'FAILURE';
}

export class NotificationService {
  /**
   * Send a notification for order success
   */
  async sendSuccessNotification(orderId: string): Promise<NotificationResult> {
    try {
      // In a real implementation, this would send email, SMS, push notification, etc.
      const message = `Order ${orderId} has been confirmed and is being processed.`;
      console.log(`[Notification] ${message}`);
      
      return {
        success: true,
        message,
        type: 'SUCCESS'
      };
    } catch (error) {
      console.error('Error sending success notification:', error);
      throw ErrorFactory.notification('Failed to send success notification', { 
        orderId, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Send a notification for order failure
   */
  async sendFailureNotification(orderId: string, reason: string): Promise<NotificationResult> {
    try {
      // In a real implementation, this would send email, SMS, push notification, etc.
      const message = `Order ${orderId} failed: ${reason}`;
      console.log(`[Notification] ${message}`);
      
      return {
        success: true,
        message,
        type: 'FAILURE'
      };
    } catch (error) {
      console.error('Error sending failure notification:', error);
      throw ErrorFactory.notification('Failed to send failure notification', { 
        orderId, 
        reason, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Process inventory status update and send appropriate notification
   */
  async processInventoryStatusUpdate(event: InventoryStatusUpdatedEvent): Promise<NotificationResult> {
    try {
      const { payload } = event;
      
      if (payload.status === 'SUCCESS') {
        return await this.sendSuccessNotification(payload.orderId);
      } else {
        return await this.sendFailureNotification(payload.orderId, payload.reason || 'Unknown error');
      }
    } catch (error) {
      console.error('Error processing inventory status update:', error);
      
      // Re-throw if it's already an EcommerceError
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      
      throw ErrorFactory.notification('Failed to process inventory status update', { 
        orderId: event.payload.orderId, 
        status: event.payload.status,
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Send a custom notification
   */
  async sendCustomNotification(recipient: string, subject: string, message: string, type: 'email' | 'sms' | 'push' = 'email'): Promise<NotificationResult> {
    try {
      // Validate recipient based on type
      if (!this.isValidRecipient(recipient, type)) {
        throw new InvalidRecipientError(recipient, type);
      }

      // In a real implementation, this would integrate with email/SMS services
      console.log(`[Custom Notification] Type: ${type}, To: ${recipient}, Subject: ${subject}, Message: ${message}`);
      
      return {
        success: true,
        message: 'Custom notification sent successfully',
        type: 'SUCCESS'
      };
    } catch (error) {
      console.error('Error sending custom notification:', error);
      
      // Re-throw if it's already an EcommerceError
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      
      throw ErrorFactory.notification('Failed to send custom notification', { 
        recipient, 
        subject,
        type,
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Validate recipient format based on notification type
   */
  private isValidRecipient(recipient: string, type: 'email' | 'sms' | 'push'): boolean {
    switch (type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(recipient);
      
      case 'sms':
        // Basic phone number validation (international format)
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        return phoneRegex.test(recipient.replace(/[\s\-\(\)]/g, ''));
      
      case 'push':
        // For push notifications, recipient could be device token, user ID, etc.
        // For now, accept any non-empty string
        return Boolean(recipient && recipient.trim().length > 0);
      
      default:
        return false;
    }
  }
} 