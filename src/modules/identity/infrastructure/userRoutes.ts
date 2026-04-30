import { Router, Response, NextFunction } from 'express';
import { IUserRepository } from '../domain/IUserRepository';
import { GetUsersUseCase } from '../application/GetUsersUseCase';
import { UpdateProfileUseCase } from '../application/UpdateProfileUseCase';
import { ChangePasswordUseCase } from '../application/ChangePasswordUseCase';
import { UpdateUserUseCase } from '../application/UpdateUserUseCase';
import { SetUserActiveUseCase } from '../application/SetUserActiveUseCase';
import { UpdateProfileSchema } from '../application/dtos/UpdateProfileDTO';
import { ChangePasswordSchema } from '../application/dtos/ChangePasswordDTO';
import { UpdateUserSchema } from '../application/dtos/UpdateUserDTO';
import { Role } from '../domain/Role';
import { sendSuccess, sendError } from '../../../shared/infrastructure/http/ApiResponse';
import { AuthRequest } from '../../../shared/infrastructure/middleware/authMiddleware';
import { requireRole } from '../../../shared/infrastructure/middleware/requireRole';
import { IEventBus } from '../../../shared/application/EventBus';

export function createUserRouter(userRepo: IUserRepository, eventBus: IEventBus): Router {
  const router = Router();
  const getUsers = new GetUsersUseCase(userRepo);
  const updateProfile = new UpdateProfileUseCase(userRepo, eventBus);
  const changePassword = new ChangePasswordUseCase(userRepo, eventBus);
  const updateUser = new UpdateUserUseCase(userRepo, eventBus);
  const setUserActive = new SetUserActiveUseCase(userRepo, eventBus);

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
      sendSuccess(res, {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      });
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
      sendSuccess(res, {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      });
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

  // Admin user management
  router.patch(
    '/:id',
    requireRole(Role.ADMIN),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.auth) {
          next(new Error('UNAUTHORIZED'));
          return;
        }
        const dto = UpdateUserSchema.parse(req.body);
        const user = await updateUser.execute({
          ...dto,
          targetUserId: req.params.id,
          actorId: req.auth.userId,
        });
        sendSuccess(res, {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
        });
      } catch (err) {
        if (err instanceof Error && err.message === 'USER_NOT_FOUND') {
          sendError(res, 404, 'USER_NOT_FOUND', 'User not found');
          return;
        }
        if (err instanceof Error && err.message === 'CANNOT_CHANGE_OWN_ROLE') {
          sendError(res, 400, 'CANNOT_CHANGE_OWN_ROLE', 'You cannot change your own role');
          return;
        }
        next(err);
      }
    },
  );

  router.post(
    '/:id/deactivate',
    requireRole(Role.ADMIN),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      await setActiveHandler(req, res, next, false);
    },
  );

  router.post(
    '/:id/activate',
    requireRole(Role.ADMIN),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      await setActiveHandler(req, res, next, true);
    },
  );

  async function setActiveHandler(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
    isActive: boolean,
  ): Promise<void> {
    try {
      if (!req.auth) {
        next(new Error('UNAUTHORIZED'));
        return;
      }
      const user = await setUserActive.execute({
        targetUserId: req.params.id,
        actorId: req.auth.userId,
        isActive,
      });
      sendSuccess(res, {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'USER_NOT_FOUND') {
        sendError(res, 404, 'USER_NOT_FOUND', 'User not found');
        return;
      }
      if (err instanceof Error && err.message === 'CANNOT_DEACTIVATE_SELF') {
        sendError(res, 400, 'CANNOT_DEACTIVATE_SELF', 'You cannot deactivate your own account');
        return;
      }
      next(err);
    }
  }

  return router;
}
