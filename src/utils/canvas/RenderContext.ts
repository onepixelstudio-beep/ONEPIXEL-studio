import { PixelProject } from '../../types';
import { RenderSettings, RenderWarning } from '../export/ExportTypes';

/**
 * Shared context for the render passes pipeline execution.
 * Encapsulates settings, metadata, warnings, and cumulative statistics.
 */
export interface RenderContext {
  readonly project: PixelProject;
  readonly settings: RenderSettings;
  readonly frameId: string;
  readonly frameIndex: number;
  readonly warnings: RenderWarning[];
  statistics: {
    layersMerged: number;
    pixelsProcessed: number;
    pixelsWritten: number;
    pixelsDiscarded: number;
  };
}
