import type { AnyDomainEvent, DomainEventName } from "./domain-events";

export interface EventObserver {
  readonly id: string;
  readonly interestedIn?: DomainEventName[];
  handle(event: AnyDomainEvent): Promise<void> | void;
}

class InMemoryEventBus {
  private observers = new Map<string, EventObserver>();

  subscribe(observer: EventObserver): void {
    this.observers.set(observer.id, observer);
  }

  unsubscribe(observerId: string): void {
    this.observers.delete(observerId);
  }

  async publish(event: AnyDomainEvent): Promise<void> {
    const observers = Array.from(this.observers.values()).filter((o) =>
      !o.interestedIn || o.interestedIn.includes(event.name),
    );

    await Promise.allSettled(
      observers.map(async (observer) => {
        try {
          await observer.handle(event);
        } catch (err) {
          console.error(`[event-bus] observer ${observer.id} failed for ${event.name}`, err);
        }
      }),
    );
  }
}

declare global {
  var __residencia360EventBus: InMemoryEventBus | undefined;
}

export const eventBus: InMemoryEventBus =
  globalThis.__residencia360EventBus ?? new InMemoryEventBus();

if (!globalThis.__residencia360EventBus) {
  globalThis.__residencia360EventBus = eventBus;
}
