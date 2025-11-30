import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

// ============================================================================
// Zod Schema Validation Middleware
// ============================================================================

/**
 * Middleware factory to validate request body against a Zod schema
 */
export function validateBody<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate and parse request body
      const validated = schema.parse(req.body);

      // Replace request body with validated (and potentially transformed) data
      req.body = validated;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod validation errors
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: formattedErrors,
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Unexpected error
      console.error('❌ Validation error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Validation processing failed',
        },
        timestamp: new Date().toISOString(),
      });
    }
  };
}

/**
 * Middleware factory to validate request query parameters
 */
export function validateQuery<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        res.status(400).json({
          success: false,
          error: {
            code: 'QUERY_VALIDATION_ERROR',
            message: 'Query parameter validation failed',
            details: formattedErrors,
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      console.error('❌ Query validation error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Query validation processing failed',
        },
        timestamp: new Date().toISOString(),
      });
    }
  };
}

/**
 * Middleware factory to validate request params (URL parameters)
 */
export function validateParams<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        res.status(400).json({
          success: false,
          error: {
            code: 'PARAMS_VALIDATION_ERROR',
            message: 'URL parameter validation failed',
            details: formattedErrors,
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      console.error('❌ Params validation error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Params validation processing failed',
        },
        timestamp: new Date().toISOString(),
      });
    }
  };
}

/**
 * Helper to create a success response
 */
export function successResponse<T>(data: T, _statusCode: number = 200) {
  return {
    success: true as const,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Helper to create an error response
 */
export function errorResponse(
  code: string,
  message: string,
  details?: unknown,
  _statusCode: number = 400
) {
  return {
    success: false as const,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    timestamp: new Date().toISOString(),
  };
}
