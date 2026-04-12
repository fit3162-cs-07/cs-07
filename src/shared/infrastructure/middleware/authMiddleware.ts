import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../../config';

export interface AuthPayload {
  userId: string;
  role: string;
}

export interface AuthRequest extends Request {
  auth?: AuthPayload;
}

export function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next(new Error('UNAUTHORIZED'));
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, config.jwt.secret) as AuthPayload;
    req.auth = payload;
    next();
  } catch {
    next(new Error('UNAUTHORIZED'));
  }
}
