import { Frame, AnimationTag, PlaybackState, PlaybackSnapshot } from '../../types';
import { animationEventBus } from './EventBus';
import { telemetry } from '../telemetry';


export type PlaybackMode = 'forward' | 'reverse' | 'pingpong';

export class PlaybackController {
  private static instance: PlaybackController | null = null;

  private state: PlaybackState = 'stopped';
  private frames: Frame[] = [];
  private activeFrameIndex: number = 0;
  private speedMultiplier: number = 1.0;
  private loop: boolean = true;
  private playbackMode: PlaybackMode = 'forward';
  private pingPongDirection: 'forward' | 'reverse' = 'forward';
  
  // Tag restriction (Optional)
  private activeTag: AnimationTag | null = null;

  // Custom frame range restriction (Optional)
  private customRange: { start: number; end: number } | null = null;

  // Timing
  private lastTime: number = 0;
  private accumulatedTime: number = 0;
  private animationFrameId: number | null = null;

  private constructor() {}

  public static getInstance(): PlaybackController {
    if (!PlaybackController.instance) {
      PlaybackController.instance = new PlaybackController();
    }
    return PlaybackController.instance;
  }

  public setConfig(
    frames: Frame[],
    activeIndex: number,
    mode: PlaybackMode = 'forward',
    loop: boolean = true,
    speed: number = 1.0
  ) {
    this.frames = frames;
    if (this.state !== 'playing' || activeIndex !== this.activeFrameIndex) {
      // Clamp active index to frames list size
      if (frames.length > 0) {
        this.activeFrameIndex = Math.max(0, Math.min(activeIndex, frames.length - 1));
      } else {
        this.activeFrameIndex = 0;
      }
    }
    this.playbackMode = mode;
    this.loop = loop;
    this.speedMultiplier = speed;
  }

  public getBounds(): { minIdx: number; maxIdx: number } {
    if (this.frames.length === 0) {
      return { minIdx: 0, maxIdx: 0 };
    }

    if (this.customRange) {
      const min = Math.max(0, Math.min(this.customRange.start, this.frames.length - 1));
      const max = Math.max(0, Math.min(this.customRange.end, this.frames.length - 1));
      return {
        minIdx: Math.min(min, max),
        maxIdx: Math.max(min, max)
      };
    }

    if (this.activeTag) {
      const min = Math.max(0, Math.min(this.activeTag.startFrameIndex, this.frames.length - 1));
      const max = Math.max(0, Math.min(this.activeTag.endFrameIndex, this.frames.length - 1));
      return {
        minIdx: Math.min(min, max),
        maxIdx: Math.max(min, max)
      };
    }

    return {
      minIdx: 0,
      maxIdx: this.frames.length - 1
    };
  }

  public play() {
    this.start();
  }

  public start() {
    if (this.state === 'playing') return;
    if (this.frames.length === 0) return;

    this.state = 'playing';
    this.lastTime = performance.now();
    this.accumulatedTime = 0;
    this.pingPongDirection = 'forward';
    
    // Ensure we start within bounds
    const { minIdx, maxIdx } = this.getBounds();
    if (this.activeFrameIndex < minIdx || this.activeFrameIndex > maxIdx) {
      this.activeFrameIndex = this.playbackMode === 'reverse' ? maxIdx : minIdx;
    }

    animationEventBus.emit('PLAYBACK_STATE_CHANGED', { isPlaying: true, state: 'playing' });
    animationEventBus.emit('PLAYBACK_TICK', { index: this.activeFrameIndex });
    
    this.loopStep();
  }

  public pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    animationEventBus.emit('PLAYBACK_STATE_CHANGED', { isPlaying: false, state: 'paused' });
  }

  public stop() {
    this.pause();
    this.state = 'stopped';
    const { minIdx, maxIdx } = this.getBounds();
    this.activeFrameIndex = this.playbackMode === 'reverse' ? maxIdx : minIdx;
    this.pingPongDirection = 'forward';
    this.accumulatedTime = 0;
    
    animationEventBus.emit('PLAYBACK_STATE_CHANGED', { isPlaying: false, state: 'stopped' });
    animationEventBus.emit('PLAYBACK_TICK', { index: this.activeFrameIndex });
  }

  public seek(index: number) {
    if (this.frames.length === 0) return;
    const clampedIndex = Math.max(0, Math.min(index, this.frames.length - 1));
    this.activeFrameIndex = clampedIndex;
    this.accumulatedTime = 0; // reset timing on manual jump
    
    animationEventBus.emit('PLAYBACK_TICK', { index: this.activeFrameIndex });
  }

  public nextFrame() {
    if (this.frames.length <= 1) return;
    const { minIdx, maxIdx } = this.getBounds();
    let nextIdx = this.activeFrameIndex + 1;
    if (nextIdx > maxIdx) {
      nextIdx = this.loop ? minIdx : maxIdx;
    }
    this.seek(nextIdx);
  }

  public previousFrame() {
    if (this.frames.length <= 1) return;
    const { minIdx, maxIdx } = this.getBounds();
    let prevIdx = this.activeFrameIndex - 1;
    if (prevIdx < minIdx) {
      prevIdx = this.loop ? maxIdx : minIdx;
    }
    this.seek(prevIdx);
  }

  public setSpeed(multiplier: number) {
    this.speedMultiplier = multiplier;
  }

  public setPlaybackMode(mode: PlaybackMode) {
    this.playbackMode = mode;
  }

  public setLoop(loop: boolean) {
    this.loop = loop;
  }

  public setActiveTag(tag: AnimationTag | null) {
    this.activeTag = tag;
    // If active frame is out of the new tag bounds, reset it
    if (tag) {
      const min = Math.max(0, Math.min(tag.startFrameIndex, this.frames.length - 1));
      const max = Math.max(0, Math.min(tag.endFrameIndex, this.frames.length - 1));
      if (this.activeFrameIndex < min || this.activeFrameIndex > max) {
        this.activeFrameIndex = min;
        animationEventBus.emit('PLAYBACK_TICK', { index: this.activeFrameIndex });
      }
    }
  }

  public getActiveTag(): AnimationTag | null {
    return this.activeTag;
  }

  public setCustomRange(range: { start: number; end: number } | null) {
    this.customRange = range;
    if (range) {
      const min = Math.max(0, Math.min(range.start, this.frames.length - 1));
      const max = Math.max(0, Math.min(range.end, this.frames.length - 1));
      const minIdx = Math.min(min, max);
      const maxIdx = Math.max(min, max);
      if (this.activeFrameIndex < minIdx || this.activeFrameIndex > maxIdx) {
        this.activeFrameIndex = minIdx;
        animationEventBus.emit('PLAYBACK_TICK', { index: this.activeFrameIndex });
      }
    }
  }

  public getCustomRange(): { start: number; end: number } | null {
    return this.customRange;
  }

  public getIsPlaying(): boolean {
    return this.state === 'playing';
  }

  public getState(): PlaybackState {
    return this.state;
  }

  public getSnapshot(): PlaybackSnapshot {
    return {
      state: this.state,
      activeFrameIndex: this.activeFrameIndex,
      playbackMode: this.playbackMode,
      pingPongDirection: this.pingPongDirection,
      speedMultiplier: this.speedMultiplier,
      loop: this.loop,
      activeTag: this.activeTag ? { ...this.activeTag } : null,
      customRange: this.customRange ? { ...this.customRange } : null
    };
  }

  public getActiveFrameIndex(): number {
    return this.activeFrameIndex;
  }

  private loopStep = () => {
    if (this.state !== 'playing') return;

    const usedMemory = (typeof window !== 'undefined' && (window.performance as any)?.memory) 
      ? (window.performance as any).memory.usedJSHeapSize 
      : 0;
    telemetry.recordAnimationMemory(usedMemory);

    const now = performance.now();
    const deltaTime = now - this.lastTime;
    this.lastTime = now;

    // Protection against massive lag or background tab suspension
    if (deltaTime > 1000) {
      this.animationFrameId = requestAnimationFrame(this.loopStep);
      return;
    }

    this.accumulatedTime += deltaTime * this.speedMultiplier;

    // Get current frame duration or fall back to default of 100ms
    const currentFrame = this.frames[this.activeFrameIndex];
    const duration = currentFrame?.durationMs ?? 100;

    if (this.accumulatedTime >= duration) {
      this.accumulatedTime -= duration;
      this.advanceFrame();
    }

    this.animationFrameId = requestAnimationFrame(this.loopStep);
  };

  private advanceFrame() {
    if (this.frames.length <= 1) return;

    const { minIdx, maxIdx } = this.getBounds();
    let nextIndex = this.activeFrameIndex;

    if (this.playbackMode === 'forward') {
      if (nextIndex < maxIdx) {
        nextIndex += 1;
      } else {
        if (this.loop) {
          nextIndex = minIdx;
        } else {
          this.pause();
          return;
        }
      }
    } else if (this.playbackMode === 'reverse') {
      if (nextIndex > minIdx) {
        nextIndex -= 1;
      } else {
        if (this.loop) {
          nextIndex = maxIdx;
        } else {
          this.pause();
          return;
        }
      }
    } else if (this.playbackMode === 'pingpong') {
      if (this.pingPongDirection === 'forward') {
        if (nextIndex < maxIdx) {
          nextIndex += 1;
        } else {
          if (minIdx === maxIdx) {
            if (!this.loop) {
              this.pause();
              return;
            }
          } else {
            this.pingPongDirection = 'reverse';
            nextIndex = maxIdx - 1;
          }
        }
      } else {
        if (nextIndex > minIdx) {
          nextIndex -= 1;
        } else {
          if (this.loop) {
            this.pingPongDirection = 'forward';
            nextIndex = minIdx + 1;
          } else {
            this.pause();
            return;
          }
        }
      }
    }

    // Safety checks
    if (nextIndex < 0 || nextIndex >= this.frames.length) {
      nextIndex = 0;
    }

    this.activeFrameIndex = nextIndex;
    
    // Broadcast tick
    animationEventBus.emit('PLAYBACK_TICK', { index: this.activeFrameIndex });
  }

  public destroy() {
    this.pause();
    this.frames = [];
    this.activeFrameIndex = 0;
    this.activeTag = null;
    this.customRange = null;
  }
}

export const playbackController = PlaybackController.getInstance();
