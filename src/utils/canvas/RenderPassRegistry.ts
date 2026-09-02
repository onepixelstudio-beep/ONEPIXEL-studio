import { RenderPass } from './RenderPass';
import {
  LayerMergePass,
  CropPass,
  BgColorPass,
  PaddingPass,
  MarginPass,
  ScalingPass,
} from './passes/StandardPasses';

/**
 * Registry for managing dynamic render passes inside the composition pipeline.
 * Adheres strictly to the Open-Closed Principle (OCP), decoupling CoreRenderProcessor
 * from a rigid sequence of hardcoded steps.
 */
export class RenderPassRegistry {
  private static instance: RenderPassRegistry | null = null;
  private passes: RenderPass[] = [];

  private constructor() {
    this.reset();
  }

  /**
   * Retrieves the singleton instance of the registry.
   */
  public static getInstance(): RenderPassRegistry {
    if (!this.instance) {
      this.instance = new RenderPassRegistry();
    }
    return this.instance;
  }

  /**
   * Resets the registry back to the default ordered 6 standard passes.
   */
  public reset(): void {
    this.passes = [
      new LayerMergePass(),
      new CropPass(),
      new BgColorPass(),
      new PaddingPass(),
      new MarginPass(),
      new ScalingPass(),
    ];
  }

  /**
   * Registers a new render pass, optionally at a specific index.
   * Automatically unregisters any existing pass with the same ID.
   */
  public register(pass: RenderPass, index?: number): void {
    this.unregister(pass.id);

    if (index !== undefined && index >= 0 && index <= this.passes.length) {
      this.passes.splice(index, 0, pass);
    } else {
      this.passes.push(pass);
    }
  }

  /**
   * Unregisters a render pass by ID.
   */
  public unregister(id: string): void {
    this.passes = this.passes.filter((p) => p.id !== id);
  }

  /**
   * Fetches a render pass by ID.
   */
  public get(id: string): RenderPass | undefined {
    return this.passes.find((p) => p.id === id);
  }

  /**
   * Lists all currently registered render passes in execution order.
   */
  public list(): RenderPass[] {
    return [...this.passes];
  }
}
