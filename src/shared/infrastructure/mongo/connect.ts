import mongoose from 'mongoose';

export async function connectMongo(uri: string): Promise<typeof mongoose> {
  if (!uri) {
    throw new Error('MONGODB_URI is required when REPOSITORY_DRIVER=mongo');
  }
  mongoose.set('strictQuery', true);
  return mongoose.connect(uri);
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
}
