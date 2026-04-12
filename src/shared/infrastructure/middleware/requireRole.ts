import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(new Error('UNAUTHORIZED'));
      return;
    }
    if (!roles.includes(req.auth.role)) {
      next(new Error('FORBIDDEN'));
      return;
    }
    next();
  };
}
