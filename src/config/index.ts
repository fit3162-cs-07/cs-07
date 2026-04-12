import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwt: {
    secret: process.env.JWT_SECRET ?? 'fallback-secret-do-not-use-in-production',
    expiry: process.env.JWT_EXPIRY ?? '15m',
  },
};
