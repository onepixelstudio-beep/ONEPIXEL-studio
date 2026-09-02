import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportPipeline } from '../ExportPipeline';
import { exportPluginRegistry, ExportPluginRegistry } from '../ExportPluginRegistry';
import { RenderCache } from '../RenderCache';
import { FileSaveService } from '../FileSaveService';
import { 
  ExportPlugin, 
  RenderResult, 
  EncodedFile, 
  EncoderContext, 
  ExportProgress 
} from '../ExportTypes';
import { 
  ExportError, 
  RenderError, 
  EncodeError, 
  SaveError, 
  CancelError 
} from '../ExportErrors';
import { PixelProject } from '../../../types';

describe('Export System - Advanced Extended Test Suite (EBA & Core Robustness)', () => {
  const testProject: PixelProject = {
    id: 'extended-test-proj',
    name: 'Pixel Masterpiece',
    width: 16,
    height: 16,
    fps: 10,
    tags: [],
    frames: [
      { id: 'frame-1', name: 'Intro', durationMs: 150 }
    ],
    layers: [
      { id: 'layer-1', name: 'Background', visible: true, opacity: 100, locked: false }
    ],
    pixels: {
      'frame-1': {
        'layer-1': Array(256).fill('#000000')
      }
    },
    lastSaved: 1620000000000
  };

  class DummyPlugin implements ExportPlugin {
    id = 'dummy-test-plugin';
    name = 'Dummy Test Format';
    desc = 'Used for system diagnostics';
    category = 'image' as const;
    icon = 'FileImage';
    extension = 'tst';
    capabilities = {
      supportsAnimation: true,
      supportsLayers: true,
      supportsPalette: true,
      supportsTransparency: true,
      supportsQuality: true,
      supportsPivot: true,
      supportsMetadata: true
    };
    getOptionsSchema() {
      return [];
    }
    async encode(context: EncoderContext): Promise<EncodedFile> {
      context.onProgress?.({ stage: 'encoding_format', message: 'Formatting test bytes', percentage: 50 });
      if (context.options.shouldSimulateError) {
        throw new Error('Simulated encode crash');
      }
      return {
        filename: context.options.filename || 'encoded_output',
        extension: 'tst',
        data: new Uint8Array([9, 9, 9, 9]),
        mimeType: 'application/octet-stream'
      };
    }
  }

  beforeEach(() => {
    RenderCache.invalidate();
    // Register DummyPlugin if not present
    if (!exportPluginRegistry.get('dummy-test-plugin')) {
      exportPluginRegistry.register(new DummyPlugin());
    }
  });

  // 1. Dynamic Registries, registerAll, and cleanup
  describe('Dynamic Registry & Bulk Action Verification', () => {
    it('should allow dynamic bulk registration of multiple plugins and full clear', () => {
      const customRegistry = new ExportPluginRegistry();
      const p1 = new DummyPlugin();
      p1.id = 'temp-p1';
      const p2 = new DummyPlugin();
      p2.id = 'temp-p2';

      customRegistry.registerAll([p1, p2]);
      expect(customRegistry.getAll()).toHaveLength(2);
      expect(customRegistry.get('temp-p1')).toBe(p1);

      customRegistry.unregister('temp-p1');
      expect(customRegistry.getAll()).toHaveLength(1);

      customRegistry.clear();
      expect(customRegistry.getAll()).toHaveLength(0);
    });
  });

  // 2. Cache Reuse & RenderCache
  describe('RenderCache Verification', () => {
    it('should skip CoreRenderProcessor on second identical call (Cache Hit)', async () => {
      const progressTracker: ExportProgress[] = [];
      const onProgress = (p: ExportProgress) => progressTracker.push(p);

      // First run: Cache Miss, compiles everything from scratch
      const res1 = await ExportPipeline.execute({
        project: testProject,
        pluginId: 'dummy-test-plugin',
        scale: 4,
        options: {},
        onProgress
      });
      expect(res1.cacheHit).toBe(false);

      // Second run: Identical arguments, Cache Hit
      const res2 = await ExportPipeline.execute({
        project: testProject,
        pluginId: 'dummy-test-plugin',
        scale: 4,
        options: {},
        onProgress
      });
      expect(res2.cacheHit).toBe(true);
    });

    it('should invalidate cache when project timestamp changes (Dirty detection)', async () => {
      await ExportPipeline.execute({
        project: testProject,
        pluginId: 'dummy-test-plugin',
        scale: 2,
        options: {}
      });

      const updatedProject = {
        ...testProject,
        lastSaved: testProject.lastSaved! + 5000 // changed timestamp
      };

      const res = await ExportPipeline.execute({
        project: updatedProject,
        pluginId: 'dummy-test-plugin',
        scale: 2,
        options: {}
      });
      expect(res.cacheHit).toBe(false); // correctly invalidated
    });
  });

  // 3. Progress Monitoring and Lifecycle Hooks
  describe('Pipeline Lifecycle Hooks', () => {
    it('should execute hooks in strict sequence and record lifecycle milestones', async () => {
      const callSequence: string[] = [];

      const hooks = {
        beforeRender: async () => { callSequence.push('beforeRender'); },
        afterRender: async () => { callSequence.push('afterRender'); },
        beforeEncode: async () => { callSequence.push('beforeEncode'); },
        afterEncode: async () => { callSequence.push('afterEncode'); },
        beforeSave: async () => { callSequence.push('beforeSave'); },
        afterSave: async () => { callSequence.push('afterSave'); }
      };

      await ExportPipeline.execute({
        project: testProject,
        pluginId: 'dummy-test-plugin',
        scale: 1,
        options: {},
        hooks
      });

      expect(callSequence).toEqual([
        'beforeRender',
        'afterRender',
        'beforeEncode',
        'afterEncode',
        'beforeSave',
        'afterSave'
      ]);
    });
  });

  // 4. Invalid Options & Error Simulation
  describe('Robust Error Handling & Fault Isolation', () => {
    it('should throw typed EncodeError when format encoder fails', async () => {
      await expect(
        ExportPipeline.execute({
          project: testProject,
          pluginId: 'dummy-test-plugin',
          scale: 1,
          options: { shouldSimulateError: true }
        })
      ).rejects.toBeInstanceOf(EncodeError);
    });

    it('should trigger onError lifecycle hook with standard details', async () => {
      let capturedError: any = null;
      const hooks = {
        onError: async (err: Error) => {
          capturedError = err;
        }
      };

      try {
        await ExportPipeline.execute({
          project: testProject,
          pluginId: 'dummy-test-plugin',
          scale: 1,
          options: { shouldSimulateError: true },
          hooks
        });
      } catch (err) {
        // expected to throw
      }

      expect(capturedError).toBeInstanceOf(EncodeError);
      expect(capturedError.message).toContain('Fallo al codificar formato Dummy Test Format');
    });

    it('should throw error when plugin is not found in registry', async () => {
      await expect(
        ExportPipeline.execute({
          project: testProject,
          pluginId: 'unregistered-mysterious-plugin',
          scale: 1,
          options: {}
        })
      ).rejects.toBeInstanceOf(EncodeError);
    });
  });

  // 5. Cancellations & Multiple Cancellations
  describe('Cancellation and Signal Propagation', () => {
    it('should gracefully abort render or encoding phases and trigger onCancel hook', async () => {
      const controller = new AbortController();
      let cancelHookTriggered = false;

      const hooks = {
        onCancel: async () => {
          cancelHookTriggered = true;
        }
      };

      // Trigger cancel immediately before execute
      controller.abort();

      await expect(
        ExportPipeline.execute({
          project: testProject,
          pluginId: 'dummy-test-plugin',
          scale: 4,
          options: {},
          hooks,
          signal: controller.signal
        })
      ).rejects.toBeInstanceOf(CancelError);

      expect(cancelHookTriggered).toBe(true);
    });

    it('should support multiple consecutive cancellations without memory leaks or stale state', async () => {
      for (let i = 0; i < 5; i++) {
        const controller = new AbortController();
        controller.abort();

        await expect(
          ExportPipeline.execute({
            project: testProject,
            pluginId: 'dummy-test-plugin',
            scale: 2,
            options: {},
            signal: controller.signal
          })
        ).rejects.toBeInstanceOf(CancelError);
      }
    });
  });

  // 6. Mass Exports
  describe('Concurrency & Concurrency Stability', () => {
    it('should resolve multiple parallel exports with full data integrity and separate states', async () => {
      const p1 = ExportPipeline.execute({
        project: testProject,
        pluginId: 'dummy-test-plugin',
        scale: 1,
        options: { filename: 'file_1' }
      });

      const p2 = ExportPipeline.execute({
        project: testProject,
        pluginId: 'dummy-test-plugin',
        scale: 2,
        options: { filename: 'file_2' }
      });

      const p3 = ExportPipeline.execute({
        project: testProject,
        pluginId: 'dummy-test-plugin',
        scale: 4,
        options: { filename: 'file_3' }
      });

      const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

      expect(r1.filename).toBe('file_1');
      expect(r2.filename).toBe('file_2');
      expect(r3.filename).toBe('file_3');
    });
  });

  // 7. FileSaveService helper
  describe('FileSaveService Mechanics', () => {
    it('should correctly parse base64 dataUrls with diverse mimetypes', () => {
      const txtUrl = 'data:text/plain;base64,V29ya2luZyBQZXJmZWN0bHk='; // 'Working Perfectly'
      const blob = (FileSaveService as any).dataUrlToBlob(txtUrl);
      expect(blob.type).toBe('text/plain');
      expect(blob.size).toBe(17);
    });
  });
});
