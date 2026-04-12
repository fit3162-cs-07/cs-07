import { createApp } from './app';
import { config } from './config';
import { InMemoryUserRepository } from './modules/identity/infrastructure/InMemoryUserRepository';
import { InMemoryTaskRepository } from './modules/task/infrastructure/InMemoryTaskRepository';
import { seedData } from './seed/seedData';

async function bootstrap(): Promise<void> {
  const userRepo = new InMemoryUserRepository();
  const taskRepo = new InMemoryTaskRepository();

  await seedData(userRepo, taskRepo);

  const app = createApp(userRepo, taskRepo);

  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
    console.log(`API available at http://localhost:${config.port}/api/v1`);
  });
}

bootstrap().catch(console.error);
