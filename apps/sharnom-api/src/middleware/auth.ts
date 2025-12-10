import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Middleware to check JWT/session token (simplified version)
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  // In production, verify JWT from Authorization header
  // For now, check a simple Bearer token or session cookie
  
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  
  // TODO: Verify JWT token here
  // const token = authHeader.substring(7);
  // const decoded = verifyJWT(token);
  
  // For demo purposes, mock user data
  // In production, decode JWT and fetch user from database
  req.user = {
    id: 'mock-user-id',
    email: 'user@example.com',
    role: 'user',
  };
  
  return next();
}

// Middleware to check user roles
export function requireRole(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden: Insufficient permissions',
        required: allowedRoles,
        current: req.user.role,
      });
    }
    
    return next();
  };
}

// Combined middleware: auth + admin role
export const requireAdmin = [requireAuth, requireRole(['admin'])];
