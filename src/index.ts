import { createApp } from './app';
import { config } from './config';
import { InMemoryUserRepository } from './modules/identity/infrastructure/InMemoryUserRepository';
import { InMemoryTaskRepository } from './modules/task/infrastructure/InMemoryTaskRepository';
import { seedData } from './seed/seedData';
import { eventBus } from './shared/application/EventBus';
import { CheckDueRemindersUseCase } from './modules/task/application/CheckDueRemindersUseCase';
import { ReminderScheduler } from './modules/task/infrastructure/ReminderScheduler';

async function bootstrap(): Promise<void> {
  const userRepo = new InMemoryUserRepository();
  const taskRepo = new InMemoryTaskRepository();

  await seedData(userRepo, taskRepo);

  const app = createApp(userRepo, taskRepo);

  const reminderScheduler = new ReminderScheduler(
    new CheckDueRemindersUseCase(taskRepo, eventBus),
  );
  reminderScheduler.start();

  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
    console.log(`API available at http://localhost:${config.port}/api/v1`);
    console.log('ReminderScheduler started (checks every 5 min, 24h lookahead)');
  });
}

bootstrap().catch(console.error);
