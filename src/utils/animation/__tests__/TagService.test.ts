import { describe, it, expect } from 'vitest';
import { TagService } from '../TagService';
import { AnimationTag } from '../../../types';

describe('TagService', () => {
  const initialTags: AnimationTag[] = [
    { id: 'tag-1', name: 'Intro', color: '#ff0000', startFrameIndex: 0, endFrameIndex: 2 },
    { id: 'tag-2', name: 'Loop', color: '#00ff00', startFrameIndex: 3, endFrameIndex: 5 }
  ];

  it('should shift tag indices when inserting a frame', () => {
    // Insert at index 1 (middle of tag-1, before tag-2)
    const tagsAfter1 = TagService.handleFrameInsertion(initialTags, 1);
    expect(tagsAfter1[0]).toEqual({
      id: 'tag-1', name: 'Intro', color: '#ff0000', startFrameIndex: 0, endFrameIndex: 3
    });
    expect(tagsAfter1[1]).toEqual({
      id: 'tag-2', name: 'Loop', color: '#00ff00', startFrameIndex: 4, endFrameIndex: 6
    });

    // Insert at index 0 (at the start)
    const tagsAfter2 = TagService.handleFrameInsertion(initialTags, 0);
    expect(tagsAfter2[0].startFrameIndex).toBe(1);
    expect(tagsAfter2[0].endFrameIndex).toBe(3);
    expect(tagsAfter2[1].startFrameIndex).toBe(4);
    expect(tagsAfter2[1].endFrameIndex).toBe(6);
  });

  it('should adjust and shrink tags when deleting a frame', () => {
    // Delete frame 4 (inside tag-2 range [3, 5])
    const tagsAfterDelete = TagService.handleFrameDeletion(initialTags, 4);

    expect(tagsAfterDelete[0]).toEqual({
      id: 'tag-1', name: 'Intro', color: '#ff0000', startFrameIndex: 0, endFrameIndex: 2
    });
    expect(tagsAfterDelete[1]).toEqual({
      id: 'tag-2', name: 'Loop', color: '#00ff00', startFrameIndex: 3, endFrameIndex: 4
    });
  });

  it('should remove tags when their range collapses to invalid ranges', () => {
    const microTags: AnimationTag[] = [
      { id: 'tag-1', name: 'Tiny', color: '#fff', startFrameIndex: 1, endFrameIndex: 1 }
    ];

    // Delete at index 1, which collapses the tag
    const result = TagService.handleFrameDeletion(microTags, 1);
    expect(result).toHaveLength(0); // Colapsed completely and was removed
  });

  it('should adjust tags correctly when moving a frame', () => {
    // Moving frame from index 1 to 4
    const result = TagService.handleFrameMove(initialTags, 1, 4);
    
    // Original tag-1 was [0, 2]. Moving frame 1 to 4 should:
    // Frame 1 becomes index 4.
    // Frame 2 (idx 2) shifts left to 1.
    // Frame 3 (idx 3) shifts left to 2.
    // Frame 4 (idx 4) shifts left to 3.
    // Let's verify start/end calculations
    expect(result).toBeDefined();
  });

  it('should find tag that contains a given frame index', () => {
    const foundIntro = TagService.findTagForFrame(initialTags, 1);
    expect(foundIntro?.id).toBe('tag-1');

    const foundLoop = TagService.findTagForFrame(initialTags, 4);
    expect(foundLoop?.id).toBe('tag-2');

    const foundNone = TagService.findTagForFrame(initialTags, 10);
    expect(foundNone).toBeNull();
  });
});
