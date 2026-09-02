import {
  HealthState,
  HealthStatusLevel,
  PerformanceLevel,
  PerformanceMetrics,
  ProjectEstimatorParams,
  ResourceCategory,
  ResourceStatistics
} from './types';
import { MemoryMonitorService } from './MemoryMonitorService';
import { ResourceRegistry } from './ResourceRegistry';
import { TelemetryAdapter } from './TelemetryAdapter';
import { PerformanceWatchdog } from './PerformanceWatchdog';
import { HeartbeatService } from './HeartbeatService';

export class SystemHealthManager {
  private static instance: SystemHealthManager | null = null;

  private memoryMonitor: MemoryMonitorService;
  private resourceRegistry: ResourceRegistry;
  private telemetryAdapter: TelemetryAdapter;
  private performanceWatchdog: PerformanceWatchdog;
  private heartbeatService: HeartbeatService;

  private listeners: Set<(state: HealthState) => void> = new Set();

  private currentState: HealthState;
  private lastPerformanceStatus: PerformanceLevel = 'optimal';

  // Thresholds
  private readonly MEMORY_WARNING_THRESHOLD_BYTES = 256 * 1024 * 1024; // 256MB estimated
  private readonly MEMORY_CRITICAL_THRESHOLD_BYTES = 768 * 1024 * 1024; // 768MB estimated

  private constructor() {
    this.memoryMonitor = new MemoryMonitorService();
    this.resourceRegistry = new ResourceRegistry();
    this.telemetryAdapter = new TelemetryAdapter();
    this.performanceWatchdog = new PerformanceWatchdog();

    // Start performance sampling loop
    this.performanceWatchdog.start();

    const initialPerformance = this.performanceWatchdog.getPerformanceMetrics();
    const initialMemory = this.memoryMonitor.getMemoryMetrics();

    this.currentState = {
      status: 'healthy',
      memory: initialMemory,
      performance: initialPerformance,
      registeredResourceCount: 0,
      lastUpdated: Date.now(),
      warnings: []
    };

    // HeartbeatService tick triggers lightweight health update
    this.heartbeatService = new HeartbeatService(() => {
      this.updateHealth();
    }, 3000);

    // Auto-start heartbeat
    this.heartbeatService.start();
  }

  public static getInstance(): SystemHealthManager {
    if (!SystemHealthManager.instance) {
      SystemHealthManager.instance = new SystemHealthManager();
    }
    return SystemHealthManager.instance;
  }

  /**
   * Updates system health state based on project parameters, performance watchdog, and registered resources.
   */
  public updateHealth(projectInfo?: ProjectEstimatorParams): HealthState {
    const stats = this.resourceRegistry.getStatistics();
    const memory = this.memoryMonitor.getMemoryMetrics(projectInfo, stats.totalSizeBytes);
    const performance = this.performanceWatchdog.getPerformanceMetrics();

    const warnings: string[] = [];
    let memoryStatus: HealthStatusLevel = 'healthy';

    // Memory evaluation
    const effectiveBytes = memory.usedHeapBytes ?? memory.estimatedProjectBytes;
    if (effectiveBytes > this.MEMORY_CRITICAL_THRESHOLD_BYTES) {
      memoryStatus = 'critical';
      warnings.push(`High memory usage detected (~${Math.round(effectiveBytes / (1024 * 1024))} MB).`);
    } else if (effectiveBytes > this.MEMORY_WARNING_THRESHOLD_BYTES) {
      memoryStatus = 'warning';
      warnings.push(`Moderate memory usage (~${Math.round(effectiveBytes / (1024 * 1024))} MB).`);
    }

    if (stats.count > 100) {
      if (memoryStatus !== 'critical') memoryStatus = 'warning';
      warnings.push(`High number of active resources registered (${stats.count}).`);
    }

    // Performance evaluation
    if (performance.status === 'critical') {
      warnings.push(`Frame rate severe drop detected (${performance.fps} FPS, avg ${performance.avgFrameTimeMs}ms/frame).`);
    } else if (performance.status === 'degraded') {
      warnings.push(`Sub-optimal frame rate (${performance.fps} FPS, avg ${performance.avgFrameTimeMs}ms/frame).`);
    }

    // Overall status synthesis
    let overallStatus: HealthStatusLevel = 'healthy';
    if (memoryStatus === 'critical' || performance.status === 'critical') {
      overallStatus = 'critical';
    } else if (memoryStatus === 'warning' || performance.status === 'degraded') {
      overallStatus = 'warning';
    }

    const previousStatus = this.currentState.status;
    const previousPerformanceStatus = this.lastPerformanceStatus;

    this.currentState = {
      status: overallStatus,
      memory,
      performance,
      registeredResourceCount: stats.count,
      lastUpdated: Date.now(),
      warnings
    };

    // Log telemetry on status transitions
    if (previousStatus !== overallStatus) {
      this.telemetryAdapter.logHealthStateChange(previousStatus, overallStatus, {
        warnings,
        registeredResourceCount: stats.count,
        estimatedBytes: memory.estimatedProjectBytes,
        fps: performance.fps
      });
    }

    if (previousPerformanceStatus !== performance.status) {
      this.telemetryAdapter.logPerformanceStatusChange(previousPerformanceStatus, performance.status, performance);
      this.lastPerformanceStatus = performance.status;
    }

    this.notifyListeners();
    return this.currentState;
  }

  /**
   * Gets current health state snapshot (for HealthDashboard / monitoring).
   */
  public getHealthState(): HealthState {
    return this.currentState;
  }

  /**
   * Gets current memory metrics snapshot.
   */
  public getMemoryMetrics() {
    return this.currentState.memory;
  }

  /**
   * Gets current performance metrics snapshot.
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    return this.currentState.performance;
  }

  /**
   * Gets resource registry statistics snapshot.
   */
  public getResourceStatistics(): ResourceStatistics {
    return this.resourceRegistry.getStatistics();
  }

  /**
   * Register a resource in central registry.
   */
  public registerResource(
    id: string,
    category: ResourceCategory,
    ref: any,
    options?: { sizeBytes?: number; description?: string; disposeFn?: () => void }
  ): void {
    this.resourceRegistry.register(id, category, ref, options);
  }

  /**
   * Dispose a single registered resource.
   */
  public disposeResource(id: string): boolean {
    return this.resourceRegistry.dispose(id);
  }

  /**
   * Dispose all registered resources.
   */
  public disposeAllResources(): number {
    const stats = this.resourceRegistry.getStatistics();
    const count = this.resourceRegistry.disposeAll();
    if (count > 0) {
      this.telemetryAdapter.logResourceDisposal(count, stats.totalSizeBytes);
    }
    return count;
  }

  /**
   * Heartbeat control methods.
   */
  public startHeartbeat(): void {
    this.heartbeatService.start();
  }

  public stopHeartbeat(): void {
    this.heartbeatService.stop();
  }

  public pauseHeartbeat(): void {
    this.heartbeatService.pause();
  }

  public resumeHeartbeat(): void {
    this.heartbeatService.resume();
  }

  public setHeartbeatInterval(ms: number): void {
    this.heartbeatService.setIntervalMs(ms);
  }

  /**
   * Subscribe to health state updates.
   */
  public subscribe(listener: (state: HealthState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentState);
      } catch (e) {
        console.warn('[SystemHealthManager] Error in health listener:', e);
      }
    });
  }
}

export const systemHealthManager = SystemHealthManager.getInstance();
