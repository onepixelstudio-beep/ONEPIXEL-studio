import { PerformanceLevel, PerformanceMetrics } from './types';

export class PerformanceWatchdog {
  private isRunning: boolean = false;
  private rafId: number | null = null;
  private lastFrameTime: number = 0;

  // Sliding window for frame deltas (in milliseconds)
  private frameDeltas: number[] = [];
  private readonly maxWindowSize = 60;

  private longTaskCount: number = 0;
  private readonly LONG_FRAME_THRESHOLD_MS = 100; // Frame time > 100ms considered long stall

  /**
   * Starts monitoring frame rendering performance.
   */
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.loop();
  }

  /**
   * Stops frame monitoring loop.
   */
  public stop(): void {
    this.isRunning = false;
    if (this.rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private loop = (): void => {
    if (!this.isRunning) return;

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;

    // Filter out crazy tab-background gaps (> 3000ms) to avoid skewing averages
    if (delta > 0 && delta < 3000) {
      this.frameDeltas.push(delta);
      if (this.frameDeltas.length > this.maxWindowSize) {
        this.frameDeltas.shift();
      }

      if (delta >= this.LONG_FRAME_THRESHOLD_MS) {
        this.longTaskCount++;
      }
    }

    if (typeof requestAnimationFrame !== 'undefined') {
      this.rafId = requestAnimationFrame(this.loop);
    }
  };

  /**
   * Calculates current performance metrics from collected frame deltas.
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    if (this.frameDeltas.length === 0) {
      return {
        fps: 60,
        avgFrameTimeMs: 16.67,
        status: 'optimal',
        longTaskCount: this.longTaskCount,
        lastCheckTimestamp: Date.now()
      };
    }

    const sum = this.frameDeltas.reduce((acc, val) => acc + val, 0);
    const avgFrameTimeMs = sum / this.frameDeltas.length;
    const rawFps = avgFrameTimeMs > 0 ? 1000 / avgFrameTimeMs : 60;
    const fps = Math.min(60, Math.round(rawFps * 10) / 10);

    let status: PerformanceLevel = 'optimal';
    if (avgFrameTimeMs > 50 || fps < 20) {
      status = 'critical';
    } else if (avgFrameTimeMs > 22.2 || fps < 45) {
      status = 'degraded';
    }

    return {
      fps,
      avgFrameTimeMs: Math.round(avgFrameTimeMs * 100) / 100,
      status,
      longTaskCount: this.longTaskCount,
      lastCheckTimestamp: Date.now()
    };
  }

  /**
   * Resets long task counter.
   */
  public resetCounters(): void {
    this.longTaskCount = 0;
  }
}
