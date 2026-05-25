import { User } from '../domain/User';
import { IUserRepository } from '../domain/IUserRepository';
import { Role } from '../domain/Role';
import { UserDoc, UserModel } from './UserModel';

function toDomain(doc: UserDoc): User {
  const user = new User({
    id: doc._id,
    email: doc.email,
    name: doc.name,
    passwordHash: doc.passwordHash,
    role: doc.role as Role,
    isActive: doc.isActive,
  });
  // Entity sets createdAt/updatedAt to "now" on construction; restore from persistence.
  const writable = user as unknown as { createdAt: Date; updatedAt: Date };
  writable.createdAt = doc.createdAt;
  writable.updatedAt = doc.updatedAt;
  return user;
}

function toPersistence(user: User): UserDoc {
  return {
    _id: user.id,
    email: user.email,
    name: user.name,
    passwordHash: user.passwordHash,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class MongoUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({ email: email.toLowerCase() }).lean<UserDoc>();
    return doc ? toDomain(doc) : null;
  }

  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id).lean<UserDoc>();
    return doc ? toDomain(doc) : null;
  }

  async save(user: User): Promise<void> {
    const data = toPersistence(user);
    await UserModel.replaceOne({ _id: user.id }, data, { upsert: true });
  }

  async findAll(): Promise<User[]> {
    const docs = await UserModel.find({}).lean<UserDoc[]>();
    return docs.map(toDomain);
  }
}
