import { PixelProject } from '../../types';
import {
  RenderResult,
  RenderedFrame,
  RenderSettings,
  RenderStatistics,
  RenderWarning,
} from '../export/ExportTypes';
import { RenderCache } from '../export/RenderCache';
import { FrameBuffer } from './FrameBuffer';
import { RenderContext } from './RenderContext';
import { RenderPassRegistry } from './RenderPassRegistry';

/**
 * CoreRenderProcessor: A platform-agnostic, mathematical engine for pixel-art composition.
 * Operates purely on matrix representations, completely decoupled from DOM and Canvas APIs.
 * Refactored in Phase 9.2 with a dynamic, registry-driven render passes pipeline.
 */
export class CoreRenderProcessor {
  /**
   * Main entry point to compose and render the project according to settings.
   */
  public static async render(
    project: PixelProject,
    settings: RenderSettings = {}
  ): Promise<RenderResult> {
    const startTime = Date.now();
    const scale = settings.scale || 1;

    // 1. Run Lifecycle Hooks: beforeRender
    if (settings.hooks?.beforeRender) {
      try {
        settings.hooks.beforeRender(project, settings);
      } catch (err) {
        console.error('[CoreRenderProcessor] Error in beforeRender hook:', err);
      }
    }

    // 2. Validate Project Data and Settings
    const warnings: RenderWarning[] = [];
    this.validate(project, settings, warnings);

    // 3. Query the Render Cache for acceleration
    const cachedResult = RenderCache.get(project, scale);
    if (cachedResult) {
      const finalStats: RenderStatistics = {
        ...cachedResult.statistics,
        renderTimeMs: Date.now() - startTime,
        cacheHit: true,
        cacheMiss: false,
      };

      const resultWithUpdatedStats = {
        ...cachedResult,
        statistics: finalStats,
        warnings: [...cachedResult.warnings, ...warnings],
      };

      if (settings.hooks?.afterRender) {
        try {
          settings.hooks.afterRender(project, settings, resultWithUpdatedStats);
        } catch (err) {
          console.error('[CoreRenderProcessor] Error in afterRender hook:', err);
        }
      }

      return resultWithUpdatedStats;
    }

    // 4. Resolve frames to render
    const frameIds = settings.selectedFramesOnly && settings.selectedFramesOnly.length > 0
      ? settings.selectedFramesOnly
      : project.frames.map((f) => f.id);

    const renderedFrames: RenderedFrame[] = [];
    
    // Core statistics accumulators
    const cumulativeStats = {
      layersMerged: 0,
      pixelsProcessed: 0,
      pixelsWritten: 0,
      pixelsDiscarded: 0,
    };

    // Get ordered passes from Registry
    const registry = RenderPassRegistry.getInstance();
    const activePasses = registry.list();

    // 5. Render individual frames in sequence
    for (let idx = 0; idx < frameIds.length; idx++) {
      const frameId = frameIds[idx];
      const frameObj = project.frames.find((f) => f.id === frameId);
      const durationMs = frameObj ? frameObj.durationMs : 100;

      // Lifecycle Hook: beforeFrame
      if (settings.hooks?.beforeFrame) {
        try {
          settings.hooks.beforeFrame(frameId, idx);
        } catch (err) {
          console.error('[CoreRenderProcessor] Error in beforeFrame hook:', err);
        }
      }

      // Create a RenderContext for the current frame composition pipeline
      const context: RenderContext = {
        project,
        settings,
        frameId,
        frameIndex: idx,
        warnings,
        statistics: {
          layersMerged: 0,
          pixelsProcessed: 0,
          pixelsWritten: 0,
          pixelsDiscarded: 0,
        },
      };

      // Initialize the starting empty FrameBuffer
      let fb = new FrameBuffer(project.width, project.height, []);

      // Execute each registered render pass sequentially
      for (const pass of activePasses) {
        fb = pass.execute(fb, context);
      }

      // Compile stats & track pixel count
      const processedPixelCount = fb.pixels.length;
      cumulativeStats.layersMerged += context.statistics.layersMerged;
      cumulativeStats.pixelsProcessed += project.width * project.height;
      cumulativeStats.pixelsWritten += processedPixelCount;
      cumulativeStats.pixelsDiscarded += (project.width * project.height) - processedPixelCount;

      renderedFrames.push({
        frameId,
        name: frameObj?.name || `frame_${idx + 1}`,
        width: fb.width,
        height: fb.height,
        durationMs,
        pixels: fb.pixels,
      });

      // Lifecycle Hook: afterFrame
      if (settings.hooks?.afterFrame) {
        try {
          settings.hooks.afterFrame(frameId, idx, fb.pixels);
        } catch (err) {
          console.error('[CoreRenderProcessor] Error in afterFrame hook:', err);
        }
      }
    }

    // Compile final RenderStatistics
    const elapsed = Date.now() - startTime;
    const statistics: RenderStatistics = {
      renderTimeMs: elapsed,
      framesRendered: renderedFrames.length,
      layersMerged: cumulativeStats.layersMerged,
      pixelsProcessed: cumulativeStats.pixelsProcessed,
      pixelsWritten: cumulativeStats.pixelsWritten,
      pixelsDiscarded: Math.max(0, cumulativeStats.pixelsDiscarded),
      scaleApplied: scale,
      cacheHit: false,
      cacheMiss: true,
    };

    // Gather palette colors dynamically
    const palette = project.layers.reduce<string[]>((acc, l) => {
      const framePixels = project.pixels;
      for (const fId of frameIds) {
        const layerPix = framePixels[fId]?.[l.id];
        if (layerPix) {
          for (const p of layerPix) {
            if (p && p !== 'transparent' && !acc.includes(p)) {
              acc.push(p);
            }
          }
        }
      }
      return acc;
    }, []);

    // Create final immutable RenderResult
    const finalResult: RenderResult = {
      projectId: project.id,
      projectName: project.name,
      width: renderedFrames[0]?.width || project.width,
      height: renderedFrames[0]?.height || project.height,
      scale,
      frames: renderedFrames,
      palette: palette.length > 0 ? palette : ['#000000', '#ffffff'],
      statistics,
      warnings,
    };

    // Store in the memory cache
    RenderCache.set(project, scale, finalResult);

    // Lifecycle Hook: afterRender
    if (settings.hooks?.afterRender) {
      try {
        settings.hooks.afterRender(project, settings, finalResult);
      } catch (err) {
        console.error('[CoreRenderProcessor] Error in afterRender hook:', err);
      }
    }

    return finalResult;
  }

  /**
   * Validation Pass: Evaluates project structures and parameters to secure execution bounds.
   */
  private static validate(
    project: PixelProject,
    settings: RenderSettings,
    warnings: RenderWarning[]
  ): void {
    // 1. Basic Geometry Boundaries
    if (!project.width || project.width <= 0 || project.height <= 0) {
      throw new Error(`[RenderValidator] Dimensiones inválidas del proyecto: ${project.width}x${project.height}`);
    }

    if (project.width > 4096 || project.height > 4096) {
      warnings.push({
        code: 'HUGE_PROJECT',
        message: 'El tamaño de este lienzo es extremadamente grande. El rendimiento del empaquetado podría verse reducido.',
        severity: 'warning',
      });
    }

    // 2. Scale Boundaries
    const scale = settings.scale || 1;
    if (scale <= 0) {
      throw new Error(`[RenderValidator] Escala inválida: ${scale}. Debe ser positiva.`);
    }

    if (scale > 100) {
      warnings.push({
        code: 'HUGE_SCALE_EXPORT',
        message: 'La escala seleccionada es muy alta. El renderizado podría consumir excesivos recursos.',
        severity: 'warning',
      });
    }

    // 3. Margin & Padding Validation
    if (settings.padding) {
      const { top, right, bottom, left } = settings.padding;
      if (top < 0 || right < 0 || bottom < 0 || left < 0) {
        throw new Error('[RenderValidator] El espaciado de relleno (padding) no puede contener valores negativos.');
      }
    }

    if (settings.margin) {
      const { top, right, bottom, left } = settings.margin;
      if (top < 0 || right < 0 || bottom < 0 || left < 0) {
        throw new Error('[RenderValidator] Los márgenes exteriores (margin) no pueden contener valores negativos.');
      }
    }

    // 4. Crop Box Validity Checks
    if (settings.crop) {
      const { x, y, width, height } = settings.crop;
      if (width <= 0 || height <= 0) {
        throw new Error('[RenderValidator] Las dimensiones del recorte (crop box) deben ser positivas.');
      }
      if (x < 0 || y < 0 || x >= project.width || y >= project.height) {
        warnings.push({
          code: 'OUT_OF_BOUNDS_CROP',
          message: 'El origen del recorte está situado fuera del lienzo original. Se aplicará un reajuste con transparencias.',
          severity: 'warning',
        });
      }
    }
  }
}
