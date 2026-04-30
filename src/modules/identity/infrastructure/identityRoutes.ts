import { Router, Request, Response, NextFunction } from 'express';
import { RegisterSchema } from '../application/dtos/RegisterDTO';
import { LoginSchema } from '../application/dtos/LoginDTO';
import { RegisterUseCase } from '../application/RegisterUseCase';
import { LoginUseCase } from '../application/LoginUseCase';
import { IUserRepository } from '../domain/IUserRepository';
import { sendSuccess, sendError } from '../../../shared/infrastructure/http/ApiResponse';

export function createIdentityRouter(userRepo: IUserRepository): Router {
  const router = Router();
  const registerUseCase = new RegisterUseCase(userRepo);
  const loginUseCase = new LoginUseCase(userRepo);

  router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = RegisterSchema.parse(req.body);
      const result = await registerUseCase.execute(dto);
      sendSuccess(res, result, 201);
    } catch (err) {
      if (err instanceof Error && err.message === 'EMAIL_TAKEN') {
        sendError(res, 409, 'EMAIL_TAKEN', 'Email is already registered');
        return;
      }
      next(err);
    }
  });

  router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = LoginSchema.parse(req.body);
      const result = await loginUseCase.execute(dto);
      sendSuccess(res, result);
    } catch (err) {
      if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
        sendError(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
        return;
      }
      if (err instanceof Error && err.message === 'ACCOUNT_DEACTIVATED') {
        sendError(res, 403, 'ACCOUNT_DEACTIVATED', 'Your account has been deactivated');
        return;
      }
      next(err);
    }
  });

  return router;
}
