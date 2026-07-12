/**
 * Minimal typed event bus. The companion UI publishes chat/agent lifecycle
 * events here; the cat stage (and anything else) subscribes to react —
 * keeping animation logic decoupled from data fetching.
 */

export type CompanionEventMap = {
  "chat:thinking": undefined;
  "chat:streaming": undefined;
  "chat:done": undefined;
  "chat:error": { message: string };
  "agent:working": { agent: string };
  "agent:done": { agent: string };
  "agent:error": { agent: string };
  "agents:idle": undefined;
};

type Handler<T> = (payload: T) => void;

export class EventBus<Events extends Record<string, unknown>> {
  private handlers = new Map<keyof Events, Set<Handler<never>>>();

  on<K extends keyof Events>(event: K, handler: Handler<Events[K]>): () => void {
    const set = this.handlers.get(event) ?? new Set();
    set.add(handler as Handler<never>);
    this.handlers.set(event, set);
    return () => {
      set.delete(handler as Handler<never>);
    };
  }

  emit<K extends keyof Events>(
    event: K,
    ...args: Events[K] extends undefined ? [] : [Events[K]]
  ): void {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const handler of set) (handler as Handler<Events[K] | undefined>)(args[0]);
  }
}

/** Singleton bus for companion UI events (client-side only). */
export const companionBus = new EventBus<CompanionEventMap>();
