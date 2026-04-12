import { eventBus } from '../../../src/shared/application/EventBus';
import { DomainEvent } from '../../../src/shared/domain/DomainEvent';

describe('EventBus', () => {
  it('should deliver published events to subscribers', (done) => {
    const testEvent: DomainEvent = {
      eventType: 'TestEvent',
      aggregateType: 'Test',
      aggregateId: 'test-id',
      actor: 'user-1',
      timestamp: new Date(),
      payload: { foo: 'bar' },
      metadata: { module: 'test' },
    };

    eventBus.subscribe('TestEvent', (event) => {
      expect(event).toMatchObject({ eventType: 'TestEvent', payload: { foo: 'bar' } });
      done();
    });

    eventBus.publish(testEvent);
  });
});
