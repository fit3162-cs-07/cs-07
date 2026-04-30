import { Entity } from '../../../shared/domain/Entity';
import { Role } from './Role';

export class User extends Entity {
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
  isActive: boolean;

  constructor(props: {
    id?: string;
    email: string;
    name: string;
    passwordHash: string;
    role: Role;
    isActive?: boolean;
  }) {
    super(props.id);
    this.email = props.email;
    this.name = props.name;
    this.passwordHash = props.passwordHash;
    this.role = props.role;
    this.isActive = props.isActive ?? true;
  }
}
