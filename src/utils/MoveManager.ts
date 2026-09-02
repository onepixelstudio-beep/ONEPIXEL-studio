import { ProjectPixels } from '../types';

export interface MoveManagerConfig {
  width: number;
  height: number;
  currentFrameId: string;
  currentLayerId: string;
  pixels: ProjectPixels;
  selection: { active: boolean; pixels: boolean[] };
  onUpdatePixels: (updated: ProjectPixels, saveToHistory: boolean) => void;
  onStartHistoryAction?: () => void;
  setSelection: (selection: { active: boolean; pixels: boolean[] }) => void;
}

export class MoveManager {
  private width: number;
  private height: number;
  private currentFrameId: string;
  private currentLayerId: string;
  private pixels: ProjectPixels;
  private selection: { active: boolean; pixels: boolean[] };
  private onUpdatePixels: (updated: ProjectPixels, saveToHistory: boolean) => void;
  private onStartHistoryAction?: () => void;
  private setSelection: (selection: { active: boolean; pixels: boolean[] }) => void;

  // Temporary buffers
  private moveActive: boolean = false;
  private movePixels: string[] = []; // Temporary buffer of original layer pixels
  private moveMask: boolean[] = [];   // Temporary buffer of selection mask
  private moveOffsetX: number = 0;
  private moveOffsetY: number = 0;

  constructor(config: MoveManagerConfig) {
    this.width = config.width;
    this.height = config.height;
    this.currentFrameId = config.currentFrameId;
    this.currentLayerId = config.currentLayerId;
    this.pixels = config.pixels;
    this.selection = config.selection;
    this.onUpdatePixels = config.onUpdatePixels;
    this.onStartHistoryAction = config.onStartHistoryAction;
    this.setSelection = config.setSelection;
  }

  /**
   * Verify if there is an active selection that can be moved
   */
  public hasActiveSelection(): boolean {
    return this.selection.active && this.selection.pixels.some(p => p);
  }

  /**
   * Start movement of the active selection.
   * Copies the contents within the selection mask to a temporary buffer,
   * clears the pixels in their original positions, and updates the canvas.
   */
  public start(initialDx = 0, initialDy = 0): {
    moveActive: boolean;
    movePixels: string[];
    moveMask: boolean[];
    moveOffsetX: number;
    moveOffsetY: number;
  } | null {
    if (!this.hasActiveSelection()) return null;

    const framePixels = this.pixels[this.currentFrameId];
    const layerPixels = framePixels?.[this.currentLayerId];
    if (!layerPixels) return null;

    // Save history snapshot of original state before we clear selected pixels
    this.onStartHistoryAction?.();

    // Copy original pixels and mask to buffer
    this.movePixels = [...layerPixels];
    this.moveMask = [...this.selection.pixels];
    this.moveOffsetX = initialDx;
    this.moveOffsetY = initialDy;
    this.moveActive = true;

    // Clear original selected pixels in the current layer
    const updated = { ...this.pixels };
    const nextPixels = [...layerPixels];
    for (let i = 0; i < nextPixels.length; i++) {
      if (this.moveMask[i]) {
        nextPixels[i] = '';
      }
    }
    updated[this.currentFrameId] = { ...updated[this.currentFrameId] };
    updated[this.currentFrameId][this.currentLayerId] = nextPixels;
    
    // Update active pixels in real-time without committing to history yet
    this.onUpdatePixels(updated, false);

    return {
      moveActive: this.moveActive,
      movePixels: this.movePixels,
      moveMask: this.moveMask,
      moveOffsetX: this.moveOffsetX,
      moveOffsetY: this.moveOffsetY,
    };
  }

  /**
   * Calculate updated offsets when dragging the selection
   */
  public drag(
    deltaX: number,
    deltaY: number,
    zoom: number,
    startOffset: { x: number; y: number }
  ): {
    offsetX: number;
    offsetY: number;
  } {
    const dx = Math.round(deltaX / zoom);
    const dy = Math.round(deltaY / zoom);
    this.moveOffsetX = startOffset.x + dx;
    this.moveOffsetY = startOffset.y + dy;
    return {
      offsetX: this.moveOffsetX,
      offsetY: this.moveOffsetY
    };
  }

  /**
   * Confirm the movement (bake/stamp the moved selection onto the active layer).
   * Commits the changes to history and updates the selection mask to the new coordinates.
   */
  public confirm(offsetX: number, offsetY: number): {
    success: boolean;
    nextSelection: { active: boolean; pixels: boolean[] };
  } {
    if (!this.moveActive) return { success: false, nextSelection: this.selection };

    const framePixels = this.pixels[this.currentFrameId];
    const layerPixels = framePixels?.[this.currentLayerId];
    if (!layerPixels) return { success: false, nextSelection: this.selection };

    const updated = { ...this.pixels };
    const nextPixels = [...layerPixels];
    const nextSelectionPixels = new Array(this.width * this.height).fill(false);

    // Render the moved pixels in their new position
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = y * this.width + x;
        if (this.moveMask[idx]) {
          const nx = x + offsetX;
          const ny = y + offsetY;
          if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
            const targetIdx = ny * this.width + nx;
            nextSelectionPixels[targetIdx] = true;
            
            const color = this.movePixels[idx];
            if (color) {
              nextPixels[targetIdx] = color;
            }
          }
        }
      }
    }

    updated[this.currentFrameId] = { ...updated[this.currentFrameId] };
    updated[this.currentFrameId][this.currentLayerId] = nextPixels;
    
    // Commit the final state to active state, no need to save snapshot here since we saved it at start!
    this.onUpdatePixels(updated, false);

    // Update the selection state in the parent selection manager
    const nextSelection = { active: true, pixels: nextSelectionPixels };
    this.setSelection(nextSelection);
    
    this.moveActive = false;
    return { success: true, nextSelection };
  }

  /**
   * Cancel the movement and restore the layer pixels back to their original state.
   */
  public cancel(): boolean {
    if (!this.moveActive) return false;

    const updated = { ...this.pixels };
    updated[this.currentFrameId] = { ...updated[this.currentFrameId] };
    updated[this.currentFrameId][this.currentLayerId] = [...this.movePixels];
    
    // Restore pixels without registering a new history action
    this.onUpdatePixels(updated, false);
    this.moveActive = false;
    return true;
  }
}
