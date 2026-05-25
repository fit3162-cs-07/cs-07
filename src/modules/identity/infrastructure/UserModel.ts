import { Schema, model, Model } from 'mongoose';
import { Role } from '../domain/Role';

export interface UserDoc {
  _id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    _id: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(Role), required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  {
    _id: false,
    versionKey: false,
    collection: 'users',
    timestamps: false,
  },
);

export const UserModel: Model<UserDoc> = model<UserDoc>('User', userSchema);
