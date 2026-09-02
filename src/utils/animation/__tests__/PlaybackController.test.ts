import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PlaybackController } from '../PlaybackController';
import { animationEventBus } from '../EventBus';
import { Frame, AnimationTag } from '../../../types';

describe('PlaybackController', () => {
  let controller: PlaybackController;
  const mockFrames: Frame[] = [
    { id: 'f1', name: 'Frame 1', durationMs: 100 },
    { id: 'f2', name: 'Frame 2', durationMs: 150 },
    { id: 'f3', name: 'Frame 3', durationMs: 200 }
  ];

  beforeEach(() => {
    // We mock global request/cancel animation frames
    vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(123));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    
    // We mock performance.now
    let nowValue = 1000;
    vi.stubGlobal('performance', {
      now: () => nowValue
    });

    // Reset event bus listeners
    animationEventBus.clear();
    
    controller = PlaybackController.getInstance();
  });

  afterEach(() => {
    controller.destroy();
    vi.unstubAllGlobals();
  });

  it('should initialize and hold correct configuration', () => {
    controller.setConfig(mockFrames, 0, 'forward', true, 1.0);
    expect(controller.getActiveFrameIndex()).toBe(0);
    expect(controller.getIsPlaying()).toBe(false);
  });

  it('should notify play status on start() and emit tick on stop()', () => {
    const playStateCallback = vi.fn();
    animationEventBus.subscribe('PLAYBACK_STATE_CHANGED', playStateCallback);

    controller.setConfig(mockFrames, 0, 'forward', true, 1.0);
    expect(controller.getState()).toBe('stopped');
    controller.start();

    expect(controller.getIsPlaying()).toBe(true);
    expect(controller.getState()).toBe('playing');
    expect(playStateCallback).toHaveBeenCalledWith({ isPlaying: true, state: 'playing' });

    controller.pause();
    expect(controller.getIsPlaying()).toBe(false);
    expect(controller.getState()).toBe('paused');
    expect(playStateCallback).toHaveBeenCalledWith({ isPlaying: false, state: 'paused' });

    controller.stop();
    expect(controller.getIsPlaying()).toBe(false);
    expect(controller.getState()).toBe('stopped');
    expect(playStateCallback).toHaveBeenCalledWith({ isPlaying: false, state: 'stopped' });
  });

  it('should adjust frame if active frame is outside active tag limits', () => {
    const tickCallback = vi.fn();
    animationEventBus.subscribe('PLAYBACK_TICK', tickCallback);

    const tag: AnimationTag = {
      id: 'tag-1',
      name: 'Loop',
      color: '#fff',
      startFrameIndex: 1,
      endFrameIndex: 2
    };

    controller.setConfig(mockFrames, 0, 'forward', true, 1.0);
    controller.setActiveTag(tag);

    expect(controller.getActiveFrameIndex()).toBe(1); // Jumped to tag start index
    expect(tickCallback).toHaveBeenCalledWith({ index: 1 });
  });

  it('should support limiting playback to a custom frame range', () => {
    controller.setConfig(mockFrames, 0, 'forward', true, 1.0);
    controller.setCustomRange({ start: 1, end: 2 });

    expect(controller.getCustomRange()).toEqual({ start: 1, end: 2 });
    expect(controller.getActiveFrameIndex()).toBe(1); // Resets to start of custom range
  });

  it('should perform seek correctly', () => {
    const tickCallback = vi.fn();
    animationEventBus.subscribe('PLAYBACK_TICK', tickCallback);

    controller.setConfig(mockFrames, 0, 'forward', true, 1.0);
    controller.seek(2);

    expect(controller.getActiveFrameIndex()).toBe(2);
    expect(tickCallback).toHaveBeenCalledWith({ index: 2 });
  });

  it('should move to next and previous frames correctly', () => {
    controller.setConfig(mockFrames, 0, 'forward', true, 1.0);
    
    controller.nextFrame();
    expect(controller.getActiveFrameIndex()).toBe(1);

    controller.previousFrame();
    expect(controller.getActiveFrameIndex()).toBe(0);

    // Test loop boundaries
    controller.setLoop(true);
    controller.previousFrame(); // Wrap around from 0 to last (index 2)
    expect(controller.getActiveFrameIndex()).toBe(2);

    controller.nextFrame(); // Wrap around from index 2 to 0
    expect(controller.getActiveFrameIndex()).toBe(0);
  });

  it('should generate an immutable and correct snapshot via getSnapshot()', () => {
    controller.setConfig(mockFrames, 1, 'pingpong', false, 1.5);
    controller.setCustomRange({ start: 0, end: 2 });
    
    const snapshot = controller.getSnapshot();
    expect(snapshot.state).toBe('stopped');
    expect(snapshot.activeFrameIndex).toBe(1); // 1 is within [0, 2], so it is preserved
    expect(snapshot.playbackMode).toBe('pingpong');
    expect(snapshot.speedMultiplier).toBe(1.5);
    expect(snapshot.loop).toBe(false);
    expect(snapshot.customRange).toEqual({ start: 0, end: 2 });
    
    // Mutate snapshot copy to verify immutability
    snapshot.activeFrameIndex = 999;
    expect(controller.getActiveFrameIndex()).toBe(1);
  });
});
