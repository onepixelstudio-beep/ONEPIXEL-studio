export type HealthStatusLevel = 'healthy' | 'warning' | 'critical';

export type PerformanceLevel = 'optimal' | 'degraded' | 'critical';

export type ResourceCategory = 'objectUrl' | 'imageBitmap' | 'canvas' | 'blob' | 'buffer' | 'other';

export interface RegisteredResource {
  id: string;
  category: ResourceCategory;
  ref: any;
  sizeBytes: number;
  registeredAt: number;
  description?: string;
  disposeFn?: () => void;
}

export interface ProjectEstimatorParams {
  width?: number;
  height?: number;
  layersCount?: number;
  framesCount?: number;
  historyDepth?: number;
}

export interface MemoryBreakdown {
  canvasBytes: number;
  layersBytes: number;
  historyBytes: number;
  resourcesBytes: number;
}

export interface MemoryMetrics {
  usedHeapBytes?: number;
  totalHeapBytes?: number;
  heapLimitBytes?: number;
  estimatedProjectBytes: number;
  breakdown: MemoryBreakdown;
  isRealMemoryAvailable: boolean;
}

export interface PerformanceMetrics {
  fps: number;
  avgFrameTimeMs: number;
  status: PerformanceLevel;
  longTaskCount: number;
  lastCheckTimestamp: number;
}

export interface HealthState {
  status: HealthStatusLevel;
  memory: MemoryMetrics;
  performance: PerformanceMetrics;
  registeredResourceCount: number;
  lastUpdated: number;
  warnings: string[];
}

export interface ResourceStatistics {
  count: number;
  totalSizeBytes: number;
  byCategory: Record<ResourceCategory, { count: number; totalSizeBytes: number }>;
}
