import { ISelectionEngine } from './SelectionEngine';
import { SelectionInteractionController } from './SelectionInteractionController';
import { HitTarget, SelectionHitTester } from './SelectionHitTester';
import { ISelectionMask } from './SelectionMask';

export interface MovePointerEvent {
  x: number;
  y: number;
}

export class MoveSelectionTool {
  private selectionEngine: ISelectionEngine;
  private interactionController: SelectionInteractionController;
  private initialMask: ISelectionMask | null = null;
  private initialPivot: { x: number; y: number } | null = null;
  private active: boolean = false;

  constructor(
    selectionEngine: ISelectionEngine,
    interactionController: SelectionInteractionController
  ) {
    this.selectionEngine = selectionEngine;
    this.interactionController = interactionController;
  }

  public isActive(): boolean {
    return this.active;
  }

  public startMove(pointer: MovePointerEvent, zoom: number = 1, target?: HitTarget): boolean {
    if (this.selectionEngine.mask.isEmpty()) {
      return false;
    }

    const bounds = this.selectionEngine.getBounds();
    if (!bounds) return false;

    const pivot = this.interactionController.getPivot() ?? {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    };

    const containsFn = (px: number, py: number) => this.selectionEngine.contains(px, py);
    const hit = target ?? SelectionHitTester.testHit(pointer, bounds, pivot, containsFn, zoom);

    const isInside = containsFn(pointer.x, pointer.y);
    if (!isInside && hit.type === 'none') {
      return false;
    }

    const moveHit: HitTarget = (hit.type === 'inside' || hit.type === 'border') ? hit : { type: 'inside' };

    this.initialMask = this.selectionEngine.mask.clone();
    this.initialPivot = { ...pivot };
    this.active = true;

    this.interactionController.startDrag(pointer, moveHit);
    return true;
  }

  public updateMove(pointer: MovePointerEvent): void {
    if (!this.active || !this.initialMask || !this.initialPivot) {
      return;
    }

    this.interactionController.updateDrag(pointer);
    const delta = this.interactionController.getDelta();

    // Zero-allocation restore and shift
    this.selectionEngine.mask.copyFrom(this.initialMask);
    this.selectionEngine.translate(delta.x, delta.y);

    this.interactionController.setPivot({
      x: this.initialPivot.x + delta.x,
      y: this.initialPivot.y + delta.y,
    });
  }

  public endMove(): { delta: { x: number; y: number }; moved: boolean } {
    if (!this.active) {
      return { delta: { x: 0, y: 0 }, moved: false };
    }

    const res = this.interactionController.endDrag();
    this.active = false;
    this.initialMask = null;
    this.initialPivot = null;

    const moved = res.delta.x !== 0 || res.delta.y !== 0;
    return {
      delta: res.delta,
      moved,
    };
  }

  public cancelMove(): void {
    if (!this.active) return;
    if (this.initialMask) {
      this.selectionEngine.mask.copyFrom(this.initialMask);
    }
    this.interactionController.reset();
    this.active = false;
    this.initialMask = null;
    this.initialPivot = null;
  }
}
