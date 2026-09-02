export class HeartbeatService {
  private timerId: ReturnType<typeof setInterval> | null = null;
  private intervalMs: number = 3000;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private tickCallback: (() => void) | null = null;

  constructor(tickCallback?: () => void, intervalMs: number = 3000) {
    if (tickCallback) {
      this.tickCallback = tickCallback;
    }
    this.intervalMs = intervalMs;
  }

  public setTickCallback(callback: () => void): void {
    this.tickCallback = callback;
  }

  public setIntervalMs(ms: number): void {
    this.intervalMs = ms;
    if (this.isRunning && !this.isPaused) {
      this.restart();
    }
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.scheduleTimer();
  }

  public stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    this.clearTimer();
  }

  public pause(): void {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;
    this.clearTimer();
  }

  public resume(): void {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
    this.scheduleTimer();
  }

  public isHeartbeatRunning(): boolean {
    return this.isRunning && !this.isPaused;
  }

  private scheduleTimer(): void {
    this.clearTimer();
    this.timerId = setInterval(() => {
      if (this.tickCallback && !this.isPaused) {
        try {
          this.tickCallback();
        } catch (e) {
          console.warn('[HeartbeatService] Error executing heartbeat tick:', e);
        }
      }
    }, this.intervalMs);
  }

  private restart(): void {
    this.clearTimer();
    this.scheduleTimer();
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}
