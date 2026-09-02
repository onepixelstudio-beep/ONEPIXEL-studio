import { describe, it, expect } from 'vitest';
import { SelectionService } from '../SelectionService';
import { FrameSelectionState } from '../../../types';

describe('SelectionService - Phase 1 Contract Tests', () => {
  const allFrameIds = ['f1', 'f2', 'f3', 'f4', 'f5'];

  it('should initialize correctly with a simple Click', () => {
    const state = SelectionService.click(allFrameIds, 'f3');
    expect(state).toEqual({
      activeFrameId: 'f3',
      focusedFrameId: 'f3',
      anchorFrameId: 'f3',
      selectedFrameIds: ['f3'],
    });
  });

  it('should fallback to first frame on Click with invalid ID', () => {
    const state = SelectionService.click(allFrameIds, 'invalid');
    expect(state).toEqual({
      activeFrameId: 'f1',
      focusedFrameId: 'f1',
      anchorFrameId: 'f1',
      selectedFrameIds: ['f1'],
    });
  });

  it('should toggle selection on Ctrl+Click when item is not selected', () => {
    const initialState: FrameSelectionState = {
      activeFrameId: 'f1',
      focusedFrameId: 'f1',
      anchorFrameId: 'f1',
      selectedFrameIds: ['f1'],
    };

    const state = SelectionService.ctrlClick(initialState, allFrameIds, 'f3');
    expect(state.selectedFrameIds).toEqual(['f1', 'f3']);
    expect(state.focusedFrameId).toBe('f3');
    expect(state.anchorFrameId).toBe('f1'); // anchor remains unchanged
    expect(state.activeFrameId).toBe('f1'); // active remains unchanged since it is still selected
  });

  it('should toggle selection off on Ctrl+Click when item is selected', () => {
    const initialState: FrameSelectionState = {
      activeFrameId: 'f1',
      focusedFrameId: 'f3',
      anchorFrameId: 'f1',
      selectedFrameIds: ['f1', 'f3'],
    };

    const state = SelectionService.ctrlClick(initialState, allFrameIds, 'f3');
    expect(state.selectedFrameIds).toEqual(['f1']);
    expect(state.focusedFrameId).toBe('f3');
    expect(state.anchorFrameId).toBe('f1'); // remains unchanged
  });

  it('should not allow empty selection on Ctrl+Click of the only selected item', () => {
    const initialState: FrameSelectionState = {
      activeFrameId: 'f3',
      focusedFrameId: 'f3',
      anchorFrameId: 'f3',
      selectedFrameIds: ['f3'],
    };

    const state = SelectionService.ctrlClick(initialState, allFrameIds, 'f3');
    expect(state.selectedFrameIds).toEqual(['f3']); // keeps it selected to preserve invariant
  });

  it('should select a range on Shift+Click', () => {
    const initialState: FrameSelectionState = {
      activeFrameId: 'f2',
      focusedFrameId: 'f2',
      anchorFrameId: 'f2',
      selectedFrameIds: ['f2'],
    };

    // Shift+Click from f2 to f4
    const state = SelectionService.shiftClick(initialState, allFrameIds, 'f4');
    expect(state.selectedFrameIds).toEqual(['f2', 'f3', 'f4']);
    expect(state.focusedFrameId).toBe('f4');
    expect(state.anchorFrameId).toBe('f2'); // anchor is preserved
    expect(state.activeFrameId).toBe('f4'); // updated according to default
  });

  it('should respect updateActiveFrame=false option on Shift+Click', () => {
    const initialState: FrameSelectionState = {
      activeFrameId: 'f2',
      focusedFrameId: 'f2',
      anchorFrameId: 'f2',
      selectedFrameIds: ['f2'],
    };

    const state = SelectionService.shiftClick(initialState, allFrameIds, 'f4', false);
    expect(state.selectedFrameIds).toEqual(['f2', 'f3', 'f4']);
    expect(state.activeFrameId).toBe('f2'); // preserved!
  });

  it('should union selections on Shift+Ctrl+Click', () => {
    const initialState: FrameSelectionState = {
      activeFrameId: 'f1',
      focusedFrameId: 'f1',
      anchorFrameId: 'f3',
      selectedFrameIds: ['f1', 'f3'],
    };

    // Range from anchor (f3) to f5
    const state = SelectionService.ctrlShiftClick(initialState, allFrameIds, 'f5');
    expect(state.selectedFrameIds).toEqual(['f1', 'f3', 'f4', 'f5']);
    expect(state.focusedFrameId).toBe('f5');
    expect(state.anchorFrameId).toBe('f3'); // anchor preserved
  });

  it('should clear multi-selection on Escape', () => {
    const initialState: FrameSelectionState = {
      activeFrameId: 'f3',
      focusedFrameId: 'f5',
      anchorFrameId: 'f2',
      selectedFrameIds: ['f2', 'f3', 'f4', 'f5'],
    };

    const state = SelectionService.escape(initialState);
    expect(state).toEqual({
      activeFrameId: 'f3',
      focusedFrameId: 'f3',
      anchorFrameId: 'f3',
      selectedFrameIds: ['f3'],
    });
  });

  it('should sanitize invalid state correctly', () => {
    const invalidState: Partial<FrameSelectionState> = {
      activeFrameId: 'invalid-active',
      focusedFrameId: 'invalid-focus',
      anchorFrameId: 'invalid-anchor',
      selectedFrameIds: ['f2', 'invalid-sel', 'f4'],
    };

    const state = SelectionService.sanitize(invalidState, allFrameIds);
    expect(state.activeFrameId).toBe('f1'); // fallback to first
    expect(state.focusedFrameId).toBe('f1');
    expect(state.anchorFrameId).toBe('f1');
    expect(state.selectedFrameIds).toEqual(['f2', 'f4']); // only valid ones
  });
});
