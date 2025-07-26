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
  userId?: string;
  notificationType?: string;
  templateName?: string;
  [key: string]: any;
}

export class Logger {
  private static currentLevel: LogLevel = LogLevel.INFO;
  private static serviceName: string = 'notification-service';

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
   * Log notification sending
   */
  static logNotificationSent(
    type: string,
    recipient: string,
    templateName: string,
    context?: LogContext
  ): void {
    this.info(`Notification sent: ${type} to ${recipient} using template ${templateName}`, {
      notificationType: type,
      recipient,
      templateName,
      ...context
    });
  }

  /**
   * Log notification failure
   */
  static logNotificationFailed(
    type: string,
    recipient: string,
    reason: string,
    context?: LogContext
  ): void {
    this.error(`Notification failed: ${type} to ${recipient} - ${reason}`, undefined, {
      notificationType: type,
      recipient,
      reason,
      ...context
    });
  }

  /**
   * Log template processing
   */
  static logTemplateProcessing(
    templateName: string,
    variables: string[],
    context?: LogContext
  ): void {
    this.debug(`Processing template ${templateName} with ${variables.length} variables`, {
      templateName,
      variableCount: variables.length,
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
   * Log DLQ operations
   */
  static logDLQOperation(operation: string, messageCount: number, context?: LogContext): void {
    this.info(`DLQ ${operation}: ${messageCount} messages`, {
      operation,
      messageCount,
      ...context
    });
  }
} 