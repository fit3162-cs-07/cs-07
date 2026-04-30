import { Router, Response, NextFunction } from 'express';
import { IUserRepository } from '../domain/IUserRepository';
import { GetUsersUseCase } from '../application/GetUsersUseCase';
import { UpdateProfileUseCase } from '../application/UpdateProfileUseCase';
import { ChangePasswordUseCase } from '../application/ChangePasswordUseCase';
import { UpdateProfileSchema } from '../application/dtos/UpdateProfileDTO';
import { ChangePasswordSchema } from '../application/dtos/ChangePasswordDTO';
import { Role } from '../domain/Role';
import { sendSuccess, sendError } from '../../../shared/infrastructure/http/ApiResponse';
import { AuthRequest } from '../../../shared/infrastructure/middleware/authMiddleware';
import { IEventBus } from '../../../shared/application/EventBus';

export function createUserRouter(userRepo: IUserRepository, eventBus: IEventBus): Router {
  const router = Router();
  const getUsers = new GetUsersUseCase(userRepo);
  const updateProfile = new UpdateProfileUseCase(userRepo, eventBus);
  const changePassword = new ChangePasswordUseCase(userRepo, eventBus);

  router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) {
        next(new Error('UNAUTHORIZED'));
        return;
      }
      const users = await getUsers.execute({
        actorId: req.auth.userId,
        actorRole: req.auth.role as Role,
      });
      sendSuccess(res, users);
    } catch (err) {
      next(err);
    }
  });

  router.get('/me', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) {
        next(new Error('UNAUTHORIZED'));
        return;
      }
      const user = await userRepo.findById(req.auth.userId);
      if (!user) {
        sendError(res, 404, 'USER_NOT_FOUND', 'User not found');
        return;
      }
      sendSuccess(res, { id: user.id, email: user.email, name: user.name, role: user.role });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/me', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) {
        next(new Error('UNAUTHORIZED'));
        return;
      }
      const dto = UpdateProfileSchema.parse(req.body);
      const user = await updateProfile.execute({ ...dto, userId: req.auth.userId });
      sendSuccess(res, { id: user.id, email: user.email, name: user.name, role: user.role });
    } catch (err) {
      if (err instanceof Error && err.message === 'USER_NOT_FOUND') {
        sendError(res, 404, 'USER_NOT_FOUND', 'User not found');
        return;
      }
      next(err);
    }
  });

  router.post('/me/password', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) {
        next(new Error('UNAUTHORIZED'));
        return;
      }
      const dto = ChangePasswordSchema.parse(req.body);
      await changePassword.execute({ ...dto, userId: req.auth.userId });
      sendSuccess(res, { changed: true });
    } catch (err) {
      if (err instanceof Error && err.message === 'USER_NOT_FOUND') {
        sendError(res, 404, 'USER_NOT_FOUND', 'User not found');
        return;
      }
      if (err instanceof Error && err.message === 'INVALID_CURRENT_PASSWORD') {
        sendError(res, 401, 'INVALID_CURRENT_PASSWORD', 'Current password is incorrect');
        return;
      }
      next(err);
    }
  });

  return router;
}
