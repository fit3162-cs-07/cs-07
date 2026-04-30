import { Router, Response, NextFunction } from 'express';
import { IUserRepository } from '../domain/IUserRepository';
import { GetUsersUseCase } from '../application/GetUsersUseCase';
import { Role } from '../domain/Role';
import { sendSuccess } from '../../../shared/infrastructure/http/ApiResponse';
import { AuthRequest } from '../../../shared/infrastructure/middleware/authMiddleware';

export function createUserRouter(userRepo: IUserRepository): Router {
  const router = Router();
  const getUsers = new GetUsersUseCase(userRepo);

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

  return router;
}
