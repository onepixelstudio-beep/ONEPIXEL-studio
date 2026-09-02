import { RenderWarning } from '../export/ExportTypes';

/**
 * Entity representing an immutable work unit containing composed pixel matrices
 * and spatial details inside the composition pipeline.
 * Ensures passes never manipulate raw arrays or edit the source project properties.
 */
export class FrameBuffer {
  public readonly width: number;
  public readonly height: number;
  public readonly pixels: string[];
  public readonly originX: number;
  public readonly originY: number;
  public readonly metadata: Record<string, any>;

  constructor(
    width: number,
    height: number,
    pixels: string[],
    originX: number = 0,
    originY: number = 0,
    metadata: Record<string, any> = {}
  ) {
    this.width = width;
    this.height = height;
    this.pixels = [...pixels];
    this.originX = originX;
    this.originY = originY;
    this.metadata = { ...metadata };
  }

  /**
   * Return a new FrameBuffer with updated values, maintaining immutability.
   */
  public clone(updates: Partial<{
    width: number;
    height: number;
    pixels: string[];
    originX: number;
    originY: number;
    metadata: Record<string, any>;
  }>): FrameBuffer {
    return new FrameBuffer(
      updates.width !== undefined ? updates.width : this.width,
      updates.height !== undefined ? updates.height : this.height,
      updates.pixels !== undefined ? updates.pixels : this.pixels,
      updates.originX !== undefined ? updates.originX : this.originX,
      updates.originY !== undefined ? updates.originY : this.originY,
      updates.metadata !== undefined ? { ...this.metadata, ...updates.metadata } : this.metadata
    );
  }
}
