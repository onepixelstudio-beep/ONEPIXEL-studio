import { HandleId, HitTarget, SelectionHitTester } from './SelectionHitTester';
import { CursorManager } from './CursorManager';

export type InteractionState =
  | 'idle'
  | 'creating'
  | 'moving'
  | 'transform_ready'
  | 'dragging_handle'
  | 'dragging_pivot';

export interface InteractionPoint {
  x: number;
  y: number;
}

export type InteractionListener = (controller: SelectionInteractionController) => void;

export class SelectionInteractionController {
  private state: InteractionState = 'idle';
  private hoverTarget: HitTarget = { type: 'none' };
  private activeHandle: HandleId | null = null;
  private pivot: InteractionPoint | null = null;
  private dragStart: InteractionPoint | null = null;
  private dragCurrent: InteractionPoint | null = null;
  private listeners: Set<InteractionListener> = new Set();
  private cursorManager: CursorManager = CursorManager.getInstance();

  public subscribe(listener: InteractionListener): () => void {
    if (typeof listener === 'function') {
      this.listeners.add(listener);
    }
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => {
      try {
        fn(this);
      } catch (err) {
        // Degrade gracefully
      }
    });
  }

  public getState(): InteractionState {
    return this.state;
  }

  public getHoverTarget(): HitTarget {
    return this.hoverTarget;
  }

  public getActiveHandle(): HandleId | null {
    return this.activeHandle;
  }

  public getPivot(): InteractionPoint | null {
    return this.pivot;
  }

  public getDragStart(): InteractionPoint | null {
    return this.dragStart;
  }

  public getDragCurrent(): InteractionPoint | null {
    return this.dragCurrent;
  }

  public getDelta(): InteractionPoint {
    if (!this.dragStart || !this.dragCurrent) {
      return { x: 0, y: 0 };
    }
    return {
      x: this.dragCurrent.x - this.dragStart.x,
      y: this.dragCurrent.y - this.dragStart.y,
    };
  }

  public setPivot(pivot: InteractionPoint | null): void {
    if (pivot && (!Number.isFinite(pivot.x) || !Number.isFinite(pivot.y))) {
      return;
    }
    this.pivot = pivot ? { x: pivot.x, y: pivot.y } : null;
    this.notify();
  }

  public resetPivot(bounds: { x: number; y: number; width: number; height: number } | null): void {
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
      this.pivot = null;
    } else {
      this.pivot = {
        x: bounds.x + bounds.width / 2,
        y: bounds.y + bounds.height / 2,
      };
    }
    this.notify();
  }

  public updateHover(target: HitTarget): void {
    if (this.state !== 'idle' && this.state !== 'transform_ready') {
      return;
    }

    this.hoverTarget = target;
    this.updateCursorForTarget(target);
    this.notify();
  }

  public startDrag(pointer: InteractionPoint, target?: HitTarget): void {
    if (!Number.isFinite(pointer.x) || !Number.isFinite(pointer.y)) return;

    const hit = target ?? this.hoverTarget;
    this.dragStart = { x: pointer.x, y: pointer.y };
    this.dragCurrent = { x: pointer.x, y: pointer.y };

    switch (hit.type) {
      case 'handle':
        this.state = 'dragging_handle';
        this.activeHandle = hit.handle;
        this.cursorManager.setCursor(SelectionHitTester.getCursorForHandle(hit.handle));
        break;
      case 'pivot':
        this.state = 'dragging_pivot';
        this.cursorManager.setCursor('move');
        break;
      case 'inside':
      case 'border':
        this.state = 'moving';
        this.cursorManager.setCursor('move');
        break;
      case 'none':
      default:
        this.state = 'creating';
        this.cursorManager.setCursor('crosshair');
        break;
    }

    this.notify();
  }

  public updateDrag(pointer: InteractionPoint): void {
    if (!this.dragStart || (this.state === 'idle' || this.state === 'transform_ready')) {
      return;
    }
    if (!Number.isFinite(pointer.x) || !Number.isFinite(pointer.y)) return;

    this.dragCurrent = { x: pointer.x, y: pointer.y };

    if (this.state === 'dragging_pivot') {
      this.pivot = { x: pointer.x, y: pointer.y };
    }

    this.notify();
  }

  public endDrag(): { state: InteractionState; delta: InteractionPoint; handle: HandleId | null } {
    const previousState = this.state;
    const delta = this.getDelta();
    const handle = this.activeHandle;

    this.state = 'idle';
    this.activeHandle = null;
    this.dragStart = null;
    this.dragCurrent = null;
    this.updateCursorForTarget(this.hoverTarget);

    this.notify();

    return {
      state: previousState,
      delta,
      handle,
    };
  }

  public reset(): void {
    this.state = 'idle';
    this.hoverTarget = { type: 'none' };
    this.activeHandle = null;
    this.dragStart = null;
    this.dragCurrent = null;
    this.cursorManager.reset();
    this.notify();
  }

  private updateCursorForTarget(target: HitTarget): void {
    switch (target.type) {
      case 'handle':
        this.cursorManager.setCursor(SelectionHitTester.getCursorForHandle(target.handle));
        break;
      case 'pivot':
        this.cursorManager.setCursor('move');
        break;
      case 'inside':
      case 'border':
        this.cursorManager.setCursor('move');
        break;
      case 'none':
      default:
        // Do not force default if another tool controls crosshair, but default to current
        break;
    }
  }
}
