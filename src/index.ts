import { createApp } from './app';
import { config } from './config';
import { IUserRepository } from './modules/identity/domain/IUserRepository';
import { ITaskRepository } from './modules/task/domain/ITaskRepository';
import { InMemoryUserRepository } from './modules/identity/infrastructure/InMemoryUserRepository';
import { InMemoryTaskRepository } from './modules/task/infrastructure/InMemoryTaskRepository';
import { MongoUserRepository } from './modules/identity/infrastructure/MongoUserRepository';
import { MongoTaskRepository } from './modules/task/infrastructure/MongoTaskRepository';
import { connectMongo } from './shared/infrastructure/mongo/connect';
import { seedData } from './seed/seedData';
import { eventBus } from './shared/application/EventBus';
import { CheckDueRemindersUseCase } from './modules/task/application/CheckDueRemindersUseCase';
import { ReminderScheduler } from './modules/task/infrastructure/ReminderScheduler';

async function buildRepositories(): Promise<{
  userRepo: IUserRepository;
  taskRepo: ITaskRepository;
  driver: 'memory' | 'mongo';
}> {
  if (config.repository.driver === 'mongo') {
    await connectMongo(config.repository.mongoUri);
    return {
      userRepo: new MongoUserRepository(),
      taskRepo: new MongoTaskRepository(),
      driver: 'mongo',
    };
  }
  return {
    userRepo: new InMemoryUserRepository(),
    taskRepo: new InMemoryTaskRepository(),
    driver: 'memory',
  };
}

async function bootstrap(): Promise<void> {
  const { userRepo, taskRepo, driver } = await buildRepositories();

  if (driver === 'memory') {
    await seedData(userRepo, taskRepo);
  }

  const app = createApp(userRepo, taskRepo);

  const reminderScheduler = new ReminderScheduler(
    new CheckDueRemindersUseCase(taskRepo, eventBus),
  );
  reminderScheduler.start();

  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
    console.log(`Repository driver: ${driver}`);
    console.log(`API available at http://localhost:${config.port}/api/v1`);
    console.log('ReminderScheduler started (checks every 5 min, 24h lookahead)');
  });
}

bootstrap().catch(console.error);
