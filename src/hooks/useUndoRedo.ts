import React, { useState, useEffect } from 'react';
import { PixelProject } from '../types';
import { timelineCommandHistory } from '../utils/animation/CommandSystem';
import { telemetry } from '../utils/telemetry';
import { PreferencesSystem } from '../utils/architecture/PreferencesSystem';

function estimateStateMemory(state: any): number {
  if (!state) return 0;
  
  // Exhaustive mode only if QA inspector flag is explicitly enabled
  const isExhaustiveQa = typeof window !== 'undefined' && (window as any).__ONEPIXEL_EXHAUSTIVE_QA__ === true;
  if (isExhaustiveQa) {
    let bytes = 0;
    if (typeof state === 'string') {
      bytes += state.length * 2;
    } else if (typeof state === 'object') {
      for (const frameId in state) {
        bytes += frameId.length * 2;
        const layers = state[frameId];
        if (layers && typeof layers === 'object') {
          for (const layerId in layers) {
            bytes += layerId.length * 2;
            const pxArray = layers[layerId];
            if (Array.isArray(pxArray)) {
              for (let i = 0; i < pxArray.length; i++) {
                const p = pxArray[i];
                if (typeof p === 'string') {
                  bytes += p.length * 2;
                } else if (p) {
                  bytes += 8;
                }
              }
            }
          }
        }
      }
    }
    return bytes;
  }

  // O(1) Analytical estimation based on project dimensions and layer counts
  if (typeof state === 'object') {
    const w = state.width || 64;
    const h = state.height || 64;
    const layerCount = Array.isArray(state.layers) ? state.layers.length : 1;
    const frameCount = Array.isArray(state.frames) ? state.frames.length : 1;
    // Each pixel is a color string or empty string (~8-16 bytes average in memory)
    return w * h * layerCount * frameCount * 12 + 1024;
  }
  return 4096;
}

function shareStructure(prev: any, current: any): any {
  if (prev === current) return prev;
  if (!prev || !current) return current;

  // Handle Arrays (e.g. layers, frames, guides, pixel arrays)
  if (Array.isArray(prev) && Array.isArray(current)) {
    if (prev.length !== current.length) {
      return current.map((item, idx) => shareStructure(prev[idx], item));
    }
    
    // For large pixel arrays (> 1000 items), avoid recursive element-by-element shareStructure
    // If the array reference is already identical, return immediately.
    // If the reference is different (a layer was painted), preserve the new array directly.
    if (current.length > 1000) {
      return current;
    }

    let changed = false;
    const result = [];
    for (let i = 0; i < current.length; i++) {
      const shared = shareStructure(prev[i], current[i]);
      result.push(shared);
      if (shared !== prev[i]) {
        changed = true;
      }
    }
    return changed ? result : prev;
  }

  // Handle Objects (e.g. pixels map, frame/layer metadata)
  if (typeof prev === 'object' && typeof current === 'object') {
    const prevKeys = Object.keys(prev);
    const currKeys = Object.keys(current);
    if (prevKeys.length !== currKeys.length) {
      const result: any = {};
      for (const k of currKeys) {
        result[k] = shareStructure(prev[k], current[k]);
      }
      return result;
    }

    let changed = false;
    const result: any = {};
    for (const k of currKeys) {
      if (!(k in prev)) {
        changed = true;
      }
      const shared = shareStructure(prev[k], current[k]);
      result[k] = shared;
      if (shared !== prev[k]) {
        changed = true;
      }
    }
    return changed ? result : prev;
  }

  // Primitives
  return current;
}

function fastDeepClone(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    const len = obj.length;
    const copy = new Array(len);
    for (let i = 0; i < len; i++) {
      const val = obj[i];
      copy[i] = (val && typeof val === 'object') ? fastDeepClone(val) : val;
    }
    return copy;
  }
  const copy: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = obj[key];
      copy[key] = (val && typeof val === 'object') ? fastDeepClone(val) : val;
    }
  }
  return copy;
}

export function useUndoRedo(
  project: PixelProject | null,
  setProject: React.Dispatch<React.SetStateAction<PixelProject | null>>
) {
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);

  const hasReactDispatcher = typeof window !== 'undefined' && (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?.ReactCurrentDispatcher?.current;
  if (hasReactDispatcher) {
    useEffect(() => {
      let totalBytes = 0;
      undoStack.forEach(state => {
        totalBytes += estimateStateMemory(state);
      });
      redoStack.forEach(state => {
        totalBytes += estimateStateMemory(state);
      });
      telemetry.updateHistoryMemory(totalBytes);
      telemetry.updateLastKnownState({
        undoStackSize: undoStack.length,
        redoStackSize: redoStack.length
      });
    }, [undoStack, redoStack]);
  }

  const projectRef = React.useRef(project);
  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  /**
   * ARCHITECTURAL NOTE: _guides non-enumerable property.
   * This design choice attaches the current guides state directly to the pixel state
   * using a non-enumerable descriptor. This decision was made during Hito v0.8 to:
   *   1. Maintain backward compatibility with the existing pixel history stack without refactoring the whole history engine.
   *   2. Ensure the guides state travels seamlessly across Undo/Redo operations alongside pixels.
   *   3. Avoid polluting the serialized state objects or breaking existing test suites.
   * 
   * CRITICAL GUIDELINE: Do not use or introduce any new hidden or non-enumerable properties on state objects
   * for other systems. This solution is a temporary measure and must be reviewed when the history engine
   * is refactored to support unified, structured snapshots of the entire editor state.
   */
  const saveSnapshotToHistory = React.useCallback((pixelsState: any, customGuides?: any[]) => {
    const currentProj = projectRef.current;
    if (!currentProj) return;
    
    const nextRawState = {
      pixels: pixelsState || currentProj.pixels,
      width: currentProj.width,
      height: currentProj.height,
      layers: currentProj.layers,
      frames: currentProj.frames,
      guides: customGuides !== undefined ? customGuides : (currentProj.guides || [])
    };

    setUndoStack(prev => {
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        const sharedState = shareStructure(last, nextRawState);
        
        // If sharedState is identical to last, avoid pushing duplicate history frames
        if (sharedState === last) {
          return prev;
        }

        const lastPixels = last && typeof last === 'object' && 'pixels' in last ? last.pixels : last;
        const currentPixels = sharedState.pixels;
        if (lastPixels === currentPixels) {
          if (last && typeof last === 'object' && 'pixels' in last && customGuides !== undefined) {
            last.guides = customGuides;
          }
          return prev;
        }

        const maxUndo = Math.max(10, Math.min(200, Number(PreferencesSystem.getInstance().get('performance.maxUndoLevels')) || 50));
        return [...prev.slice(-(maxUndo - 1)), sharedState];
      }

      const initialSnapshot = fastDeepClone(nextRawState);
      const maxUndo = Math.max(10, Math.min(200, Number(PreferencesSystem.getInstance().get('performance.maxUndoLevels')) || 50));
      return [...prev.slice(-(maxUndo - 1)), initialSnapshot];
    });
    setRedoStack([]);
  }, []);

  const handleUndo = React.useCallback(() => {
    if (undoStack.length > 0) {
      const previous = undoStack[undoStack.length - 1];
      const currentProj = projectRef.current;
      if (currentProj) {
        const currentRawState = {
          pixels: currentProj.pixels,
          width: currentProj.width,
          height: currentProj.height,
          layers: currentProj.layers,
          frames: currentProj.frames,
          guides: currentProj.guides || []
        };
        setRedoStack(prevRedo => {
          if (prevRedo.length > 0) {
            const lastRedo = prevRedo[prevRedo.length - 1];
            return [...prevRedo, shareStructure(lastRedo, currentRawState)];
          }
          return [...prevRedo, fastDeepClone(currentRawState)];
        });
        const recovered = typeof previous === 'string' ? JSON.parse(previous) : previous;
        setProject(prev => {
          if (!prev) return prev;
          if (recovered && typeof recovered === 'object' && 'pixels' in recovered) {
            return {
              ...prev,
              width: recovered.width ?? prev.width,
              height: recovered.height ?? prev.height,
              layers: recovered.layers ?? prev.layers,
              frames: recovered.frames ?? prev.frames,
              pixels: recovered.pixels ?? prev.pixels,
              guides: recovered.guides || prev.guides || []
            };
          } else {
            const nextGuides = (recovered && typeof recovered === 'object' && recovered._guides)
              ? recovered._guides
              : (prev.guides || []);
            return {
              ...prev,
              pixels: recovered,
              guides: nextGuides
            };
          }
        });
        setUndoStack(prevUndo => prevUndo.slice(0, -1));
        return;
      }
    }

    if (timelineCommandHistory.canUndo()) {
      timelineCommandHistory.undo();
      return;
    }
  }, [setProject, undoStack]);

  const handleRedo = React.useCallback(() => {
    if (redoStack.length > 0) {
      const next = redoStack[redoStack.length - 1];
      const currentProj = projectRef.current;
      if (currentProj) {
        const currentRawState = {
          pixels: currentProj.pixels,
          width: currentProj.width,
          height: currentProj.height,
          layers: currentProj.layers,
          frames: currentProj.frames,
          guides: currentProj.guides || []
        };
        setUndoStack(prevUndo => {
          if (prevUndo.length > 0) {
            const lastUndo = prevUndo[prevUndo.length - 1];
            return [...prevUndo, shareStructure(lastUndo, currentRawState)];
          }
          return [...prevUndo, fastDeepClone(currentRawState)];
        });
        const recovered = typeof next === 'string' ? JSON.parse(next) : next;
        setProject(prev => {
          if (!prev) return prev;
          if (recovered && typeof recovered === 'object' && 'pixels' in recovered) {
            return {
              ...prev,
              width: recovered.width ?? prev.width,
              height: recovered.height ?? prev.height,
              layers: recovered.layers ?? prev.layers,
              frames: recovered.frames ?? prev.frames,
              pixels: recovered.pixels ?? prev.pixels,
              guides: recovered.guides || prev.guides || []
            };
          } else {
            const nextGuides = (recovered && typeof recovered === 'object' && recovered._guides)
              ? recovered._guides
              : (prev.guides || []);
            return {
              ...prev,
              pixels: recovered,
              guides: nextGuides
            };
          }
        });
        setRedoStack(prevRedo => prevRedo.slice(0, -1));
        return;
      }
    }

    if (timelineCommandHistory.canRedo()) {
      timelineCommandHistory.redo();
      return;
    }
  }, [setProject, redoStack]);

  return {
    undoStack,
    redoStack,
    setUndoStack,
    setRedoStack,
    saveSnapshotToHistory,
    handleUndo,
    handleRedo
  };
}

