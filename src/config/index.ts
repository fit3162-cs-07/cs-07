import dotenv from 'dotenv';
dotenv.config();

type RepositoryDriver = 'memory' | 'mongo';

function parseDriver(raw: string | undefined): RepositoryDriver {
  if (raw === 'mongo') return 'mongo';
  if (raw === undefined || raw === '' || raw === 'memory') return 'memory';
  throw new Error(`Invalid REPOSITORY_DRIVER: ${raw}. Use "memory" or "mongo".`);
}

export const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwt: {
    secret: process.env.JWT_SECRET ?? 'fallback-secret-do-not-use-in-production',
    expiry: process.env.JWT_EXPIRY ?? '15m',
  },
  repository: {
    driver: parseDriver(process.env.REPOSITORY_DRIVER),
    mongoUri: process.env.MONGODB_URI ?? '',
  },
};
