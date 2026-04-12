import { Entity } from '../../../shared/domain/Entity';
import { Role } from './Role';

export class User extends Entity {
  email: string;
  name: string;
  passwordHash: string;
  role: Role;

  constructor(props: {
    id?: string;
    email: string;
    name: string;
    passwordHash: string;
    role: Role;
  }) {
    super(props.id);
    this.email = props.email;
    this.name = props.name;
    this.passwordHash = props.passwordHash;
    this.role = props.role;
  }
}
