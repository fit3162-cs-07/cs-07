import { Response } from 'express';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200, meta?: Record<string, unknown>): void {
  res.status(statusCode).json({
    success: true,
    data,
    ...(meta && { meta }),
  });
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown[]
): void {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  });
}
