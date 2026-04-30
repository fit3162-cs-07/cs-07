import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requestLogger } from './shared/infrastructure/middleware/requestLogger';
import { errorHandler } from './shared/infrastructure/middleware/errorHandler';
import { authMiddleware } from './shared/infrastructure/middleware/authMiddleware';
import { AuditLogger } from './shared/infrastructure/audit/AuditLogger';
import { eventBus } from './shared/application/EventBus';
import { createIdentityRouter } from './modules/identity/infrastructure/identityRoutes';
import { createTaskRouter } from './modules/task/infrastructure/taskRoutes';
import { IUserRepository } from './modules/identity/domain/IUserRepository';
import { ITaskRepository } from './modules/task/domain/ITaskRepository';

export function createApp(userRepo: IUserRepository, taskRepo: ITaskRepository) {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(requestLogger);

  // Set up audit logging
  const auditLogger = new AuditLogger(eventBus);
  auditLogger.register([
    'TaskCreated',
    'TaskAssigned',
    'TaskStatusChanged',
    'TaskDeleted',
    'TaskReminderDue',
  ]);

  // Store audit logger on app for route access
  app.locals.auditLogger = auditLogger;

  // Public routes
  app.use('/api/v1/auth', createIdentityRouter(userRepo));

  // Protected routes
  app.use('/api/v1/tasks', authMiddleware, createTaskRouter(taskRepo, eventBus));

  // Audit route (admin only)
  app.get('/api/v1/audit', authMiddleware, (req, res) => {
    const auth = (req as import('./shared/infrastructure/middleware/authMiddleware').AuthRequest).auth;
    if (auth?.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
      return;
    }
    res.json({ success: true, data: auditLogger.getLogs() });
  });

  app.use(errorHandler);

  return app;
}
