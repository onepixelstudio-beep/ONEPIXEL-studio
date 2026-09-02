import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportPluginRegistry } from '../ExportPluginRegistry';
import { RenderCache } from '../RenderCache';
import { FileSaveService } from '../FileSaveService';
import {
  ExportPlugin,
  RenderResult,
  ExportCapabilities,
  ExportOptionSchema,
  ExportProgress,
  EncodedFile,
  EncoderContext,
} from '../ExportTypes';
import { PixelProject } from '../../../types';

describe('Phase 9.1: Advanced Export Pipeline Architecture (EBA Compliance)', () => {
  let registry: ExportPluginRegistry;

  const mockProject: PixelProject = {
    id: 'test-proj-id',
    name: 'Nebula Pixel',
    width: 8,
    height: 8,
    fps: 12,
    tags: [],
    frames: [{ id: 'f1', name: 'Frame 1', durationMs: 100 }],
    layers: [{ id: 'l1', name: 'Base', visible: true, opacity: 100, locked: false }],
    pixels: {
      'f1': {
        'l1': ['#ff0000', '#00ff00'],
      },
    },
    lastSaved: 1000, // Fixed timestamp
  };

  const mockPalette = ['#ff0000', '#00ff00'];

  const mockStatistics = {
    renderTimeMs: 5,
    framesRendered: 1,
    layersMerged: 1,
    pixelsProcessed: 64,
    pixelsWritten: 64,
    pixelsDiscarded: 0,
    scaleApplied: 4,
    cacheHit: false,
    cacheMiss: true,
  };

  const mockWarnings: any[] = [];

  const mockCapabilities: ExportCapabilities = {
    supportsAnimation: true,
    supportsLayers: false,
    supportsPalette: true,
    supportsTransparency: true,
    supportsQuality: false,
    supportsPivot: false,
    supportsMetadata: true,
  };

  const mockOptionsSchema: ExportOptionSchema = [
    { id: 'quality', label: 'Quality', type: 'number', defaultValue: 90, min: 1, max: 100 },
    { id: 'includeMetadata', label: 'Include Metadata', type: 'boolean', defaultValue: true },
  ];

  class StubPngPlugin implements ExportPlugin {
    id = 'stub-png';
    name = 'Stub PNG';
    desc = 'Stub PNG Export Plugin';
    category = 'image' as const;
    icon = 'FileImage';
    extension = 'png';
    capabilities = mockCapabilities;

    getOptionsSchema(): ExportOptionSchema {
      return mockOptionsSchema;
    }

    async encode(context: EncoderContext): Promise<EncodedFile> {
      const { renderResult, signal, onProgress } = context;
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      onProgress?.({ stage: 'encoding_format', message: 'Encoding Frame 1', percentage: 50 });

      return {
        filename: renderResult.projectName,
        extension: this.extension,
        data: new Uint8Array([1, 2, 3]),
        mimeType: 'image/png',
      };
    }
  }

  beforeEach(() => {
    registry = new ExportPluginRegistry();
    RenderCache.invalidate();
  });

  describe('ExportPluginRegistry', () => {
    it('should register and retrieve plugins correctly', () => {
      const plugin = new StubPngPlugin();
      registry.register(plugin);

      expect(registry.get('stub-png')).toBe(plugin);
      expect(registry.getAll()).toHaveLength(1);
    });

    it('should filter registered plugins by category', () => {
      const plugin = new StubPngPlugin();
      registry.register(plugin);

      const imagePlugins = registry.getByCategory('image');
      const gamePlugins = registry.getByCategory('game');

      expect(imagePlugins).toHaveLength(1);
      expect(imagePlugins[0].id).toBe('stub-png');
      expect(gamePlugins).toHaveLength(0);
    });

    it('should unregister plugins safely', () => {
      const plugin = new StubPngPlugin();
      registry.register(plugin);
      expect(registry.get('stub-png')).toBe(plugin);

      const deleted = registry.unregister('stub-png');
      expect(deleted).toBe(true);
      expect(registry.get('stub-png')).toBeUndefined();
    });
  });

  describe('RenderCache', () => {
    it('should compute identical signatures for identical configurations', () => {
      const sig1 = RenderCache.getSignature(mockProject, 4);
      const sig2 = RenderCache.getSignature(mockProject, 4);
      expect(sig1).toBe(sig2);
    });

    it('should invalidate cache when project timestamp changes', () => {
      const sig1 = RenderCache.getSignature(mockProject, 4);
      const updatedProject = { ...mockProject, lastSaved: 2000 };
      const sig2 = RenderCache.getSignature(updatedProject, 4);
      expect(sig1).not.toBe(sig2);
    });

    it('should invalidate cache when scale changes', () => {
      const sig1 = RenderCache.getSignature(mockProject, 4);
      const sig2 = RenderCache.getSignature(mockProject, 8);
      expect(sig1).not.toBe(sig2);
    });

    it('should invalidate cache when layer visibility changes', () => {
      const sig1 = RenderCache.getSignature(mockProject, 4);
      const modifiedProject = {
        ...mockProject,
        layers: [{ id: 'l1', name: 'Base', visible: false, opacity: 100, locked: false }],
      };
      const sig2 = RenderCache.getSignature(modifiedProject, 4);
      expect(sig1).not.toBe(sig2);
    });

    it('should store and retrieve RenderResult objects correctly', () => {
      const mockResult: RenderResult = {
        projectId: mockProject.id,
        projectName: mockProject.name,
        width: mockProject.width,
        height: mockProject.height,
        scale: 4,
        frames: [],
        palette: mockPalette,
        statistics: mockStatistics,
        warnings: mockWarnings,
      };

      RenderCache.set(mockProject, 4, mockResult);
      const retrieved = RenderCache.get(mockProject, 4);
      expect(retrieved).toBe(mockResult);

      const wrongScale = RenderCache.get(mockProject, 8);
      expect(wrongScale).toBeNull();
    });
  });

  describe('FileSaveService helper and plugin encoding', () => {
    it('should encode results and report progress correctly', async () => {
      const plugin = new StubPngPlugin();
      const mockResult: RenderResult = {
        projectId: mockProject.id,
        projectName: mockProject.name,
        width: mockProject.width,
        height: mockProject.height,
        scale: 4,
        frames: [],
        palette: mockPalette,
        statistics: mockStatistics,
        warnings: mockWarnings,
      };

      const progressSpy = vi.fn();
      const file = await plugin.encode({
        renderResult: mockResult,
        options: {},
        onProgress: progressSpy,
        statistics: { startTime: performance.now() },
        logger: {
          info: () => {},
          warn: () => {},
          error: () => {},
        }
      });

      expect(file.filename).toBe('Nebula Pixel');
      expect(file.extension).toBe('png');
      expect(file.data).toBeInstanceOf(Uint8Array);
      expect(progressSpy).toHaveBeenCalledWith({
        stage: 'encoding_format',
        message: 'Encoding Frame 1',
        percentage: 50,
      });
    });

    it('should throw AbortError when cancellation signal is triggered', async () => {
      const plugin = new StubPngPlugin();
      const mockResult: RenderResult = {
        projectId: mockProject.id,
        projectName: mockProject.name,
        width: mockProject.width,
        height: mockProject.height,
        scale: 4,
        frames: [],
        palette: mockPalette,
        statistics: mockStatistics,
        warnings: mockWarnings,
      };

      const controller = new AbortController();
      controller.abort();

      await expect(
        plugin.encode({
          renderResult: mockResult,
          options: {},
          signal: controller.signal,
          statistics: { startTime: performance.now() },
          logger: {
            info: () => {},
            warn: () => {},
            error: () => {},
          }
        })
      ).rejects.toThrow('Aborted');
    });

    it('should parse base64 correctly using dataUrlToBlob converter helper', () => {
      const base64DataUrl = 'data:image/png;base64,SGVsbG8='; // 'Hello' in Base64
      // Use internal helper of FileSaveService by casting or invoking
      const blob = (FileSaveService as any).dataUrlToBlob(base64DataUrl);
      expect(blob.type).toBe('image/png');
      expect(blob.size).toBe(5);
    });
  });
});
