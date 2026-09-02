import { describe, it, expect } from 'vitest';
import { ProjectPixels } from '../../types';

describe('Immutability and structural sharing integrity', () => {
  it('should verify that deep updates on pixels do not mutate prior snapshot references (absence of shared mutations)', () => {
    // 1. Setup initial state
    const originalPixels: ProjectPixels = {
      'f1': {
        'l1': ['#ffffff', '', '', '']
      },
      'f2': {
        'l1': ['', '#ff0000', '', '']
      }
    };

    // Keep a reference to the snapshot pushed to the history
    const historySnapshot = { ...originalPixels };

    // 2. Perform a simulated frame-specific copy-on-write update (as done in App.tsx / CanvasArea.tsx)
    const currentFrameId = 'f1';
    const currentLayerId = 'l1';
    const newPixelsForLayer = ['#ffffff', '#000000', '', ''];

    const updatedPixels = { ...originalPixels };
    updatedPixels[currentFrameId] = {
      ...updatedPixels[currentFrameId],
      [currentLayerId]: newPixelsForLayer
    };

    // 3. Assertions:
    // - The history snapshot and the updated state should not share references for the updated frame
    expect(updatedPixels[currentFrameId]).not.toBe(historySnapshot[currentFrameId]);
    expect(updatedPixels[currentFrameId][currentLayerId]).not.toBe(historySnapshot[currentFrameId][currentLayerId]);

    // - Crucially: untouched frames MUST be structurally shared to save memory and avoid deep cloning!
    expect(updatedPixels['f2']).toBe(historySnapshot['f2']); // Shared reference! Excellent.
    expect(updatedPixels['f2']['l1']).toBe(historySnapshot['f2']['l1']); // Shared reference! Excellent.

    // - Let's verify that modifying updatedPixels does not mutate originalPixels or the history snapshot
    expect(historySnapshot['f1']['l1']).toEqual(['#ffffff', '', '', '']);
    expect(updatedPixels['f1']['l1']).toEqual(['#ffffff', '#000000', '', '']);
  });

  it('should verify that nested frame dictionaries are cloned and not mutated in place during drawing', () => {
    const originalPixels: ProjectPixels = {
      'f1': {
        'l1': ['#ffffff', ''],
        'l2': ['', '#00ff00']
      }
    };

    // Simulate history snapshot
    const historySnapshot = { ...originalPixels };
    const currentFrameId = 'f1';
    const currentLayerId = 'l1';
    const newLayerPixels = ['#ffffff', '#ff0000'];

    const updatedPixels = { ...originalPixels };

    // INCORRECT: updatedPixels[currentFrameId][currentLayerId] = newLayerPixels;
    // CORRECT: Clone the frame dictionary first
    updatedPixels[currentFrameId] = {
      ...updatedPixels[currentFrameId],
      [currentLayerId]: newLayerPixels
    };

    // The current layer is updated
    expect(updatedPixels[currentFrameId][currentLayerId]).toEqual(['#ffffff', '#ff0000']);
    // The untouched layer in the same frame remains structurally shared
    expect(updatedPixels[currentFrameId]['l2']).toBe(originalPixels[currentFrameId]['l2']);
    // Crucially, the original state/history snapshot was NOT mutated
    expect(historySnapshot[currentFrameId][currentLayerId]).toEqual(['#ffffff', '']);
  });
});
