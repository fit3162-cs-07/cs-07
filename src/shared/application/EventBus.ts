import { EventEmitter } from 'events';
import { DomainEvent } from '../domain/DomainEvent';

export interface IEventBus {
  publish(event: DomainEvent): void;
  subscribe(eventType: string, handler: (event: DomainEvent) => void): void;
}

class NodeEventBus implements IEventBus {
  private emitter = new EventEmitter();

  publish(event: DomainEvent): void {
    this.emitter.emit(event.eventType, event);
  }

  subscribe(eventType: string, handler: (event: DomainEvent) => void): void {
    this.emitter.on(eventType, handler);
  }
}

export const eventBus = new NodeEventBus();
