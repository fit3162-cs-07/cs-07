import { Router, Response, NextFunction } from 'express';
import { INotificationRepository } from '../domain/INotificationRepository';
import { ListNotificationsUseCase } from '../application/ListNotificationsUseCase';
import { MarkNotificationReadUseCase } from '../application/MarkNotificationReadUseCase';
import { MarkAllReadUseCase } from '../application/MarkAllReadUseCase';
import { GetUnreadCountUseCase } from '../application/GetUnreadCountUseCase';
import { sendSuccess, sendError } from '../../../shared/infrastructure/http/ApiResponse';
import { AuthRequest } from '../../../shared/infrastructure/middleware/authMiddleware';

export function createNotificationRouter(repo: INotificationRepository): Router {
  const router = Router();
  const list = new ListNotificationsUseCase(repo);
  const markRead = new MarkNotificationReadUseCase(repo);
  const markAll = new MarkAllReadUseCase(repo);
  const unreadCount = new GetUnreadCountUseCase(repo);

  router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) {
        next(new Error('UNAUTHORIZED'));
        return;
      }
      const unreadOnly = req.query.unreadOnly === 'true';
      const limitParam = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : undefined;
      const limit = limitParam && limitParam > 0 && limitParam <= 100 ? limitParam : undefined;
      const data = await list.execute({ userId: req.auth.userId, unreadOnly, limit });
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  });

  router.get('/unread-count', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) {
        next(new Error('UNAUTHORIZED'));
        return;
      }
      const data = await unreadCount.execute({ userId: req.auth.userId });
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/read', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) {
        next(new Error('UNAUTHORIZED'));
        return;
      }
      await markRead.execute({ notificationId: req.params.id, userId: req.auth.userId });
      sendSuccess(res, { read: true });
    } catch (err) {
      if (err instanceof Error && err.message === 'NOTIFICATION_NOT_FOUND') {
        sendError(res, 404, 'NOTIFICATION_NOT_FOUND', 'Notification not found');
        return;
      }
      if (err instanceof Error && err.message === 'FORBIDDEN') {
        sendError(res, 403, 'FORBIDDEN', 'You cannot modify another user\u2019s notification');
        return;
      }
      next(err);
    }
  });

  router.post('/read-all', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) {
        next(new Error('UNAUTHORIZED'));
        return;
      }
      const data = await markAll.execute({ userId: req.auth.userId });
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
