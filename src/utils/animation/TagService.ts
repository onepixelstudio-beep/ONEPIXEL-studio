import { AnimationTag } from '../../types';

export class TagService {
  /**
   * Adjusts tags after a frame is inserted at a given index.
   */
  public static handleFrameInsertion(tags: AnimationTag[], insertedIndex: number): AnimationTag[] {
    return tags.map(tag => {
      const start = tag.startFrameIndex >= insertedIndex ? tag.startFrameIndex + 1 : tag.startFrameIndex;
      const end = tag.endFrameIndex >= insertedIndex ? tag.endFrameIndex + 1 : tag.endFrameIndex;
      return {
        ...tag,
        startFrameIndex: start,
        endFrameIndex: end
      };
    });
  }

  /**
   * Adjusts tags after a frame is deleted at a given index.
   * If a tag's range collapses and becomes invalid (start > end), it is removed.
   */
  public static handleFrameDeletion(tags: AnimationTag[], deletedIndex: number): AnimationTag[] {
    return tags
      .map(tag => {
        let start = tag.startFrameIndex;
        let end = tag.endFrameIndex;

        if (start > deletedIndex) {
          start -= 1;
        }
        if (end >= deletedIndex) {
          end -= 1;
        }

        // Clip values to ensure they are within bounds
        start = Math.max(0, start);
        end = Math.max(0, end);

        return {
          ...tag,
          startFrameIndex: start,
          endFrameIndex: end
        };
      })
      .filter(tag => tag.startFrameIndex <= tag.endFrameIndex);
  }

  /**
   * Adjusts tags after a frame is moved from sourceIndex to targetIndex.
   */
  public static handleFrameMove(tags: AnimationTag[], sourceIndex: number, targetIndex: number): AnimationTag[] {
    if (sourceIndex === targetIndex) return tags;

    return tags.map(tag => {
      let start = tag.startFrameIndex;
      let end = tag.endFrameIndex;

      // Helper to shift index
      const shiftIndex = (idx: number): number => {
        if (idx === sourceIndex) {
          return targetIndex;
        }
        if (sourceIndex < targetIndex) {
          // Frame moved to the right
          if (idx > sourceIndex && idx <= targetIndex) {
            return idx - 1;
          }
        } else {
          // Frame moved to the left
          if (idx >= targetIndex && idx < sourceIndex) {
            return idx + 1;
          }
        }
        return idx;
      };

      const newStart = shiftIndex(start);
      const newEnd = shiftIndex(end);

      // Keep start <= end, adjust order if inverted
      return {
        ...tag,
        startFrameIndex: Math.min(newStart, newEnd),
        endFrameIndex: Math.max(newStart, newEnd)
      };
    });
  }

  /**
   * Helper to find a tag that contains the given visible index.
   */
  public static findTagForFrame(tags: AnimationTag[], frameIndex: number): AnimationTag | null {
    return tags.find(tag => frameIndex >= tag.startFrameIndex && frameIndex <= tag.endFrameIndex) || null;
  }
}
