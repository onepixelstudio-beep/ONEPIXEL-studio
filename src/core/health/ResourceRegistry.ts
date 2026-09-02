import { RegisteredResource, ResourceCategory, ResourceStatistics } from './types';

export class ResourceRegistry {
  private resources: Map<string, RegisteredResource> = new Map();

  /**
   * Register a temporary resource for lifecycle management and disposal.
   */
  public register(
    id: string,
    category: ResourceCategory,
    ref: any,
    options?: {
      sizeBytes?: number;
      description?: string;
      disposeFn?: () => void;
    }
  ): void {
    // If existing under same id, dispose old one first to avoid leak
    if (this.resources.has(id)) {
      this.dispose(id);
    }

    const estimatedSize = options?.sizeBytes ?? this.estimateResourceSize(category, ref);

    const resource: RegisteredResource = {
      id,
      category,
      ref,
      sizeBytes: estimatedSize,
      registeredAt: Date.now(),
      description: options?.description,
      disposeFn: options?.disposeFn
    };

    this.resources.set(id, resource);
  }

  /**
   * Safely dispose a single resource by ID.
   */
  public dispose(id: string): boolean {
    const resource = this.resources.get(id);
    if (!resource) return false;

    try {
      if (resource.disposeFn) {
        resource.disposeFn();
      }

      switch (resource.category) {
        case 'objectUrl':
          if (typeof resource.ref === 'string' && typeof URL !== 'undefined' && URL.revokeObjectURL) {
            URL.revokeObjectURL(resource.ref);
          }
          break;

        case 'imageBitmap':
          if (resource.ref && typeof resource.ref.close === 'function') {
            resource.ref.close();
          }
          break;

        case 'canvas':
          if (resource.ref) {
            if ('width' in resource.ref) resource.ref.width = 0;
            if ('height' in resource.ref) resource.ref.height = 0;
          }
          break;

        case 'blob':
        case 'buffer':
        case 'other':
          // JS Garbage collector will collect when reference is cleared
          break;
      }
    } catch (e) {
      console.warn(`[ResourceRegistry] Failed to dispose resource ${id}:`, e);
    } finally {
      this.resources.delete(id);
    }

    return true;
  }

  /**
   * Dispose all registered resources.
   */
  public disposeAll(): number {
    const keys = Array.from(this.resources.keys());
    let count = 0;
    for (const key of keys) {
      if (this.dispose(key)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Returns summary statistics of currently registered resources.
   */
  public getStatistics(): ResourceStatistics {
    let totalSizeBytes = 0;
    const byCategory: Record<ResourceCategory, { count: number; totalSizeBytes: number }> = {
      objectUrl: { count: 0, totalSizeBytes: 0 },
      imageBitmap: { count: 0, totalSizeBytes: 0 },
      canvas: { count: 0, totalSizeBytes: 0 },
      blob: { count: 0, totalSizeBytes: 0 },
      buffer: { count: 0, totalSizeBytes: 0 },
      other: { count: 0, totalSizeBytes: 0 }
    };

    this.resources.forEach((res) => {
      totalSizeBytes += res.sizeBytes;
      const cat = byCategory[res.category] || { count: 0, totalSizeBytes: 0 };
      cat.count++;
      cat.totalSizeBytes += res.sizeBytes;
      byCategory[res.category] = cat;
    });

    return {
      count: this.resources.size,
      totalSizeBytes,
      byCategory
    };
  }

  /**
   * Helper to estimate size in bytes if not explicitly provided.
   */
  private estimateResourceSize(category: ResourceCategory, ref: any): number {
    if (!ref) return 0;

    if (category === 'canvas' && typeof ref === 'object') {
      const w = ref.width || 0;
      const h = ref.height || 0;
      return w * h * 4;
    }

    if (category === 'imageBitmap' && typeof ref === 'object') {
      const w = ref.width || 0;
      const h = ref.height || 0;
      return w * h * 4;
    }

    if (category === 'blob' && ref instanceof Blob) {
      return ref.size;
    }

    if (category === 'buffer') {
      if (ref instanceof ArrayBuffer) return ref.byteLength;
      if (ArrayBuffer.isView(ref)) return ref.byteLength;
    }

    return 1024; // Default fallback ~1KB
  }
}
