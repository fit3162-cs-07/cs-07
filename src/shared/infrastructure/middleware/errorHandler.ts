import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../http/ApiResponse';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request data', err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    })));
    return;
  }

  if (err.message === 'UNAUTHORIZED') {
    sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
    return;
  }

  if (err.message === 'FORBIDDEN') {
    sendError(res, 403, 'FORBIDDEN', 'Insufficient permissions');
    return;
  }

  if (err.message === 'NOT_FOUND') {
    sendError(res, 404, 'NOT_FOUND', 'Resource not found');
    return;
  }

  console.error('Unhandled error:', err);
  sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred');
}
