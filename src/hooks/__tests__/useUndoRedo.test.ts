import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockUndoStack: any[] = [];
let mockRedoStack: any[] = [];
let useStateCallCount = 0;

vi.mock('react', async () => {
  const actual = await vi.importActual('react') as any;
  const mockReact = {
    ...actual,
    useState: (initial: any) => {
      const currentCall = useStateCallCount;
      useStateCallCount++;
      if (currentCall % 2 === 0) {
        return [
          mockUndoStack,
          (updater: any) => {
            mockUndoStack = typeof updater === 'function' ? updater(mockUndoStack) : updater;
          }
        ];
      } else {
        return [
          mockRedoStack,
          (updater: any) => {
            mockRedoStack = typeof updater === 'function' ? updater(mockRedoStack) : updater;
          }
        ];
      }
    },
    useRef: (initial: any) => {
      return { current: initial };
    },
    useEffect: (fn: any, deps?: any) => {
      fn();
    },
    useCallback: (fn: any, deps?: any) => {
      return fn;
    },
    useMemo: (fn: any, deps?: any) => {
      return fn();
    }
  };
  return {
    ...mockReact,
    default: mockReact
  };
});

import { useUndoRedo } from '../useUndoRedo';
import { PixelProject } from '../../types';
import { timelineCommandHistory } from '../../utils/animation/CommandSystem';

describe('useUndoRedo hook logic', () => {
  let project: PixelProject;
  let mockSetProject: any;

  const renderHookHelper = () => {
    useStateCallCount = 0;
    return useUndoRedo(project, mockSetProject);
  };

  beforeEach(() => {
    mockUndoStack = [];
    mockRedoStack = [];
    useStateCallCount = 0;
    timelineCommandHistory.clear();

    project = {
      id: 'p1',
      name: 'Test Project',
      width: 2,
      height: 2,
      layers: [{ id: 'l1', name: 'Layer 1', opacity: 100, visible: true, locked: false }],
      frames: [{ id: 'f1', name: 'Frame 1', durationMs: 100 }],
      pixels: {
        'f1': {
          'l1': ['#ffffff', '', '', '']
        }
      },
      fps: 10,
      tags: [],
      lastSaved: Date.now()
    };

    mockSetProject = vi.fn((updater: any) => {
      if (typeof updater === 'function') {
        project = updater(project);
      } else {
        project = updater;
      }
    });
  });

  it('should successfully save a snapshot of pixels state using structural sharing', () => {
    const hook = renderHookHelper();
    const snapshot1 = { 'f1': { 'l1': ['#ffffff', '#000000', '', ''] } };
    
    hook.saveSnapshotToHistory(snapshot1);

    expect(mockUndoStack).toHaveLength(1);
    expect(mockUndoStack[0].pixels).toStrictEqual(snapshot1); // Deep equality check (due to cloning/sharing)
    expect(mockRedoStack).toHaveLength(0); // Clears redo stack
  });

  it('should guard against saving identical consecutive references', () => {
    let hook = renderHookHelper();
    const snapshot = { 'f1': { 'l1': ['#ffffff', '', '', ''] } };
    
    hook.saveSnapshotToHistory(snapshot);
    
    // Rerender hook to get new state reference
    hook = renderHookHelper();
    hook.saveSnapshotToHistory(snapshot); // Duplicate save call

    expect(mockUndoStack).toHaveLength(1); // Only stored once
  });

  it('should limit stack size to 50 steps', () => {
    let hook = renderHookHelper();

    for (let i = 1; i <= 60; i++) {
      hook = renderHookHelper();
      hook.saveSnapshotToHistory({ 'f1': { 'l1': [`#${i}`] } });
    }

    expect(mockUndoStack).toHaveLength(50); // limited to 50
    expect(mockUndoStack[mockUndoStack.length - 1].pixels['f1']['l1'][0]).toBe('#60');
  });

  it('should handle undo and restore previous state', () => {
    let hook = renderHookHelper();
    const snapshot1 = { 'f1': { 'l1': ['#111111', '', '', ''] } };
    const snapshot2 = { 'f1': { 'l1': ['#222222', '', '', ''] } };

    hook.saveSnapshotToHistory(snapshot1);
    
    // Update current project pixels
    project.pixels = snapshot2;

    // Simulate render to pass updated project.pixels to hook
    hook = renderHookHelper();
    hook.handleUndo();

    expect(project.pixels).toEqual(snapshot1);
    expect(mockUndoStack).toHaveLength(0);
    expect(mockRedoStack).toHaveLength(1);
    expect(mockRedoStack[0].pixels).toStrictEqual(snapshot2); // Deep equality check (due to cloning/sharing)
  });

  it('should handle redo and restore next state', () => {
    let hook = renderHookHelper();
    const snapshot1 = { 'f1': { 'l1': ['#111111', '', '', ''] } };
    const snapshot2 = { 'f1': { 'l1': ['#222222', '', '', ''] } };

    hook.saveSnapshotToHistory(snapshot1);
    project.pixels = snapshot2;

    hook = renderHookHelper();
    hook.handleUndo();
    expect(project.pixels).toEqual(snapshot1);

    hook = renderHookHelper();
    hook.handleRedo();
    expect(project.pixels).toEqual(snapshot2);
    expect(mockUndoStack).toHaveLength(1);
    expect(mockUndoStack[0].pixels).toStrictEqual(snapshot1);
    expect(mockRedoStack).toHaveLength(0);
  });

  it('should seamlessly support backward compatibility for old stringified snapshots', () => {
    let hook = renderHookHelper();

    // Seed the undoStack with a stringified state
    const stringifiedSnapshot = JSON.stringify({ 'f1': { 'l1': ['#aabbcc', '', '', ''] } });
    mockUndoStack.push(stringifiedSnapshot);

    hook = renderHookHelper();
    hook.handleUndo();

    expect(project.pixels).toEqual({ 'f1': { 'l1': ['#aabbcc', '', '', ''] } });
  });

  it('should reuse unchanged parts of the structure (Structural Sharing / Reference Reuse)', () => {
    let hook = renderHookHelper();
    const snapshot1 = { 
      'f1': { 'l1': ['#ffffff', '', '', ''] },
      'f2': { 'l1': ['#000000', '', '', ''] }
    };
    hook.saveSnapshotToHistory(snapshot1);

    const snapshot2 = {
      'f1': { 'l1': ['#ffffff', '', '', ''] }, // Unchanged
      'f2': { 'l1': ['#ff0000', '', '', ''] }  // Changed
    };

    hook = renderHookHelper();
    hook.saveSnapshotToHistory(snapshot2);

    expect(mockUndoStack).toHaveLength(2);
    
    // The unchanged frame 'f1' should share the exact same object reference between snapshots!
    expect(mockUndoStack[1].pixels['f1']).toBe(mockUndoStack[0].pixels['f1']);
    
    // The changed frame 'f2' should have a different reference!
    expect(mockUndoStack[1].pixels['f2']).not.toBe(mockUndoStack[0].pixels['f2']);
  });
});
