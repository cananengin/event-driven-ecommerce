export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogContext {
  service?: string;
  operation?: string;
  orderId?: string;
  productId?: string;
  userId?: string;
  [key: string]: any;
}

export class Logger {
  private static currentLevel: LogLevel = LogLevel.INFO;
  private static serviceName: string = 'inventory-service';

  /**
   * Set log level
   */
  static setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  /**
   * Set service name for logging
   */
  static setServiceName(name: string): void {
    this.serviceName = name;
  }

  /**
   * Format log message
   */
  private static formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] [${this.serviceName}] ${message}${contextStr}`;
  }

  /**
   * Debug log
   */
  static debug(message: string, context?: LogContext): void {
    if (this.currentLevel <= LogLevel.DEBUG) {
      console.debug(this.formatMessage('DEBUG', message, context));
    }
  }

  /**
   * Info log
   */
  static info(message: string, context?: LogContext): void {
    if (this.currentLevel <= LogLevel.INFO) {
      console.info(this.formatMessage('INFO', message, context));
    }
  }

  /**
   * Warn log
   */
  static warn(message: string, context?: LogContext): void {
    if (this.currentLevel <= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', message, context));
    }
  }

  /**
   * Error log
   */
  static error(message: string, error?: Error, context?: LogContext): void {
    if (this.currentLevel <= LogLevel.ERROR) {
      const errorContext = {
        ...context,
        ...(error && {
          errorName: error.name,
          errorMessage: error.message,
          errorStack: error.stack
        })
      };
      console.error(this.formatMessage('ERROR', message, errorContext));
    }
  }

  /**
   * Log inventory operation
   */
  static logInventoryOperation(operation: string, productId: string, quantity: number, context?: LogContext): void {
    this.info(`Inventory ${operation}: ${quantity} units for product ${productId}`, {
      operation,
      productId,
      quantity,
      ...context
    });
  }

  /**
   * Log order processing
   */
  static logOrderProcessing(orderId: string, status: string, context?: LogContext): void {
    this.info(`Order ${orderId} processed with status: ${status}`, {
      orderId,
      status,
      ...context
    });
  }

  /**
   * Log event processing
   */
  static logEventProcessing(eventType: string, eventId: string, context?: LogContext): void {
    this.debug(`Processing event ${eventType}: ${eventId}`, {
      eventType,
      eventId,
      ...context
    });
  }

  /**
   * Log database operation
   */
  static logDatabaseOperation(operation: string, collection: string, context?: LogContext): void {
    this.debug(`Database ${operation} on ${collection}`, {
      operation,
      collection,
      ...context
    });
  }
} 