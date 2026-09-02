import { PixelProject } from '../../types';
import { 
  RenderResult, 
  RenderSettings, 
  ExportProgress, 
  ExportHooks, 
  EncoderContext, 
  EncodedFile 
} from './ExportTypes';
import { exportPluginRegistry } from './ExportPluginRegistry';
import { CoreRenderProcessor } from '../canvas/CoreRenderProcessor';
import { FileSaveService } from './FileSaveService';
import { 
  RenderError, 
  EncodeError, 
  SaveError, 
  CancelError, 
  ExportError 
} from './ExportErrors';

export interface ExportPipelineResult {
  filename: string;
  extension: string;
  mimeType: string;
  fileSize: number;
  renderTimeMs: number;
  encodingTimeMs: number;
  totalTimeMs: number;
  cacheHit: boolean;
}

export class ExportPipeline {
  /**
   * Main entry point to orchestrate the entire render-encode-save pipeline.
   * Completely encapsulates progress administration, caching, error handling,
   * hook execution, and telemetry gathering.
   */
  public static async execute(params: {
    project: PixelProject;
    pluginId: string;
    scale: number;
    options: Record<string, any>;
    fileHandle?: any;
    hooks?: ExportHooks;
    signal?: AbortSignal;
    onProgress?: (progress: ExportProgress) => void;
  }): Promise<ExportPipelineResult> {
    const { project, pluginId, scale, options, fileHandle, hooks, signal, onProgress } = params;
    const totalStartTime = performance.now();

    // Helper progress reporter
    const reportProgress = (stage: any, message: string, percentage: number) => {
      onProgress?.({ stage, message, percentage });
    };

    // 1. Resolve plugin
    const plugin = exportPluginRegistry.get(pluginId);
    if (!plugin) {
      throw new EncodeError(`Plugin con id '${pluginId}' no está registrado.`);
    }

    // Defensive check: AbortSignal already triggered
    if (signal?.aborted) {
      const err = new CancelError();
      await hooks?.onCancel?.();
      throw err;
    }

    try {
      reportProgress('reading_project', 'Iniciando pipeline de exportación...', 2);

      // 2. Execute Lifecycle Hook: beforeRender
      if (hooks?.beforeRender) {
        try {
          await hooks.beforeRender(project, { scale });
        } catch (err: any) {
          console.warn('[ExportPipeline] Error in beforeRender hook:', err);
        }
      }

      if (signal?.aborted) throw new CancelError();

      // 3. Perform Rendering / Blending
      reportProgress('rendering_frames', 'Renderizando y componiendo cuadros...', 10);
      const renderSettings: RenderSettings = {
        scale,
        bgColor: options.transparent === false ? (options.bgColor || '#ffffff') : undefined,
        selectedFramesOnly: options.range === 'first' && project.frames.length > 0
          ? [project.frames[0].id]
          : undefined,
      };

      let renderResult: RenderResult;
      try {
        renderResult = await CoreRenderProcessor.render(project, renderSettings);
      } catch (err: any) {
        throw new RenderError('Fallo en la fase de renderizado matemático', err.message);
      }

      if (signal?.aborted) throw new CancelError();

      // Execute Lifecycle Hook: afterRender
      if (hooks?.afterRender) {
        try {
          await hooks.afterRender(project, { scale }, renderResult);
        } catch (err: any) {
          console.warn('[ExportPipeline] Error in afterRender hook:', err);
        }
      }

      if (signal?.aborted) throw new CancelError();

      // 4. Construct the Unified EncoderContext
      const encoderStartTime = performance.now();
      const logs: string[] = [];
      const encoderContext: EncoderContext = {
        renderResult,
        options,
        signal,
        onProgress: (p) => {
          // Map encoder formats progress into standard pipeline percentage
          // Give rendering a budget of 0-20% and encoder format a budget of 20-90%
          const mappedPercentage = Math.round(20 + (p.percentage * 0.70));
          reportProgress('encoding_format', p.message, mappedPercentage);
        },
        statistics: {
          startTime: encoderStartTime,
        },
        logger: {
          info: (msg) => {
            logs.push(`[INFO] ${msg}`);
            console.log(`[ExportPipeline:${pluginId}] ${msg}`);
          },
          warn: (msg) => {
            logs.push(`[WARN] ${msg}`);
            console.warn(`[ExportPipeline:${pluginId}] ${msg}`);
          },
          error: (msg, err) => {
            logs.push(`[ERROR] ${msg} - ${err?.message || err}`);
            console.error(`[ExportPipeline:${pluginId}] ${msg}`, err);
          }
        }
      };

      // Execute Lifecycle Hook: beforeEncode
      if (hooks?.beforeEncode) {
        try {
          await hooks.beforeEncode(encoderContext);
        } catch (err: any) {
          console.warn('[ExportPipeline] Error in beforeEncode hook:', err);
        }
      }

      if (signal?.aborted) throw new CancelError();

      // 5. Execute format-specific Encoder
      reportProgress('encoding_format', `Codificando a formato ${plugin.name}...`, 20);
      let encodedFile: EncodedFile;
      try {
        encodedFile = await plugin.encode(encoderContext);
      } catch (err: any) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          throw new CancelError();
        }
        if (err instanceof CancelError) {
          throw err;
        }
        throw new EncodeError(`Fallo al codificar formato ${plugin.name}`, err.message);
      }

      const encoderEndTime = performance.now();
      encoderContext.statistics.encodingTimeMs = encoderEndTime - encoderStartTime;

      if (signal?.aborted) throw new CancelError();

      // Calculate file size safely in memory
      let sizeBytes = 0;
      if (encodedFile.data instanceof Blob) {
        sizeBytes = encodedFile.data.size;
      } else if (typeof encodedFile.data === 'string') {
        sizeBytes = new Blob([encodedFile.data]).size;
      } else if (encodedFile.data instanceof Uint8Array) {
        sizeBytes = encodedFile.data.byteLength;
      }
      encoderContext.statistics.fileSize = sizeBytes;

      // Execute Lifecycle Hook: afterEncode
      if (hooks?.afterEncode) {
        try {
          await hooks.afterEncode(encoderContext, encodedFile);
        } catch (err: any) {
          console.warn('[ExportPipeline] Error in afterEncode hook:', err);
        }
      }

      if (signal?.aborted) throw new CancelError();

      // 6. Execute Lifecycle Hook: beforeSave
      if (hooks?.beforeSave) {
        try {
          await hooks.beforeSave(encodedFile);
        } catch (err: any) {
          console.warn('[ExportPipeline] Error in beforeSave hook:', err);
        }
      }

      if (signal?.aborted) throw new CancelError();

      // 7. Standardized local file saving
      reportProgress('saving_file', 'Guardando archivo en la ubicación seleccionada...', 92);
      try {
        await FileSaveService.save(encodedFile, fileHandle);
      } catch (err: any) {
        if (err instanceof SaveError) throw err;
        throw new SaveError('Fallo en la persistencia local de descarga', err.message);
      }

      // Execute Lifecycle Hook: afterSave
      if (hooks?.afterSave) {
        try {
          await hooks.afterSave(encodedFile);
        } catch (err: any) {
          console.warn('[ExportPipeline] Error in afterSave hook:', err);
        }
      }

      const totalEndTime = performance.now();
      reportProgress('completed', '¡Exportación completada con éxito!', 100);

      return {
        filename: encodedFile.filename,
        extension: encodedFile.extension,
        mimeType: encodedFile.mimeType,
        fileSize: sizeBytes,
        renderTimeMs: renderResult.statistics.renderTimeMs,
        encodingTimeMs: encoderContext.statistics.encodingTimeMs,
        totalTimeMs: totalEndTime - totalStartTime,
        cacheHit: renderResult.statistics.cacheHit,
      };

    } catch (error: any) {
      if (error instanceof CancelError || (signal?.aborted && !(error instanceof ExportError))) {
        // Safe cancellation trigger
        reportProgress('error', 'Exportación cancelada.', 0);
        if (hooks?.onCancel) {
          try {
            await hooks.onCancel();
          } catch (hookErr) {
            console.error('[ExportPipeline] Error in onCancel hook:', hookErr);
          }
        }
        throw error instanceof CancelError ? error : new CancelError();
      }

      // General error reporting
      reportProgress('error', error.message || 'Error desconocido.', 0);
      if (hooks?.onError) {
        try {
          await hooks.onError(error);
        } catch (hookErr) {
          console.error('[ExportPipeline] Error in onError hook:', hookErr);
        }
      }
      throw error;
    }
  }
}
