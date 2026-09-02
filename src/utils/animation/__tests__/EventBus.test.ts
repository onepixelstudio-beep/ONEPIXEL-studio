import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus } from '../EventBus';

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = EventBus.getInstance();
    bus.clear();
  });

  it('should allow subscribing to and emitting events', () => {
    const callback = vi.fn();

    bus.subscribe('test-event', callback);
    bus.emit('test-event', { payload: 'hello' });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith({ payload: 'hello' });
  });

  it('should return an unsubscribe function that removes the listener', () => {
    const callback = vi.fn();

    const unsubscribe = bus.subscribe('test-event', callback);
    unsubscribe();

    bus.emit('test-event', { payload: 'hello' });

    expect(callback).not.toHaveBeenCalled();
  });

  it('should support multiple subscriptions on the same event type', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    bus.subscribe('multi-event', callback1);
    bus.subscribe('multi-event', callback2);

    bus.emit('multi-event', 'data');

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback1).toHaveBeenCalledWith('data');
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledWith('data');
  });

  it('should clear all listeners when clear() is called', () => {
    const callback = vi.fn();

    bus.subscribe('event', callback);
    bus.clear();

    bus.emit('event', 'data');

    expect(callback).not.toHaveBeenCalled();
  });
});
