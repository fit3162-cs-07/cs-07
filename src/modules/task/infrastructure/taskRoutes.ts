import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
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

const GetTasksQuerySchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assigneeId: z.string().uuid().optional(),
  tag: z.union([z.string(), z.array(z.string())]).optional(),
  search: z.string().max(200).optional(),
  dueBefore: z.string().datetime().optional(),
  dueAfter: z.string().datetime().optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

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
      const query = GetTasksQuerySchema.parse(req.query);

      // Normalize tag param: single string → array
      const tags = query.tag
        ? Array.isArray(query.tag) ? query.tag : [query.tag]
        : undefined;

      const result = await getTasks.execute({
        filter: {
          status: query.status,
          priority: query.priority,
          assigneeId: query.assigneeId,
          tags,
          search: query.search,
          dueBefore: query.dueBefore ? new Date(query.dueBefore) : undefined,
          dueAfter: query.dueAfter ? new Date(query.dueAfter) : undefined,
        },
        page: query.page ? parseInt(query.page, 10) : undefined,
        limit: query.limit ? parseInt(query.limit, 10) : undefined,
        userId: req.auth!.userId,
        userRole: req.auth!.role,
      });

      sendSuccess(res, result.tasks, 200, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
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
