import { MemoryMetrics, ProjectEstimatorParams } from './types';

export class MemoryMonitorService {
  /**
   * Estimates project memory usage and checks performance.memory if available in Chromium.
   */
  public getMemoryMetrics(params?: ProjectEstimatorParams, registeredResourcesSizeBytes: number = 0): MemoryMetrics {
    const width = params?.width ?? 64;
    const height = params?.height ?? 64;
    const layersCount = params?.layersCount ?? 1;
    const framesCount = params?.framesCount ?? 1;
    const historyDepth = params?.historyDepth ?? 0;

    // RGBA 32-bit = 4 bytes per pixel
    const singleFrameLayerBytes = width * height * 4;
    const layersBytes = singleFrameLayerBytes * layersCount * framesCount;
    // Main display canvas + scratch canvas buffers (~3 buffers)
    const canvasBytes = singleFrameLayerBytes * 3;
    // Estimated diff or snapshot size per history step (~25% of single frame per step)
    const historyBytes = Math.round(singleFrameLayerBytes * 0.25 * historyDepth);
    const resourcesBytes = registeredResourcesSizeBytes;

    const estimatedProjectBytes = layersBytes + canvasBytes + historyBytes + resourcesBytes;

    let usedHeapBytes: number | undefined;
    let totalHeapBytes: number | undefined;
    let heapLimitBytes: number | undefined;
    let isRealMemoryAvailable = false;

    if (typeof window !== 'undefined' && 'performance' in window) {
      const perf = window.performance as any;
      if (perf && perf.memory) {
        usedHeapBytes = perf.memory.usedJSHeapSize;
        totalHeapBytes = perf.memory.totalJSHeapSize;
        heapLimitBytes = perf.memory.jsHeapSizeLimit;
        isRealMemoryAvailable = true;
      }
    }

    return {
      usedHeapBytes,
      totalHeapBytes,
      heapLimitBytes,
      estimatedProjectBytes,
      breakdown: {
        canvasBytes,
        layersBytes,
        historyBytes,
        resourcesBytes
      },
      isRealMemoryAvailable
    };
  }
}
