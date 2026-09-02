import { Point2D, Rect2D, TransformMatrix2D } from './TransformTypes';
import { TransformMatrix } from './TransformMatrix';

export type HandleType =
  | 'nw'
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w'
  | 'rotation'
  | 'center';

export interface BoundingBoxHandle {
  type: HandleType;
  position: Point2D;
}

/**
 * Decoupled Bounding Box Manager for calculating control handles, center,
 * and transformed geometry.
 */
export class TransformBoundingBox {
  private bounds: Rect2D = { x: 0, y: 0, width: 0, height: 0 };
  private matrix: TransformMatrix2D = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
  private handles: Map<HandleType, Point2D> = new Map();

  constructor(bounds?: Rect2D, matrix?: TransformMatrix2D) {
    if (bounds) this.bounds = { ...bounds };
    if (matrix) this.matrix = { ...matrix };
    this.updateHandles();
  }

  public setBounds(bounds: Rect2D): void {
    this.bounds = { ...bounds };
    this.updateHandles();
  }

  public setMatrix(matrix: TransformMatrix2D): void {
    this.matrix = { ...matrix };
    this.updateHandles();
  }

  public getOriginalBounds(): Rect2D {
    return { ...this.bounds };
  }

  public getTransformedBounds(out?: Rect2D): Rect2D {
    return TransformMatrix.transformBounds(this.matrix, this.bounds, out);
  }

  public getCenter(): Point2D {
    const rawCenter = {
      x: this.bounds.x + this.bounds.width / 2,
      y: this.bounds.y + this.bounds.height / 2,
    };
    return TransformMatrix.transformPoint(this.matrix, rawCenter);
  }

  public getHandle(type: HandleType): Point2D | undefined {
    return this.handles.get(type);
  }

  public getAllHandles(): BoundingBoxHandle[] {
    const list: BoundingBoxHandle[] = [];
    this.handles.forEach((position, type) => {
      list.push({ type, position: { ...position } });
    });
    return list;
  }

  private updateHandles(): void {
    const { x, y, width, height } = this.bounds;
    const m = this.matrix;

    const corners: { type: HandleType; raw: Point2D }[] = [
      { type: 'nw', raw: { x, y } },
      { type: 'n', raw: { x: x + width / 2, y } },
      { type: 'ne', raw: { x: x + width, y } },
      { type: 'e', raw: { x: x + width, y: y + height / 2 } },
      { type: 'se', raw: { x: x + width, y: y + height } },
      { type: 's', raw: { x: x + width / 2, y: y + height } },
      { type: 'sw', raw: { x, y: y + height } },
      { type: 'w', raw: { x, y: y + height / 2 } },
      { type: 'center', raw: { x: x + width / 2, y: y + height / 2 } },
      { type: 'rotation', raw: { x: x + width / 2, y: y - 20 } },
    ];

    corners.forEach((item) => {
      const pos = TransformMatrix.transformPoint(m, item.raw);
      this.handles.set(item.type, pos);
    });
  }
}
