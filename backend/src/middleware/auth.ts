import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ============================================================================
// JWT Authentication Middleware
// ============================================================================

interface JwtPayload {
  id: string;
  email?: string;
  iat?: number;
  exp?: number;
}

/**
 * Middleware to authenticate JWT tokens
 * Extracts token from Authorization header, verifies it, and attaches user to request
 */
export function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Authorization header is required',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Expected format: "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Authorization header must be in format: Bearer <token>',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const token = parts[1];

    // Verify JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET environment variable is not set');
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_CONFIGURATION_ERROR',
          message: 'Authentication is not properly configured',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    }) as JwtPayload;

    // Attach user info to request object
    req.user = {
      id: decoded.id,
      email: decoded.email,
    };

    next();
  } catch (error) {
    // Handle JWT-specific errors
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Generic error
    console.error('❌ Authentication error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Authentication failed',
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Optional authentication - doesn't fail if no token is provided
 * Useful for endpoints that work differently for authenticated vs anonymous users
 */
export function optionalAuthenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  // If no auth header, just continue without user
  if (!authHeader) {
    next();
    return;
  }

  // If auth header exists, validate it
  authenticateJWT(req, res, next);
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(
  userId: string,
  email?: string,
  expiresIn: string = '7d'
): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  return jwt.sign(
    {
      id: userId,
      email,
    },
    process.env.JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn,
    }
  );
}
