import { TransformMatrix2D, Point2D, Rect2D } from './TransformTypes';

/**
 * Mathematical 2D Affine Matrix Module for 3x3 Transformations.
 * Matrix layout:
 * [ a  c  tx ]
 * [ b  d  ty ]
 * [ 0  0  1  ]
 *
 * Designed with zero-allocation helper modes for high-speed drag operations.
 */
export class TransformMatrix {
  /** Creates or resets a matrix to Identity */
  public static identity(out?: TransformMatrix2D): TransformMatrix2D {
    const target = out ?? { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
    target.a = 1;
    target.b = 0;
    target.c = 0;
    target.d = 1;
    target.tx = 0;
    target.ty = 0;
    return target;
  }

  /** Copies values from src to dst */
  public static copy(src: TransformMatrix2D, dst?: TransformMatrix2D): TransformMatrix2D {
    const target = dst ?? { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
    target.a = src.a;
    target.b = src.b;
    target.c = src.c;
    target.d = src.d;
    target.tx = src.tx;
    target.ty = src.ty;
    return target;
  }

  /** Checks if matrix is Identity */
  public static isIdentity(m: TransformMatrix2D, eps: number = 1e-6): boolean {
    return (
      Math.abs(m.a - 1) < eps &&
      Math.abs(m.b) < eps &&
      Math.abs(m.c) < eps &&
      Math.abs(m.d - 1) < eps &&
      Math.abs(m.tx) < eps &&
      Math.abs(m.ty) < eps
    );
  }

  /** Multiplies m1 * m2 and stores result in out */
  public static multiply(
    m1: TransformMatrix2D,
    m2: TransformMatrix2D,
    out?: TransformMatrix2D
  ): TransformMatrix2D {
    const a = m1.a * m2.a + m1.c * m2.b;
    const b = m1.b * m2.a + m1.d * m2.b;
    const c = m1.a * m2.c + m1.c * m2.d;
    const d = m1.b * m2.c + m1.d * m2.d;
    const tx = m1.a * m2.tx + m1.c * m2.ty + m1.tx;
    const ty = m1.b * m2.tx + m1.d * m2.ty + m1.ty;

    const res = out ?? { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
    res.a = a;
    res.b = b;
    res.c = c;
    res.d = d;
    res.tx = tx;
    res.ty = ty;
    return res;
  }

  /** Calculates matrix inverse m^-1. Returns identity if determinant is 0 */
  public static invert(m: TransformMatrix2D, out?: TransformMatrix2D): TransformMatrix2D {
    const det = m.a * m.d - m.b * m.c;
    const res = out ?? { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };

    if (Math.abs(det) < 1e-12) {
      return TransformMatrix.identity(res);
    }

    const invDet = 1.0 / det;

    const a = m.d * invDet;
    const b = -m.b * invDet;
    const c = -m.c * invDet;
    const d = m.a * invDet;
    const tx = (m.c * m.ty - m.d * m.tx) * invDet;
    const ty = (m.b * m.tx - m.a * m.ty) * invDet;

    res.a = a;
    res.b = b;
    res.c = c;
    res.d = d;
    res.tx = tx;
    res.ty = ty;
    return res;
  }

  /** Creates translation matrix */
  public static createTranslate(dx: number, dy: number, out?: TransformMatrix2D): TransformMatrix2D {
    const res = out ?? { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
    res.a = 1;
    res.b = 0;
    res.c = 0;
    res.d = 1;
    res.tx = dx;
    res.ty = dy;
    return res;
  }

  /** Creates scale matrix around optional pivot */
  public static createScale(
    sx: number,
    sy: number,
    pivot?: Point2D,
    out?: TransformMatrix2D
  ): TransformMatrix2D {
    const res = out ?? { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
    const px = pivot ? pivot.x : 0;
    const py = pivot ? pivot.y : 0;

    res.a = sx;
    res.b = 0;
    res.c = 0;
    res.d = sy;
    res.tx = px - sx * px;
    res.ty = py - sy * py;
    return res;
  }

  /** Creates rotation matrix (in radians) around optional pivot */
  public static createRotate(
    radians: number,
    pivot?: Point2D,
    out?: TransformMatrix2D
  ): TransformMatrix2D {
    const res = out ?? { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const px = pivot ? pivot.x : 0;
    const py = pivot ? pivot.y : 0;

    res.a = cos;
    res.b = sin;
    res.c = -sin;
    res.d = cos;
    res.tx = px - cos * px + sin * py;
    res.ty = py - sin * px - cos * py;
    return res;
  }

  /** Creates horizontal / vertical flip matrix around pivot */
  public static createFlip(
    horizontal: boolean,
    vertical: boolean,
    pivot?: Point2D,
    out?: TransformMatrix2D
  ): TransformMatrix2D {
    const sx = horizontal ? -1 : 1;
    const sy = vertical ? -1 : 1;
    return TransformMatrix.createScale(sx, sy, pivot, out);
  }

  /** Creates shear / skew matrix (angles in radians) around pivot */
  public static createShear(
    kx: number,
    ky: number,
    pivot?: Point2D,
    out?: TransformMatrix2D
  ): TransformMatrix2D {
    const res = out ?? { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
    const tanX = Math.tan(kx);
    const tanY = Math.tan(ky);
    const px = pivot ? pivot.x : 0;
    const py = pivot ? pivot.y : 0;

    res.a = 1;
    res.b = tanY;
    res.c = tanX;
    res.d = 1;
    res.tx = -tanX * py;
    res.ty = -tanY * px;
    return res;
  }

  /** Transforms a 2D point (x, y) */
  public static transformPoint(
    m: TransformMatrix2D,
    p: Point2D,
    out?: Point2D
  ): Point2D {
    const res = out ?? { x: 0, y: 0 };
    const x = p.x;
    const y = p.y;
    res.x = m.a * x + m.c * y + m.tx;
    res.y = m.b * x + m.d * y + m.ty;
    return res;
  }

  /** Computes the axis-aligned bounding box of a transformed rectangle */
  public static transformBounds(
    m: TransformMatrix2D,
    rect: Rect2D,
    out?: Rect2D
  ): Rect2D {
    const res = out ?? { x: 0, y: 0, width: 0, height: 0 };

    const x0 = rect.x;
    const y0 = rect.y;
    const x1 = rect.x + rect.width;
    const y1 = rect.y + rect.height;

    // Corner points
    const p1x = m.a * x0 + m.c * y0 + m.tx;
    const p1y = m.b * x0 + m.d * y0 + m.ty;

    const p2x = m.a * x1 + m.c * y0 + m.tx;
    const p2y = m.b * x1 + m.d * y0 + m.ty;

    const p3x = m.a * x1 + m.c * y1 + m.tx;
    const p3y = m.b * x1 + m.d * y1 + m.ty;

    const p4x = m.a * x0 + m.c * y1 + m.tx;
    const p4y = m.b * x0 + m.d * y1 + m.ty;

    const minX = Math.min(p1x, p2x, p3x, p4x);
    const maxX = Math.max(p1x, p2x, p3x, p4x);
    const minY = Math.min(p1y, p2y, p3y, p4y);
    const maxY = Math.max(p1y, p2y, p3y, p4y);

    res.x = minX;
    res.y = minY;
    res.width = maxX - minX;
    res.height = maxY - minY;

    return res;
  }
}
