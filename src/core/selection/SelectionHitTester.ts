export type HandleId = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export type HitTarget =
  | { type: 'none' }
  | { type: 'inside' }
  | { type: 'border' }
  | { type: 'handle'; handle: HandleId }
  | { type: 'pivot' };

export interface SelectionHandle {
  id: HandleId;
  x: number;
  y: number;
}

export interface HitTesterOptions {
  handleRadiusScreenPx?: number;
  pivotRadiusScreenPx?: number;
  borderToleranceScreenPx?: number;
}

export class SelectionHitTester {
  public static getHandlePositions(bounds: { x: number; y: number; width: number; height: number }): SelectionHandle[] {
    const { x, y, width, height } = bounds;
    const midX = x + width / 2;
    const midY = y + height / 2;

    return [
      { id: 'nw', x, y },
      { id: 'n', x: midX, y },
      { id: 'ne', x: x + width, y },
      { id: 'e', x: x + width, y: midY },
      { id: 'se', x: x + width, y: y + height },
      { id: 's', x: midX, y: y + height },
      { id: 'sw', x, y: y + height },
      { id: 'w', x, y: midY },
    ];
  }

  public static getCursorForHandle(handle: HandleId): string {
    switch (handle) {
      case 'nw':
      case 'se':
        return 'nwse-resize';
      case 'ne':
      case 'sw':
        return 'nesw-resize';
      case 'n':
      case 's':
        return 'ns-resize';
      case 'e':
      case 'w':
        return 'ew-resize';
      default:
        return 'default';
    }
  }

  public static testHit(
    pointer: { x: number; y: number },
    bounds: { x: number; y: number; width: number; height: number } | null,
    pivot: { x: number; y: number } | null,
    containsPixelFn: (x: number, y: number) => boolean,
    zoom: number = 1,
    options: HitTesterOptions = {}
  ): HitTarget {
    if (!bounds || zoom <= 0 || !Number.isFinite(pointer.x) || !Number.isFinite(pointer.y)) {
      return { type: 'none' };
    }

    const handleRadius = (options.handleRadiusScreenPx ?? 8) / zoom;
    const pivotRadius = (options.pivotRadiusScreenPx ?? 8) / zoom;
    const borderTol = (options.borderToleranceScreenPx ?? 5) / zoom;

    // 1. Test Pivot Hit
    if (pivot && Number.isFinite(pivot.x) && Number.isFinite(pivot.y)) {
      const dx = pointer.x - pivot.x;
      const dy = pointer.y - pivot.y;
      if (Math.sqrt(dx * dx + dy * dy) <= pivotRadius) {
        return { type: 'pivot' };
      }
    }

    // 2. Test Handles Hit
    const handles = this.getHandlePositions(bounds);
    for (const h of handles) {
      const dx = pointer.x - h.x;
      const dy = pointer.y - h.y;
      if (Math.sqrt(dx * dx + dy * dy) <= handleRadius) {
        return { type: 'handle', handle: h.id };
      }
    }

    // 3. Test Border Hit
    const { x, y, width, height } = bounds;
    const inOuter =
      pointer.x >= x - borderTol &&
      pointer.x <= x + width + borderTol &&
      pointer.y >= y - borderTol &&
      pointer.y <= y + height + borderTol;

    const inInner =
      pointer.x >= x + borderTol &&
      pointer.x <= x + width - borderTol &&
      pointer.y >= y + borderTol &&
      pointer.y <= y + height - borderTol;

    if (inOuter && !inInner) {
      return { type: 'border' };
    }

    // 4. Test Inside Selection Hit
    const px = Math.floor(pointer.x);
    const py = Math.floor(pointer.y);
    if (containsPixelFn(px, py)) {
      return { type: 'inside' };
    }

    return { type: 'none' };
  }
}
