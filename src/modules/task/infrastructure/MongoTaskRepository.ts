import { QueryFilter } from 'mongoose';
import { Task } from '../domain/Task';
import { ITaskRepository, PaginatedResult } from '../domain/ITaskRepository';
import { TaskFilter } from '../domain/TaskFilter';
import { Role } from '../../identity/domain/Role';
import { TaskDoc, TaskModel } from './TaskModel';

function toDomain(doc: TaskDoc): Task {
  const task = new Task({
    id: doc._id,
    title: doc.title,
    description: doc.description,
    status: doc.status,
    priority: doc.priority,
    assigneeId: doc.assigneeId,
    dueDate: doc.dueDate,
    createdBy: doc.createdBy,
    clubId: doc.clubId,
    tags: doc.tags,
  });
  // Entity sets createdAt/updatedAt to "now" on construction; restore from persistence.
  const writable = task as unknown as { createdAt: Date; updatedAt: Date };
  writable.createdAt = doc.createdAt;
  writable.updatedAt = doc.updatedAt;
  return task;
}

function toPersistence(task: Task): TaskDoc {
  return {
    _id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    assigneeId: task.assigneeId,
    dueDate: task.dueDate,
    createdBy: task.createdBy,
    clubId: task.clubId,
    tags: task.tags.map(t => t.value),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class MongoTaskRepository implements ITaskRepository {
  async findAll(): Promise<Task[]> {
    const docs = await TaskModel.find({}).lean<TaskDoc[]>();
    return docs.map(toDomain);
  }

  async findByFilter(
    filter: TaskFilter,
    page: number,
    limit: number,
    userId: string,
    userRole: string,
  ): Promise<PaginatedResult<Task>> {
    const conditions: QueryFilter<TaskDoc>[] = [];

    if (userRole !== Role.ADMIN) {
      conditions.push({ $or: [{ createdBy: userId }, { assigneeId: userId }] });
    }
    if (filter.search) {
      const term = escapeRegex(filter.search);
      conditions.push({
        $or: [
          { title: { $regex: term, $options: 'i' } },
          { description: { $regex: term, $options: 'i' } },
        ],
      });
    }

    const query: QueryFilter<TaskDoc> = {};
    if (filter.status) query.status = filter.status;
    if (filter.priority) query.priority = filter.priority;
    if (filter.assigneeId) query.assigneeId = filter.assigneeId;
    if (filter.tags.length > 0) {
      query.tags = { $all: filter.tags.map(t => t.trim().toLowerCase()) };
    }
    if (filter.dueBefore || filter.dueAfter) {
      query.dueDate = {};
      if (filter.dueBefore) (query.dueDate as Record<string, Date>).$lte = filter.dueBefore;
      if (filter.dueAfter) (query.dueDate as Record<string, Date>).$gte = filter.dueAfter;
    }
    if (conditions.length > 0) {
      query.$and = conditions;
    }

    const skip = Math.max(0, (page - 1) * limit);
    const [docs, total] = await Promise.all([
      TaskModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean<TaskDoc[]>(),
      TaskModel.countDocuments(query),
    ]);

    return {
      items: docs.map(toDomain),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findById(id: string): Promise<Task | null> {
    const doc = await TaskModel.findById(id).lean<TaskDoc>();
    return doc ? toDomain(doc) : null;
  }

  async save(task: Task): Promise<void> {
    const data = toPersistence(task);
    await TaskModel.replaceOne({ _id: task.id }, data, { upsert: true });
  }

  async update(task: Task): Promise<void> {
    const data = toPersistence(task);
    const result = await TaskModel.replaceOne({ _id: task.id }, data);
    if (result.matchedCount === 0) throw new Error('NOT_FOUND');
  }

  async delete(id: string): Promise<void> {
    await TaskModel.deleteOne({ _id: id });
  }

  async findByAssignee(assigneeId: string): Promise<Task[]> {
    const docs = await TaskModel.find({ assigneeId }).lean<TaskDoc[]>();
    return docs.map(toDomain);
  }
}
