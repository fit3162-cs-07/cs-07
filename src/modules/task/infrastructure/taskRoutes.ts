import { Router, Response, NextFunction } from 'express';
import { AuthRequest } from '../../../shared/infrastructure/middleware/authMiddleware';
import { requireRole } from '../../../shared/infrastructure/middleware/requireRole';
import { CreateTaskSchema } from '../application/dtos/CreateTaskDTO';
import { UpdateTaskSchema } from '../application/dtos/UpdateTaskDTO';
import { AssignTaskSchema } from '../application/dtos/AssignTaskDTO';
import { ChangeStatusSchema } from '../application/ChangeTaskStatusUseCase';
import { CreateTaskUseCase } from '../application/CreateTaskUseCase';
import { GetTasksUseCase } from '../application/GetTasksUseCase';
import { GetTaskByIdUseCase } from '../application/GetTaskByIdUseCase';
import { UpdateTaskUseCase } from '../application/UpdateTaskUseCase';
import { DeleteTaskUseCase } from '../application/DeleteTaskUseCase';
import { AssignTaskUseCase } from '../application/AssignTaskUseCase';
import { ChangeTaskStatusUseCase } from '../application/ChangeTaskStatusUseCase';
import { ITaskRepository } from '../domain/ITaskRepository';
import { IEventBus } from '../../../shared/application/EventBus';
import { sendSuccess } from '../../../shared/infrastructure/http/ApiResponse';
import { TaskStatus } from '../domain/TaskStatus';
import { TaskPriority } from '../domain/TaskPriority';

export function createTaskRouter(taskRepo: ITaskRepository, eventBus: IEventBus): Router {
  const router = Router();

  const createTask = new CreateTaskUseCase(taskRepo, eventBus);
  const getTasks = new GetTasksUseCase(taskRepo);
  const getTaskById = new GetTaskByIdUseCase(taskRepo);
  const updateTask = new UpdateTaskUseCase(taskRepo);
  const deleteTask = new DeleteTaskUseCase(taskRepo, eventBus);
  const assignTask = new AssignTaskUseCase(taskRepo, eventBus);
  const changeStatus = new ChangeTaskStatusUseCase(taskRepo, eventBus);

  router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { status, assigneeId, priority } = req.query;
      const tasks = await getTasks.execute({
        status: status as TaskStatus | undefined,
        assigneeId: assigneeId as string | undefined,
        priority: priority as TaskPriority | undefined,
      });
      sendSuccess(res, tasks);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const task = await getTaskById.execute(req.params.id);
      sendSuccess(res, task);
    } catch (err) {
      next(err);
    }
  });

  router.post('/', requireRole('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const dto = CreateTaskSchema.parse(req.body);
      const task = await createTask.execute({ ...dto, createdBy: req.auth!.userId });
      sendSuccess(res, task, 201);
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', requireRole('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const dto = UpdateTaskSchema.parse(req.body);
      const task = await updateTask.execute({ id: req.params.id, ...dto });
      sendSuccess(res, task);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', requireRole('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await deleteTask.execute({ id: req.params.id, actor: req.auth!.userId });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id/assign', requireRole('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const dto = AssignTaskSchema.parse(req.body);
      const task = await assignTask.execute({ id: req.params.id, actor: req.auth!.userId, ...dto });
      sendSuccess(res, task);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id/status', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { status } = ChangeStatusSchema.parse(req.body);
      const task = await changeStatus.execute({
        id: req.params.id,
        status,
        actor: req.auth!.userId,
        actorRole: req.auth!.role,
      });
      sendSuccess(res, task);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
