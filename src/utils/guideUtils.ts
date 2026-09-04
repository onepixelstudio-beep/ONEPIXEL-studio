import { Guide } from '../types';

export const GUIDES_RULERS_THEME = {
  guideProjectColor: '#C8A96A',      // Gold
  guideSessionColor: '#E6F0E9',      // Minty Cream
  guideHighlightColor: '#C8A96A',    // Gold
  rulerBackground: '#102419',
  rulerBorder: '#17382B',
  rulerTextColor: '#F7F6F1',         // Warm Cream
  rulerTickColor: '#C8A96A',         // Gold
  rulerIndicatorColor: '#C8A96A',   // Gold
};

export interface SnapContext {
  zoom: number;
  gridSize: number;
  gridVisible: boolean;
  guides: Guide[];
  guidesVisible: boolean;
  canvasWidth: number;
  canvasHeight: number;
  symmetry?: {
    x: boolean;
    y: boolean;
    centerX: number;
    centerY: number;
  };
  selectionBounds?: { x: number; y: number; width: number; height: number } | null;
  altKey?: boolean;
}

export interface SnapResult {
  x: number;
  y: number;
  snapped: boolean;
  targets: { x?: string; y?: string };
}

export interface SnapProvider {
  name: string;
  priority: number; // lower number = higher priority
  snapX(x: number, context: SnapContext, tolerance: number): { value: number; snapped: boolean; target: string } | null;
  snapY(y: number, context: SnapContext, tolerance: number): { value: number; snapped: boolean; target: string } | null;
}

// 1. Selection Bounds Provider (Priority 10)
export const SelectionBoundsSnapProvider: SnapProvider = {
  name: 'selection',
  priority: 10,
  snapX(x, context, tolerance) {
    if (!context.selectionBounds) return null;
    const { x: sx, width } = context.selectionBounds;
    const targets = [
      { val: sx, name: 'Borde Izquierdo Selección' },
      { val: sx + width, name: 'Borde Derecho Selección' },
      { val: sx + width / 2, name: 'Centro Selección' }
    ];
    for (const t of targets) {
      if (Math.abs(x - t.val) <= tolerance) {
        return { value: t.val, snapped: true, target: t.name };
      }
    }
    return null;
  },
  snapY(y, context, tolerance) {
    if (!context.selectionBounds) return null;
    const { y: sy, height } = context.selectionBounds;
    const targets = [
      { val: sy, name: 'Borde Superior Selección' },
      { val: sy + height, name: 'Borde Inferior Selección' },
      { val: sy + height / 2, name: 'Centro Selección' }
    ];
    for (const t of targets) {
      if (Math.abs(y - t.val) <= tolerance) {
        return { value: t.val, snapped: true, target: t.name };
      }
    }
    return null;
  }
};

// 2. Guides Provider (Priority 20)
export const GuidesSnapProvider: SnapProvider = {
  name: 'guides',
  priority: 20,
  snapX(x, context, tolerance) {
    if (!context.guidesVisible || !context.guides) return null;
    const verticalGuides = context.guides.filter(g => g.type === 'vertical');
    for (const g of verticalGuides) {
      if (Math.abs(x - g.position) <= tolerance) {
        return { value: g.position, snapped: true, target: g.isProjectLevel ? 'Guía Proyecto V' : 'Guía Sesión V' };
      }
    }
    return null;
  },
  snapY(y, context, tolerance) {
    if (!context.guidesVisible || !context.guides) return null;
    const horizontalGuides = context.guides.filter(g => g.type === 'horizontal');
    for (const g of horizontalGuides) {
      if (Math.abs(y - g.position) <= tolerance) {
        return { value: g.position, snapped: true, target: g.isProjectLevel ? 'Guía Proyecto H' : 'Guía Sesión H' };
      }
    }
    return null;
  }
};

// 3. Grid Provider (Priority 30)
export const GridSnapProvider: SnapProvider = {
  name: 'grid',
  priority: 30,
  snapX(x, context, tolerance) {
    if (!context.gridVisible) return null;
    const size = context.gridSize || 1;
    const rounded = Math.round(x / size) * size;
    if (Math.abs(x - rounded) <= tolerance) {
      return { value: rounded, snapped: true, target: `Cuadrícula (${size}px)` };
    }
    return null;
  },
  snapY(y, context, tolerance) {
    if (!context.gridVisible) return null;
    const size = context.gridSize || 1;
    const rounded = Math.round(y / size) * size;
    if (Math.abs(y - rounded) <= tolerance) {
      return { value: rounded, snapped: true, target: `Cuadrícula (${size}px)` };
    }
    return null;
  }
};

// 4. Symmetry Provider (Priority 40)
export const SymmetrySnapProvider: SnapProvider = {
  name: 'symmetry',
  priority: 40,
  snapX(x, context, tolerance) {
    if (!context.symmetry || !context.symmetry.x) return null;
    const center = context.symmetry.centerX;
    if (Math.abs(x - center) <= tolerance) {
      return { value: center, snapped: true, target: 'Eje de Simetría V' };
    }
    return null;
  },
  snapY(y, context, tolerance) {
    if (!context.symmetry || !context.symmetry.y) return null;
    const center = context.symmetry.centerY;
    if (Math.abs(y - center) <= tolerance) {
      return { value: center, snapped: true, target: 'Eje de Simetría H' };
    }
    return null;
  }
};

// 5. Canvas Bounds Provider (Priority 50)
export const CanvasBoundsSnapProvider: SnapProvider = {
  name: 'canvasBounds',
  priority: 50,
  snapX(x, context, tolerance) {
    const targets = [
      { val: 0, name: 'Borde Izquierdo Lienzo' },
      { val: context.canvasWidth, name: 'Borde Derecho Lienzo' }
    ];
    for (const t of targets) {
      if (Math.abs(x - t.val) <= tolerance) {
        return { value: t.val, snapped: true, target: t.name };
      }
    }
    return null;
  },
  snapY(y, context, tolerance) {
    const targets = [
      { val: 0, name: 'Borde Superior Lienzo' },
      { val: context.canvasHeight, name: 'Borde Inferior Lienzo' }
    ];
    for (const t of targets) {
      if (Math.abs(y - t.val) <= tolerance) {
        return { value: t.val, snapped: true, target: t.name };
      }
    }
    return null;
  }
};

// 6. Canvas Center Provider (Priority 45)
export const CanvasCenterSnapProvider: SnapProvider = {
  name: 'canvasCenter',
  priority: 45,
  snapX(x, context, tolerance) {
    const center = context.canvasWidth / 2;
    if (Math.abs(x - center) <= tolerance) {
      return { value: center, snapped: true, target: 'Centro del Lienzo V' };
    }
    return null;
  },
  snapY(y, context, tolerance) {
    const center = context.canvasHeight / 2;
    if (Math.abs(y - center) <= tolerance) {
      return { value: center, snapped: true, target: 'Centro del Lienzo H' };
    }
    return null;
  }
};

export const defaultSnapProviders: SnapProvider[] = [
  SelectionBoundsSnapProvider,
  GuidesSnapProvider,
  GridSnapProvider,
  SymmetrySnapProvider,
  CanvasCenterSnapProvider,
  CanvasBoundsSnapProvider
];

export class SnapEngine {
  private providers: SnapProvider[];

  constructor(providers: SnapProvider[] = defaultSnapProviders) {
    this.providers = [...providers].sort((a, b) => a.priority - b.priority);
  }

  public registerProvider(provider: SnapProvider) {
    this.providers.push(provider);
    this.providers.sort((a, b) => a.priority - b.priority);
  }

  public snap(x: number, y: number, context: SnapContext, toleranceScreenPixels: number = 8): SnapResult {
    if (context.altKey) {
      return { x, y, snapped: false, targets: {} };
    }

    const tolerance = toleranceScreenPixels / context.zoom;

    let snappedX = x;
    let snappedY = y;
    let snapped = false;
    const targets: { x?: string; y?: string } = {};

    // Intelligent, Jitter-Free Snapping:
    // Gather all snapping candidates in range, and select the one with minimal distance.
    // If there is a tie, the provider with the higher priority (lower priority number) wins.
    let bestSnapX: { value: number; distance: number; target: string; priority: number } | null = null;
    let bestSnapY: { value: number; distance: number; target: string; priority: number } | null = null;

    for (const p of this.providers) {
      if (p.name === 'selection' && !context.selectionBounds) continue;
      if (p.name === 'symmetry' && !context.symmetry) continue;

      const resX = p.snapX(x, context, tolerance);
      if (resX && resX.snapped) {
        const distance = Math.abs(x - resX.value);
        if (distance <= tolerance) {
          if (!bestSnapX || distance < bestSnapX.distance || (distance === bestSnapX.distance && p.priority < bestSnapX.priority)) {
            bestSnapX = { value: resX.value, distance, target: resX.target, priority: p.priority };
          }
        }
      }

      const resY = p.snapY(y, context, tolerance);
      if (resY && resY.snapped) {
        const distance = Math.abs(y - resY.value);
        if (distance <= tolerance) {
          if (!bestSnapY || distance < bestSnapY.distance || (distance === bestSnapY.distance && p.priority < bestSnapY.priority)) {
            bestSnapY = { value: resY.value, distance, target: resY.target, priority: p.priority };
          }
        }
      }
    }

    if (bestSnapX) {
      snappedX = bestSnapX.value;
      snapped = true;
      targets.x = bestSnapX.target;
    }

    if (bestSnapY) {
      snappedY = bestSnapY.value;
      snapped = true;
      targets.y = bestSnapY.target;
    }

    return {
      x: snappedX,
      y: snappedY,
      snapped,
      targets
    };
  }
}

// GuideManager Namespace
export const GuideManager = {
  createGuide(type: 'horizontal' | 'vertical', position: number, isProjectLevel: boolean): Guide {
    return {
      id: `guide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      position,
      isProjectLevel,
      locked: false,
    };
  },

  moveGuide(guides: Guide[], id: string, newPosition: number): Guide[] {
    return guides.map(g => g.id === id ? { ...g, position: newPosition } : g);
  },

  removeGuide(guides: Guide[], id: string): Guide[] {
    return guides.filter(g => g.id !== id);
  },

  clearGuides(guides: Guide[], level: 'project' | 'session' | 'all' = 'all'): Guide[] {
    if (level === 'all') return [];
    if (level === 'project') return guides.filter(g => !g.isProjectLevel);
    return guides.filter(g => g.isProjectLevel);
  },

  lockGuides(guides: Guide[], locked: boolean): Guide[] {
    return guides.map(g => ({ ...g, locked }));
  },

  getVisibleGuides(guides: Guide[]): Guide[] {
    return guides; // Visbility is handled at overlay level, but keep for API structure
  },

  serializeGuides(guides: Guide[]): string {
    return JSON.stringify(guides);
  },

  deserializeGuides(serialized: string): Guide[] {
    try {
      return JSON.parse(serialized);
    } catch {
      return [];
    }
  }
};

// Adaptive steps for Ruler Ticks (Requirement 6 / 7)
// Dynamic calculation: keeps a minimum comfortable text-label separation (e.g. 50-60 pixels), 
// and rounds to a nice power/multiple step (1, 2, 5, 10, 20, 50, 100, 200, 500, etc.)
export function calculateRulerStep(zoom: number): number {
  const targetSpacing = 60; // We want labels spaced by at least 60 screen pixels
  const rawStep = targetSpacing / zoom;
  
  const niceSteps = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
  for (const step of niceSteps) {
    if (step >= rawStep) {
      return step;
    }
  }
  return 1000;
}
