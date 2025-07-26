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
  async sendCustomNotification(recipient: string, subject: string, message: string): Promise<NotificationResult> {
    try {
      // Validate recipient
      if (!this.isValidRecipient(recipient)) {
        throw new InvalidRecipientError(recipient, 'email');
      }

      // In a real implementation, this would integrate with email/SMS services
      console.log(`[Custom Notification] To: ${recipient}, Subject: ${subject}, Message: ${message}`);
      
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
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Validate recipient format
   */
  private isValidRecipient(recipient: string): boolean {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(recipient);
  }
} 