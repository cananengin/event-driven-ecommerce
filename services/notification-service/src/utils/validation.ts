export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class NotificationValidator {
  /**
   * Validate email address format
   */
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    
    if (!email || typeof email !== 'string') {
      errors.push('Email is required and must be a string');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push('Invalid email format');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate phone number format
   */
  static validatePhoneNumber(phone: string): ValidationResult {
    const errors: string[] = [];
    
    if (!phone || typeof phone !== 'string') {
      errors.push('Phone number is required and must be a string');
    } else {
      // Basic phone validation - can be enhanced for specific regions
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
      if (!phoneRegex.test(phone)) {
        errors.push('Invalid phone number format');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate notification type
   */
  static validateNotificationType(type: string): ValidationResult {
    const errors: string[] = [];
    const validTypes = ['email', 'sms', 'push'];
    
    if (!type || typeof type !== 'string') {
      errors.push('Notification type is required and must be a string');
    } else if (!validTypes.includes(type)) {
      errors.push(`Invalid notification type. Must be one of: ${validTypes.join(', ')}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate template variables
   */
  static validateTemplateVariables(
    requiredVariables: string[],
    providedVariables: Record<string, any>
  ): ValidationResult {
    const errors: string[] = [];
    
    for (const requiredVar of requiredVariables) {
      if (!(requiredVar in providedVariables) || providedVariables[requiredVar] === undefined) {
        errors.push(`Missing required variable: ${requiredVar}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate notification content
   */
  static validateContent(content: string, type: string): ValidationResult {
    const errors: string[] = [];
    
    if (!content || typeof content !== 'string') {
      errors.push('Content is required and must be a string');
    } else if (content.trim().length === 0) {
      errors.push('Content cannot be empty');
    } else {
      // Type-specific validation
      switch (type) {
        case 'sms':
          if (content.length > 160) {
            errors.push('SMS content cannot exceed 160 characters');
          }
          break;
        case 'push':
          if (content.length > 100) {
            errors.push('Push notification content cannot exceed 100 characters');
          }
          break;
        case 'email':
          if (content.length > 10000) {
            errors.push('Email content cannot exceed 10,000 characters');
          }
          break;
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate recipient based on notification type
   */
  static validateRecipient(recipient: string, type: string): ValidationResult {
    switch (type) {
      case 'email':
        return this.validateEmail(recipient);
      case 'sms':
        return this.validatePhoneNumber(recipient);
      case 'push':
        // Push notifications typically use device tokens or user IDs
        return this.validatePushToken(recipient);
      default:
        return {
          isValid: false,
          errors: ['Invalid notification type for recipient validation']
        };
    }
  }

  /**
   * Validate push notification token
   */
  static validatePushToken(token: string): ValidationResult {
    const errors: string[] = [];
    
    if (!token || typeof token !== 'string') {
      errors.push('Push token is required and must be a string');
    } else if (token.length < 32 || token.length > 255) {
      errors.push('Push token must be between 32 and 255 characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize recipient input
   */
  static sanitizeRecipient(recipient: string, type: string): string {
    if (!recipient) return recipient;
    
    switch (type) {
      case 'email':
        return recipient.trim().toLowerCase();
      case 'sms':
        return recipient.replace(/[^\d\s\-\+\(\)]/g, '');
      case 'push':
        return recipient.trim();
      default:
        return recipient.trim();
    }
  }

  /**
   * Format validation errors for logging
   */
  static formatValidationErrors(errors: string[]): string {
    return errors.map((error, index) => `${index + 1}. ${error}`).join('; ');
  }
} 