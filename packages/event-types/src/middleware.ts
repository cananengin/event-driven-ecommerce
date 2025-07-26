// Express types - optional dependency
type Request = any;
type Response = any;
type NextFunction = any;
import { EcommerceError, ErrorHandler, ServiceError } from '../errors';

/**
 * Express error handling middleware
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Normalize the error to EcommerceError
  const normalizedError = ErrorHandler.normalizeError(error);
  
  // Log the error
  console.error('Error occurred:', {
    method: req.method,
    url: req.url,
    error: normalizedError.toJSON(),
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Create error response
  const errorResponse = ErrorHandler.createErrorResponse(normalizedError);
  
  // Send response
  res.status(normalizedError.statusCode).json(errorResponse);
}

/**
 * Async error wrapper for Express routes
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Validation error handler
 */
export function validationErrorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (error.name === 'ValidationError') {
    const validationError = new ServiceError('Validation failed', {
      details: error.errors,
      field: error.path
    });
    validationError.statusCode = 400;
    return next(validationError);
  }
  next(error);
}

/**
 * MongoDB error handler
 */
export function mongoErrorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    let mongoError: ServiceError;

    switch (error.code) {
      case 11000: // Duplicate key error
        mongoError = new ServiceError('Duplicate entry', {
          field: Object.keys(error.keyPattern || {}),
          value: error.keyValue
        });
        mongoError.statusCode = 409;
        break;
      
      case 121: // Document validation failed
        mongoError = new ServiceError('Document validation failed', {
          details: error.errInfo?.details
        });
        mongoError.statusCode = 400;
        break;
      
      default:
        mongoError = new ServiceError('Database operation failed', {
          code: error.code,
          message: error.message
        });
        mongoError.statusCode = 500;
    }

    return next(mongoError);
  }
  next(error);
}

/**
 * Cast error handler (MongoDB ObjectId casting)
 */
export function castErrorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (error.name === 'CastError') {
    const castError = new ServiceError('Invalid ID format', {
      field: error.path,
      value: error.value,
      kind: error.kind
    });
    castError.statusCode = 400;
    return next(castError);
  }
  next(error);
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const notFoundError = new ServiceError(`Route ${req.method} ${req.url} not found`, {
    method: req.method,
    url: req.url
  });
  notFoundError.statusCode = 404;
  next(notFoundError);
}

/**
 * Apply all error handlers to Express app
 */
export function applyErrorHandlers(app: any) {
  // Apply specific error handlers first
  app.use(validationErrorHandler);
  app.use(mongoErrorHandler);
  app.use(castErrorHandler);
  
  // Apply 404 handler for unmatched routes
  app.use(notFoundHandler);
  
  // Apply general error handler last
  app.use(errorHandler);
} 