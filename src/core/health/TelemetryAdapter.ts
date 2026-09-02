import { telemetry } from '../../utils/telemetry';
import { HealthStatusLevel, PerformanceLevel, PerformanceMetrics } from './types';

export class TelemetryAdapter {
  /**
   * Logs system health events into flight recorder without creating duplicate loggers.
   */
  public logHealthStateChange(previousStatus: HealthStatusLevel, newStatus: HealthStatusLevel, details?: Record<string, any>): void {
    if (previousStatus === newStatus) return;

    telemetry.logAction(`HEALTH_STATUS_CHANGE_${newStatus.toUpperCase()}`, `System health transitioned from ${previousStatus} to ${newStatus}`, {
      previousStatus,
      newStatus,
      ...details
    });
  }

  /**
   * Logs performance status transitions (optimal -> degraded -> critical).
   */
  public logPerformanceStatusChange(previousStatus: PerformanceLevel, newStatus: PerformanceLevel, metrics: PerformanceMetrics): void {
    if (previousStatus === newStatus) return;

    telemetry.logAction(`PERFORMANCE_STATUS_CHANGE_${newStatus.toUpperCase()}`, `Performance status changed from ${previousStatus} to ${newStatus}`, {
      previousStatus,
      newStatus,
      fps: metrics.fps,
      avgFrameTimeMs: metrics.avgFrameTimeMs,
      longTaskCount: metrics.longTaskCount
    });
  }

  /**
   * Logs memory warnings or resource disposal events.
   */
  public logHealthWarning(warningMessage: string, context?: Record<string, any>): void {
    telemetry.logAction('HEALTH_SYSTEM_WARNING', warningMessage, context);
  }

  public logResourceDisposal(count: number, freedSizeBytes: number): void {
    telemetry.logAction('HEALTH_RESOURCE_DISPOSAL', `Disposed ${count} resource(s) freeing ~${(freedSizeBytes / 1024 / 1024).toFixed(2)}MB`, {
      count,
      freedSizeBytes
    });
  }
}
