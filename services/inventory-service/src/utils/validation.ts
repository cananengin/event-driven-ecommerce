export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class InventoryValidator {
  /**
   * Validate product ID format
   */
  static validateProductId(productId: string): ValidationResult {
    const errors: string[] = [];
    
    if (!productId || typeof productId !== 'string') {
      errors.push('Product ID is required and must be a string');
    } else if (productId.trim().length === 0) {
      errors.push('Product ID cannot be empty');
    } else if (productId.length > 50) {
      errors.push('Product ID cannot exceed 50 characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate quantity
   */
  static validateQuantity(quantity: number): ValidationResult {
    const errors: string[] = [];
    
    if (typeof quantity !== 'number' || isNaN(quantity)) {
      errors.push('Quantity must be a valid number');
    } else if (quantity < 0) {
      errors.push('Quantity cannot be negative');
    } else if (quantity > 1000000) {
      errors.push('Quantity cannot exceed 1,000,000');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate order products array
   */
  static validateOrderProducts(products: Array<{ productId: string; quantity: number }>): ValidationResult {
    const errors: string[] = [];
    
    if (!Array.isArray(products)) {
      errors.push('Products must be an array');
      return { isValid: false, errors };
    }
    
    if (products.length === 0) {
      errors.push('Order must contain at least one product');
    }
    
    if (products.length > 100) {
      errors.push('Order cannot contain more than 100 products');
    }
    
    // Validate each product
    products.forEach((product, index) => {
      const productIdValidation = this.validateProductId(product.productId);
      const quantityValidation = this.validateQuantity(product.quantity);
      
      if (!productIdValidation.isValid) {
        errors.push(`Product ${index + 1}: ${productIdValidation.errors.join(', ')}`);
      }
      
      if (!quantityValidation.isValid) {
        errors.push(`Product ${index + 1}: ${quantityValidation.errors.join(', ')}`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate inventory update operation
   */
  static validateInventoryUpdate(productId: string, quantity: number, operation: 'add' | 'deduct'): ValidationResult {
    const errors: string[] = [];
    
    // Validate product ID
    const productIdValidation = this.validateProductId(productId);
    if (!productIdValidation.isValid) {
      errors.push(...productIdValidation.errors);
    }
    
    // Validate quantity
    const quantityValidation = this.validateQuantity(quantity);
    if (!quantityValidation.isValid) {
      errors.push(...quantityValidation.errors);
    }
    
    // Additional validation for deduct operation
    if (operation === 'deduct' && quantity <= 0) {
      errors.push('Deduction quantity must be greater than 0');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize product ID
   */
  static sanitizeProductId(productId: string): string {
    return productId.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
  }

  /**
   * Format validation errors for logging
   */
  static formatValidationErrors(errors: string[]): string {
    return errors.map((error, index) => `${index + 1}. ${error}`).join('; ');
  }
} 