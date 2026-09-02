/**
 * OnePixel Studio - Official Public Subsystem APIs (v1)
 * This file defines and exports the public API interfaces and versions for the seven main subsystems.
 * All modules must interact with these subsystems strictly through these interfaces.
 */

import { 
  Layer, Frame, Guide, OnionSkinSettings, PlaybackState, 
  PixelProject, SelectionState, EditorSettings, AnimationTag 
} from '../types';

// ============================================================================
// VERSIONING
// ============================================================================
export const PUBLIC_API_VERSIONS = {
  Canvas: '1.0.0',
  Layers: '1.0.0',
  History: '1.0.0',
  Timeline: '1.0.0',
  Animation: '1.0.0',
  Selection: '1.0.0',
  Transform: '1.0.0',
  Export: '1.0.0'
} as const;

// ============================================================================
// 1. CANVAS SUBSYSTEM API (v1)
// ============================================================================
export interface CanvasSubsystemAPI {
  version: '1.0.0';
  
  /** Translates screen coordinates to canvas grid space. */
  getFractionalCoords(clientX: number, clientY: number, containerRect: DOMRect, zoom: number, pan: { x: number; y: number }): { x: number; y: number } | null;
  
  /** Resolves grid coordinate snapping against active horizontal/vertical rulers or symmetry axes. */
  getSnappedCoords(x: number, y: number, guides: Guide[], snapRange: number, enableSnapping: boolean): { x: number; y: number; snappedX: boolean; snappedY: boolean };
  
  /** Retrieves the CSS cursor class name based on tool and active transform handles. */
  getCursorStyle(transformActive: boolean, activeHandle: string | null, hoveredHandle: string | null): string;
  
  /** Computes the array of coordinate offsets representing the active brush shape and size. */
  getBrushOffsets(brushSize: number, activeBrush: { size: number; pixels: boolean[][] } | null): { dx: number; dy: number }[];
}

// ============================================================================
// 2. LAYERS SUBSYSTEM API (v1)
// ============================================================================
export interface LayersSubsystemAPI {
  version: '1.0.0';
  
  /** Adds a new transparent layer above the current active layer. */
  addLayer(project: PixelProject, name?: string): PixelProject;
  
  /** Deletes the specified layer, merging down if needed or preventing deletion of the last layer. */
  deleteLayer(project: PixelProject, layerId: string): PixelProject;
  
  /** Configures a layer's properties (opacity, visibility, blend mode, locked state). */
  updateLayerProperties(project: PixelProject, layerId: string, updates: Partial<Omit<Layer, 'id'>>): PixelProject;
  
  /** Reorders the layers in the project hierarchy. */
  reorderLayers(project: PixelProject, fromIndex: number, toIndex: number): PixelProject;
}

// ============================================================================
// 3. HISTORY SUBSYSTEM API (v1)
// ============================================================================
export interface HistorySubsystemAPI {
  version: '1.0.0';
  
  /** Commits a snapshot state to the undo history stack using optimized Structural Sharing. */
  saveSnapshot(pixelsState: any, customGuides?: Guide[]): void;
  
  /** Performs an Undo operation, recovering the previous state and storing the current one on the Redo stack. */
  undo(): void;
  
  /** Performs a Redo operation, advancing to the next state from the Redo stack. */
  redo(): void;
  
  /** Clears the Undo and Redo stacks. */
  clearHistory(): void;
}

// ============================================================================
// 4. TIMELINE SUBSYSTEM API (v1)
// ============================================================================
export interface TimelineSubsystemAPI {
  version: '1.0.0';
  
  /** Appends a new frame to the animation sequence. */
  addFrame(project: PixelProject, name?: string): PixelProject;
  
  /** Removes the specified frame from the sequence. */
  deleteFrame(project: PixelProject, frameId: string): PixelProject;
  
  /** Clones/Duplicates the specified frame and its layer contents. */
  duplicateFrame(project: PixelProject, frameId: string): PixelProject;
  
  /** Reorders a frame inside the timeline sequence. */
  reorderFrame(project: PixelProject, fromIndex: number, toIndex: number): PixelProject;
  
  /** Configures frame properties (like duration in milliseconds). */
  updateFrameProperties(project: PixelProject, frameId: string, updates: Partial<Omit<Frame, 'id'>>): PixelProject;
}

// ============================================================================
// 5. ANIMATION SUBSYSTEM API (v1)
// ============================================================================
export interface AnimationSubsystemAPI {
  version: '1.0.0';
  
  /** Controls playback: starts, stops, or pauses the preview sequence. */
  setPlaybackState(state: PlaybackState): void;
  
  /** Updates FPS (Frames per second) settings on the project. */
  setFPS(project: PixelProject, fps: number): PixelProject;
  
  /** Toggles or configures Onion Skinning settings (opacities, ranges, tints). */
  updateOnionSkin(settings: Partial<OnionSkinSettings>): void;
}

// ============================================================================
// 6. SELECTION SUBSYSTEM API (v1)
// ============================================================================
export interface SelectionSubsystemAPI {
  version: '1.0.0';
  
  /** Calculates the rectangular bounding box for the active selection. */
  getSelectionBounds(pixels: boolean[], width: number, height: number): { minX: number; minY: number; maxX: number; maxY: number } | null;
  
  /** Generates a boolean mask representing contiguous colored pixels starting from a root coordinate. */
  getMagicWandSelection(pixels: string[], startX: number, startY: number, width: number, height: number, tolerance: number, contiguous: boolean): boolean[];
  
  /** Clears the active selection, releasing the boundary mask. */
  clearSelection(): SelectionState;
}

// ============================================================================
// 6.5. TRANSFORM SUBSYSTEM API (v1)
// ============================================================================
export interface TransformSubsystemAPI {
  version: '1.0.0';

  /** Checks if a transformation session is active. */
  isSessionActive(): boolean;

  /** Initiates a transformation session on target pixels. */
  startTransformSession(targetId: string, type: 'selection' | 'layer' | 'frame'): void;

  /** Commits the current transformation session and returns transformed output. */
  commitTransformSession(): { targetId: string; modified: boolean } | null;

  /** Cancels the active transformation session without modifying target pixels. */
  cancelTransformSession(): void;
}

// ============================================================================
// 7. EXPORT SUBSYSTEM API (v1)
// ============================================================================
export interface ExportSubsystemAPI {
  version: '1.0.0';
  
  /** Assembles a grid of frame cells into a single Sprite Sheet image. */
  createSpriteSheet(project: PixelProject, columns: number, spacing: number, selectedLayers?: string[]): Promise<HTMLCanvasElement>;
  
  /** Encodes a project animation into a complete GIF byte array. */
  exportToGIF(project: PixelProject, loop: boolean): Promise<Uint8Array>;
  
  /** Encodes a project animation into an APNG byte array. */
  exportToAPNG(project: PixelProject, loopCount: number): Promise<Uint8Array>;
}
