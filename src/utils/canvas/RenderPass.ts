import { FrameBuffer } from './FrameBuffer';
import { RenderContext } from './RenderContext';

/**
 * Interface contract defining a unified render pass transformation stage.
 * Receives a FrameBuffer and a RenderContext, returning a new, modified, immutable FrameBuffer.
 */
export interface RenderPass {
  readonly id: string;
  execute(frameBuffer: FrameBuffer, context: RenderContext): FrameBuffer;
}
