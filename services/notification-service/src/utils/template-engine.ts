export interface TemplateVariables {
  [key: string]: string | number | boolean;
}

export interface ProcessedTemplate {
  subject?: string;
  content: string;
  type: 'email' | 'sms' | 'push';
}

export class TemplateEngine {
  /**
   * Process a template with variables
   */
  static processTemplate(
    template: { content: string; subject?: string; type: 'email' | 'sms' | 'push' },
    variables: TemplateVariables
  ): ProcessedTemplate {
    try {
      const processedContent = this.replaceVariables(template.content, variables);
      const processedSubject = template.subject ? this.replaceVariables(template.subject, variables) : undefined;

      return {
        subject: processedSubject,
        content: processedContent,
        type: template.type
      };
    } catch (error) {
      console.error('Error processing template:', error);
      throw new Error('Failed to process notification template');
    }
  }

  /**
   * Replace variables in a string using {{variable}} syntax
   */
  private static replaceVariables(text: string, variables: TemplateVariables): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
      const value = variables[variableName];
      if (value === undefined || value === null) {
        console.warn(`Variable ${variableName} not found in template`);
        return match; // Keep the original placeholder
      }
      return String(value);
    });
  }

  /**
   * Validate that all required variables are provided
   */
  static validateVariables(
    template: { variables: string[] },
    providedVariables: TemplateVariables
  ): { isValid: boolean; missing: string[] } {
    const missing: string[] = [];
    
    for (const requiredVar of template.variables) {
      if (!(requiredVar in providedVariables) || providedVariables[requiredVar] === undefined) {
        missing.push(requiredVar);
      }
    }
    
    return {
      isValid: missing.length === 0,
      missing
    };
  }

  /**
   * Sanitize template content for different notification types
   */
  static sanitizeContent(content: string, type: 'email' | 'sms' | 'push'): string {
    switch (type) {
      case 'sms':
        // SMS has character limits, truncate if needed
        return content.length > 160 ? content.substring(0, 157) + '...' : content;
      
      case 'push':
        // Push notifications should be concise
        return content.length > 100 ? content.substring(0, 97) + '...' : content;
      
      case 'email':
      default:
        // Email can be longer, just basic sanitization
        return content.trim();
    }
  }

  /**
   * Format notification content based on type
   */
  static formatNotification(
    template: ProcessedTemplate,
    recipient: string
  ): { to: string; subject?: string; content: string; type: string } {
    return {
      to: recipient,
      subject: template.subject,
      content: this.sanitizeContent(template.content, template.type),
      type: template.type
    };
  }
} 