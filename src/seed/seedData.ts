import bcrypt from 'bcrypt';
import { User } from '../modules/identity/domain/User';
import { Role } from '../modules/identity/domain/Role';
import { Task } from '../modules/task/domain/Task';
import { TaskStatus } from '../modules/task/domain/TaskStatus';
import { TaskPriority } from '../modules/task/domain/TaskPriority';
import { IUserRepository } from '../modules/identity/domain/IUserRepository';
import { ITaskRepository } from '../modules/task/domain/ITaskRepository';

export async function seedData(userRepo: IUserRepository, taskRepo: ITaskRepository): Promise<void> {
  const adminHash = await bcrypt.hash('admin123', 10);
  const memberHash = await bcrypt.hash('member123', 10);

  const admin = new User({ email: 'admin@monash.edu', name: 'Club Admin', passwordHash: adminHash, role: Role.ADMIN });
  const member1 = new User({ email: 'member1@monash.edu', name: 'Alice Wong', passwordHash: memberHash, role: Role.MEMBER });
  const member2 = new User({ email: 'member2@monash.edu', name: 'Bob Smith', passwordHash: memberHash, role: Role.MEMBER });

  await userRepo.save(admin);
  await userRepo.save(member1);
  await userRepo.save(member2);

  const twoWeeksFromNow = new Date();
  twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

  const oneWeekFromNow = new Date();
  oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

  await taskRepo.save(new Task({ title: 'Book venue for O-Week stall', description: 'Contact the student union to book a stall', status: TaskStatus.TODO, priority: TaskPriority.HIGH, assigneeId: member1.id, dueDate: twoWeeksFromNow, createdBy: admin.id, tags: ['events', 'urgent'] }));
  await taskRepo.save(new Task({ title: 'Design event poster', description: 'Create a poster for the upcoming event', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, assigneeId: member2.id, createdBy: admin.id, tags: ['design', 'events'] }));
  await taskRepo.save(new Task({ title: 'Order club merchandise', description: 'Order t-shirts and stickers for the club', status: TaskStatus.TODO, priority: TaskPriority.LOW, createdBy: admin.id, tags: ['merchandise'] }));
  await taskRepo.save(new Task({ title: 'Submit sponsorship proposal', description: 'Submit the sponsorship proposal to the companies', status: TaskStatus.DONE, priority: TaskPriority.HIGH, assigneeId: member1.id, createdBy: admin.id, tags: ['finance', 'urgent'] }));
  await taskRepo.save(new Task({ title: 'Set up Discord server', description: 'Create and configure the club Discord server', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, assigneeId: member2.id, dueDate: oneWeekFromNow, createdBy: admin.id, tags: ['communication'] }));

  console.log('Seed data loaded: 3 users, 5 tasks');
}
