import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { requestLogger } from './shared/infrastructure/middleware/requestLogger';
import { errorHandler } from './shared/infrastructure/middleware/errorHandler';
import { authMiddleware } from './shared/infrastructure/middleware/authMiddleware';
import { AuditLogger } from './shared/infrastructure/audit/AuditLogger';
import { eventBus } from './shared/application/EventBus';
import { createIdentityRouter } from './modules/identity/infrastructure/identityRoutes';
import { createUserRouter } from './modules/identity/infrastructure/userRoutes';
import { createTaskRouter } from './modules/task/infrastructure/taskRoutes';
import { createNotificationRouter } from './modules/notification/infrastructure/notificationRoutes';
import { InMemoryNotificationRepository } from './modules/notification/infrastructure/InMemoryNotificationRepository';
import { NotificationEventSubscriber } from './modules/notification/infrastructure/NotificationEventSubscriber';
import { CreateNotificationUseCase } from './modules/notification/application/CreateNotificationUseCase';
import { IUserRepository } from './modules/identity/domain/IUserRepository';
import { ITaskRepository } from './modules/task/domain/ITaskRepository';
import { INotificationRepository } from './modules/notification/domain/INotificationRepository';

export interface CreateAppOptions {
  notificationRepo?: INotificationRepository;
}

export function createApp(
  userRepo: IUserRepository,
  taskRepo: ITaskRepository,
  options: CreateAppOptions = {},
) {
  const app = express();

  app.use(helmet());
  app.use(cors(buildCorsOptions()));
  app.use(express.json());
  app.use(requestLogger);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Set up audit logging
  const auditLogger = new AuditLogger(eventBus);
  auditLogger.register([
    'TaskCreated',
    'TaskAssigned',
    'TaskStatusChanged',
    'TaskDeleted',
    'TaskReminderDue',
    'UserProfileUpdated',
    'UserPasswordChanged',
    'UserRoleChanged',
    'UserStatusChanged',
    'NotificationCreated',
  ]);

  // Notifications module — listens to task events, owns its own routes
  const notificationRepo = options.notificationRepo ?? new InMemoryNotificationRepository();
  const createNotification = new CreateNotificationUseCase(notificationRepo, eventBus);
  new NotificationEventSubscriber(createNotification, taskRepo).register(eventBus);

  // Store audit logger on app for route access
  app.locals.auditLogger = auditLogger;

  // Public routes
  app.use('/api/v1/auth', createIdentityRouter(userRepo));

  // Protected routes
  app.use('/api/v1/users', authMiddleware, createUserRouter(userRepo, eventBus));
  app.use('/api/v1/tasks', authMiddleware, createTaskRouter(taskRepo, eventBus));
  app.use('/api/v1/notifications', authMiddleware, createNotificationRouter(notificationRepo));

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

function buildCorsOptions(): cors.CorsOptions {
  if (!config.frontendOrigin) return {};
  const allowed = [config.frontendOrigin, 'http://localhost:5173', 'http://localhost:5174'];
  return {
    origin: (origin, callback) => {
      if (!origin || allowed.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  };
}
