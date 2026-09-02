import { Point2D, Rect2D } from './TransformTypes';

export type PivotPreset =
  | 'center'
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'custom';

export type PivotChangeListener = (pivot: Point2D, preset: PivotPreset) => void;

/**
 * Pivot Manager for calculating and managing transformation anchor points.
 * Emits events to listeners on pivot changes without mutating pixel data.
 */
export class PivotManager {
  private currentPivot: Point2D = { x: 0, y: 0 };
  private activePreset: PivotPreset = 'center';
  private bounds: Rect2D = { x: 0, y: 0, width: 0, height: 0 };
  private listeners: Set<PivotChangeListener> = new Set();

  constructor(bounds?: Rect2D) {
    if (bounds) {
      this.setBounds(bounds);
    }
  }

  /** Updates the target bounds and recalculates pivot position if following a preset */
  public setBounds(bounds: Rect2D): void {
    this.bounds = { ...bounds };
    if (this.activePreset !== 'custom') {
      this.applyPreset(this.activePreset);
    }
  }

  /** Gets current target bounds */
  public getBounds(): Rect2D {
    return { ...this.bounds };
  }

  /** Gets the current pivot point */
  public getPivot(): Point2D {
    return { ...this.currentPivot };
  }

  /** Gets active preset name */
  public getPreset(): PivotPreset {
    return this.activePreset;
  }

  /** Sets a custom pivot position */
  public setPivot(x: number, y: number): void {
    this.currentPivot.x = x;
    this.currentPivot.y = y;
    this.activePreset = 'custom';
    this.notify();
  }

  /** Applies a predefined pivot anchor preset */
  public applyPreset(preset: PivotPreset): void {
    if (preset === 'custom') return;

    this.activePreset = preset;
    const { x, y, width, height } = this.bounds;

    switch (preset) {
      case 'center':
        this.currentPivot.x = x + width / 2;
        this.currentPivot.y = y + height / 2;
        break;
      case 'top-left':
        this.currentPivot.x = x;
        this.currentPivot.y = y;
        break;
      case 'top-center':
        this.currentPivot.x = x + width / 2;
        this.currentPivot.y = y;
        break;
      case 'top-right':
        this.currentPivot.x = x + width;
        this.currentPivot.y = y;
        break;
      case 'middle-left':
        this.currentPivot.x = x;
        this.currentPivot.y = y + height / 2;
        break;
      case 'middle-right':
        this.currentPivot.x = x + width;
        this.currentPivot.y = y + height / 2;
        break;
      case 'bottom-left':
        this.currentPivot.x = x;
        this.currentPivot.y = y + height;
        break;
      case 'bottom-center':
        this.currentPivot.x = x + width / 2;
        this.currentPivot.y = y + height;
        break;
      case 'bottom-right':
        this.currentPivot.x = x + width;
        this.currentPivot.y = y + height;
        break;
    }

    this.notify();
  }

  /** Subscribes to pivot updates */
  public subscribe(listener: PivotChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const pivotCopy = { ...this.currentPivot };
    const preset = this.activePreset;
    this.listeners.forEach((listener) => listener(pivotCopy, preset));
  }
}
