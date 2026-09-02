import { ITransformEngine } from './ITransformEngine';
import {
  TransformSessionState,
  TransformTarget,
  TransformSessionOptions,
  TransformResult,
  Point2D,
  InterpolationMode,
  TransformMatrix2D,
} from './TransformTypes';
import { TransformSession } from './TransformSession';
import { SamplingEngine } from './SamplingEngine';
import { ISelectionEngine } from '../selection/SelectionEngine';

/**
 * Single entry point and facade for all 2D transformations in OnePixel Studio.
 * Completely decoupled from React, CanvasArea, and UI components.
 * Consumes SelectionEngine exclusively via public contracts.
 */
export class TransformEngine implements ITransformEngine {
  private activeSession: TransformSession | null = null;
  private selectionEngine: ISelectionEngine | null = null;
  private samplingEngine: SamplingEngine;

  constructor(selectionEngine?: ISelectionEngine) {
    this.selectionEngine = selectionEngine ?? null;
    this.samplingEngine = new SamplingEngine();
  }

  /** Sets the public selection engine instance */
  public setSelectionEngine(selectionEngine: ISelectionEngine): void {
    this.selectionEngine = selectionEngine;
  }

  public isSessionActive(): boolean {
    return this.activeSession !== null;
  }

  public getActiveSession(): TransformSessionState | null {
    return this.activeSession ? this.activeSession.getState() : null;
  }

  public startSession(
    target: TransformTarget,
    options?: TransformSessionOptions
  ): TransformSessionState {
    if (this.activeSession) {
      this.cancelSession();
    }

    // If transforming an active selection and target lacks explicit ImageData,
    // ensure target bounds align with SelectionEngine's public getBounds()
    if (target.type === 'selection' && this.selectionEngine) {
      const selectionBounds = this.selectionEngine.getBounds();
      if (selectionBounds) {
        target.bounds = { ...selectionBounds };
      }
    }

    this.activeSession = new TransformSession(target, options, this.samplingEngine);
    return this.activeSession.getState();
  }

  public translate(dx: number, dy: number): void {
    if (!this.activeSession) return;
    this.activeSession.translate(dx, dy);
  }

  public scale(sx: number, sy: number, pivot?: Point2D): void {
    if (!this.activeSession) return;
    this.activeSession.scale(sx, sy, pivot);
  }

  public rotate(radians: number, pivot?: Point2D): void {
    if (!this.activeSession) return;
    this.activeSession.rotate(radians, pivot);
  }

  public flip(horizontal: boolean, vertical: boolean): void {
    if (!this.activeSession) return;
    this.activeSession.flip(horizontal, vertical);
  }

  public applyMatrix(matrix: TransformMatrix2D): void {
    if (!this.activeSession) return;
    this.activeSession.updateMatrix(matrix);
  }

  public setPivot(pivot: Point2D): void {
    if (!this.activeSession) return;
    this.activeSession.setPivot(pivot);
  }

  public setInterpolation(mode: InterpolationMode): void {
    if (!this.activeSession) return;
    this.activeSession.setInterpolation(mode);
  }

  public renderPreview(ctx: CanvasRenderingContext2D): void {
    if (!this.activeSession) return;
    this.activeSession.renderPreview(ctx);
  }

  public commitSession(): TransformResult | null {
    if (!this.activeSession) return null;

    const stateBeforeCommit = this.activeSession.getState();
    const result = this.activeSession.commit();

    // If active selection was translated, sync SelectionEngine via public contract
    if (
      result &&
      stateBeforeCommit.target.type === 'selection' &&
      this.selectionEngine
    ) {
      const dx = result.bounds.x - stateBeforeCommit.originalBounds.x;
      const dy = result.bounds.y - stateBeforeCommit.originalBounds.y;
      if (dx !== 0 || dy !== 0) {
        this.selectionEngine.translate(dx, dy);
      }
    }

    this.activeSession = null;
    return result;
  }

  public cancelSession(): void {
    if (!this.activeSession) return;
    this.activeSession.cancel();
    this.activeSession = null;
  }
}
