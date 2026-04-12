import { v4 as uuidv4 } from 'uuid';

export abstract class Entity {
  readonly id: string;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(id?: string) {
    this.id = id ?? uuidv4();
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  protected touch(): void {
    this.updatedAt = new Date();
  }
}
