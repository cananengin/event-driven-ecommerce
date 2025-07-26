/**
 * Base error class for the e-commerce system
 */
export abstract class EcommerceError extends Error {
  public readonly code: string;
  public statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON for logging/API responses
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      context: this.context,
      stack: this.stack
    };
  }
}

/**
 * Validation errors
 */
export class ValidationError extends EcommerceError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400, true, context);
  }
}

/**
 * Database errors
 */
export class DatabaseError extends EcommerceError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'DATABASE_ERROR', 500, true, context);
  }
}

/**
 * Order-related errors
 */
export class OrderError extends EcommerceError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'ORDER_ERROR', 400, true, context);
  }
}

export class OrderNotFoundError extends OrderError {
  constructor(orderId: string) {
    super(`Order not found: ${orderId}`, { orderId });
  }
}

export class OrderAlreadyExistsError extends OrderError {
  constructor(orderId: string) {
    super(`Order already exists: ${orderId}`, { orderId });
  }
}

export class OrderCancellationError extends OrderError {
  constructor(orderId: string, reason: string) {
    super(`Cannot cancel order: ${reason}`, { orderId, reason });
  }
}

/**
 * Inventory-related errors
 */
export class InventoryError extends EcommerceError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'INVENTORY_ERROR', 400, true, context);
  }
}

export class InsufficientInventoryError extends InventoryError {
  constructor(productId: string, requested: number, available: number) {
    super(
      `Insufficient inventory for product ${productId}: requested ${requested}, available ${available}`,
      { productId, requested, available }
    );
  }
}

export class ProductNotFoundError extends InventoryError {
  constructor(productId: string) {
    super(`Product not found: ${productId}`, { productId });
  }
}

/**
 * Notification-related errors
 */
export class NotificationError extends EcommerceError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'NOTIFICATION_ERROR', 500, true, context);
  }
}

export class TemplateNotFoundError extends NotificationError {
  constructor(templateName: string) {
    super(`Notification template not found: ${templateName}`, { templateName });
  }
}

export class InvalidRecipientError extends NotificationError {
  constructor(recipient: string, type: string) {
    super(`Invalid recipient for ${type}: ${recipient}`, { recipient, type });
  }
}

/**
 * Message queue errors
 */
export class MessageQueueError extends EcommerceError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'MESSAGE_QUEUE_ERROR', 500, true, context);
  }
}

export class ConnectionError extends MessageQueueError {
  constructor(service: string, context?: Record<string, any>) {
    super(`Failed to connect to ${service}`, { service, ...context });
  }
}

export class MessageProcessingError extends MessageQueueError {
  constructor(message: string, context?: Record<string, any>) {
    super(`Message processing failed: ${message}`, context);
  }
}

/**
 * Event-related errors
 */
export class EventError extends EcommerceError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'EVENT_ERROR', 500, true, context);
  }
}

export class EventAlreadyProcessedError extends EventError {
  constructor(eventId: string) {
    super(`Event already processed: ${eventId}`, { eventId });
  }
}

export class InvalidEventError extends EventError {
  constructor(eventType: string, reason: string) {
    super(`Invalid event ${eventType}: ${reason}`, { eventType, reason });
  }
}

/**
 * Service errors
 */
export class ServiceError extends EcommerceError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'SERVICE_ERROR', 500, true, context);
  }
}

export class ServiceUnavailableError extends ServiceError {
  constructor(service: string) {
    super(`Service unavailable: ${service}`, { service });
  }
}

/**
 * Authentication and authorization errors
 */
export class AuthenticationError extends EcommerceError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'AUTHENTICATION_ERROR', 401, true, context);
  }
}

export class AuthorizationError extends EcommerceError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'AUTHORIZATION_ERROR', 403, true, context);
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends EcommerceError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'RATE_LIMIT_ERROR', 429, true, context);
  }
}

/**
 * Error factory for creating errors with consistent structure
 */
export class ErrorFactory {
  /**
   * Create a validation error
   */
  static validation(message: string, context?: Record<string, any>): ValidationError {
    return new ValidationError(message, context);
  }

  /**
   * Create a database error
   */
  static database(message: string, context?: Record<string, any>): DatabaseError {
    return new DatabaseError(message, context);
  }

  /**
   * Create an order error
   */
  static order(message: string, context?: Record<string, any>): OrderError {
    return new OrderError(message, context);
  }

  /**
   * Create an inventory error
   */
  static inventory(message: string, context?: Record<string, any>): InventoryError {
    return new InventoryError(message, context);
  }

  /**
   * Create a notification error
   */
  static notification(message: string, context?: Record<string, any>): NotificationError {
    return new NotificationError(message, context);
  }

  /**
   * Create a message queue error
   */
  static messageQueue(message: string, context?: Record<string, any>): MessageQueueError {
    return new MessageQueueError(message, context);
  }

  /**
   * Create an event error
   */
  static event(message: string, context?: Record<string, any>): EventError {
    return new EventError(message, context);
  }

  /**
   * Create a service error
   */
  static service(message: string, context?: Record<string, any>): ServiceError {
    return new ServiceError(message, context);
  }
}

/**
 * Error handler utilities
 */
export class ErrorHandler {
  /**
   * Check if error is operational (expected) vs programming error
   */
  static isOperationalError(error: Error): boolean {
    if (error instanceof EcommerceError) {
      return error.isOperational;
    }
    return false;
  }

  /**
   * Convert any error to EcommerceError
   */
  static normalizeError(error: unknown): EcommerceError {
    if (error instanceof EcommerceError) {
      return error;
    }

    if (error instanceof Error) {
      return new ServiceError(error.message, { originalError: error.name });
    }

    return new ServiceError('Unknown error occurred', { originalError: String(error) });
  }

  /**
   * Create error response for API
   */
  static createErrorResponse(error: EcommerceError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        ...(error.context && { details: error.context })
      },
      timestamp: new Date().toISOString()
    };
  }
} 