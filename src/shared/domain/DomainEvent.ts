export interface DomainEvent {
  readonly eventType: string;
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly actor: string;
  readonly timestamp: Date;
  readonly payload: Record<string, unknown>;
  readonly metadata: {
    module: string;
  };
}
