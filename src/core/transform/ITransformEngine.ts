import {
  TransformSessionState,
  TransformTarget,
  TransformSessionOptions,
  TransformResult,
  Point2D,
  InterpolationMode,
  TransformMatrix2D
} from './TransformTypes';

export interface ITransformEngine {
  /** Checks if a transformation session is currently active */
  isSessionActive(): boolean;

  /** Gets the active session state or null if idle */
  getActiveSession(): TransformSessionState | null;

  /** Initializes a new non-destructive transformation session on a target */
  startSession(target: TransformTarget, options?: TransformSessionOptions): TransformSessionState;

  /** Applies relative translation to the active matrix */
  translate(dx: number, dy: number): void;

  /** Applies scale relative to pivot */
  scale(sx: number, sy: number, pivot?: Point2D): void;

  /** Applies rotation in radians relative to pivot */
  rotate(radians: number, pivot?: Point2D): void;

  /** Flips horizontally or vertically across target center */
  flip(horizontal: boolean, vertical: boolean): void;

  /** Applies custom affine matrix transformation */
  applyMatrix(matrix: TransformMatrix2D): void;

  /** Updates the transformation pivot position */
  setPivot(pivot: Point2D): void;

  /** Sets the interpolation algorithm (e.g. 'nearest' for pixel art) */
  setInterpolation(mode: InterpolationMode): void;

  /** Renders preview on an offscreen or provided CanvasRenderingContext2D without allocation */
  renderPreview(ctx: CanvasRenderingContext2D): void;

  /** Commits the transformation, rasterizing pixels and returning final result for History recording */
  commitSession(): TransformResult | null;

  /** Cancels active session and discards uncommitted changes */
  cancelSession(): void;
}
