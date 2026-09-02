export type EventCallback<T = any> = (payload: T) => void;

export class EventBus {
  private static instance: EventBus | null = null;
  private listeners: Record<string, EventCallback[]> = {};

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribe to an event. Returns an unsubscribe function.
   */
  public subscribe<T = any>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    return () => {
      this.unsubscribe(event, callback);
    };
  }

  /**
   * Unsubscribe from an event.
   */
  public unsubscribe<T = any>(event: string, callback: EventCallback<T>): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  /**
   * Emit an event to all subscribers.
   */
  public emit<T = any>(event: string, payload: T): void {
    if (!this.listeners[event]) return;
    // Copy listeners array to avoid issues if listeners unsubscribe during dispatch
    const currentListeners = [...this.listeners[event]];
    currentListeners.forEach(cb => {
      try {
        cb(payload);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  /**
   * Clear all subscribers. Useful for resetting system.
   */
  public clear(): void {
    this.listeners = {};
  }
}

export const animationEventBus = EventBus.getInstance();
