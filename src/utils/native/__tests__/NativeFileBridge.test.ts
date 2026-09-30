import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NativeFileBridge } from '../NativeFileBridge';
import { saveProject, saveProjectAs } from '../../saveManager';
import { FileSaveService } from '../../export/FileSaveService';
import { PixelProject } from '../../../types';
import { CancelError } from '../../export/ExportErrors';

const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => { 
    mockStorage[key] = value; 
    return true; 
  },
  removeItem: (key: string) => { 
    delete mockStorage[key]; 
    return true; 
  },
  clear: () => { 
    Object.keys(mockStorage).forEach(k => delete mockStorage[k]); 
  }
};

if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    localStorage: localStorageMock,
    isSecureContext: true
  } as any;
}
if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = localStorageMock as any;
}

describe('NativeFileBridge Unit & Integration Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
    delete (window as any).__TAURI__;
    delete (window as any).__TAURI_FILE_BRIDGE__;
  });

  afterEach(() => {
    delete (window as any).__TAURI__;
    delete (window as any).__TAURI_FILE_BRIDGE__;
    vi.restoreAllMocks();
  });

  describe('Bridge Availability Detection', () => {
    it('should return false in standard web environment without globals', () => {
      expect(NativeFileBridge.isAvailable()).toBe(false);
    });

    it('should return true when window.__TAURI__ with dialog/fs is defined', () => {
      (window as any).__TAURI__ = {
        dialog: { save: vi.fn() },
        fs: { writeFile: vi.fn() }
      };
      expect(NativeFileBridge.isAvailable()).toBe(true);
    });

    it('should return true when window.__TAURI_FILE_BRIDGE__ is defined', () => {
      (window as any).__TAURI_FILE_BRIDGE__ = {
        saveFile: vi.fn(),
        promptSavePath: vi.fn()
      };
      expect(NativeFileBridge.isAvailable()).toBe(true);
    });
  });

  describe('Prompting Native Save Path', () => {
    it('should prompt Tauri v2 dialog.save and return chosen path', async () => {
      (window as any).__TAURI__ = {
        dialog: {
          save: vi.fn().mockResolvedValue('/data/user/0/com.onepixel.studio/files/art.onepixel')
        }
      };

      const path = await NativeFileBridge.promptSavePath({
        filename: 'my_artwork',
        extension: 'onepixel'
      });

      expect(path).toBe('/data/user/0/com.onepixel.studio/files/art.onepixel');
      expect((window as any).__TAURI__.dialog.save).toHaveBeenCalledWith(expect.objectContaining({
        defaultPath: 'my_artwork.onepixel',
        filters: expect.arrayContaining([
          expect.objectContaining({ extensions: ['onepixel'] })
        ])
      }));
    });

    it('should return null when user cancels Tauri dialog', async () => {
      (window as any).__TAURI__ = {
        dialog: {
          save: vi.fn().mockResolvedValue(null)
        }
      };

      const path = await NativeFileBridge.promptSavePath({
        filename: 'my_artwork',
        extension: 'onepixel'
      });

      expect(path).toBeNull();
    });
  });

  describe('Saving Files to Disk', () => {
    it('should directly overwrite existingUri with Uint8Array using Tauri v2 fs.writeFile', async () => {
      const writeFileMock = vi.fn().mockResolvedValue(undefined);
      (window as any).__TAURI__ = {
        fs: { writeFile: writeFileMock }
      };

      const dummyBytes = new Uint8Array([1, 2, 3, 4]);
      const res = await NativeFileBridge.saveFile({
        filename: 'art',
        extension: 'png',
        mimeType: 'image/png',
        data: dummyBytes,
        existingUri: '/storage/emulated/0/Download/art.png'
      });

      expect(res.success).toBe(true);
      expect(res.cancelled).toBe(false);
      expect(res.uri).toBe('/storage/emulated/0/Download/art.png');
      expect(writeFileMock).toHaveBeenCalledWith('/storage/emulated/0/Download/art.png', dummyBytes);
    });

    it('should prompt for path if existingUri is not provided', async () => {
      const writeFileMock = vi.fn().mockResolvedValue(undefined);
      (window as any).__TAURI__ = {
        dialog: {
          save: vi.fn().mockResolvedValue('/sdcard/Download/new_sprite.onepixel')
        },
        fs: { writeFile: writeFileMock }
      };

      const res = await NativeFileBridge.saveFile({
        filename: 'new_sprite',
        extension: 'onepixel',
        mimeType: 'application/x-onepixel',
        data: new TextEncoder().encode('{}')
      });

      expect(res.success).toBe(true);
      expect(res.uri).toBe('/sdcard/Download/new_sprite.onepixel');
      expect(writeFileMock).toHaveBeenCalled();
    });

    it('should report cancelled: true when dialog is cancelled', async () => {
      (window as any).__TAURI__ = {
        dialog: {
          save: vi.fn().mockResolvedValue(null)
        },
        fs: { writeFile: vi.fn() }
      };

      const res = await NativeFileBridge.saveFile({
        filename: 'new_sprite',
        extension: 'onepixel',
        mimeType: 'application/x-onepixel',
        data: new Uint8Array()
      });

      expect(res.success).toBe(false);
      expect(res.cancelled).toBe(true);
    });
  });

  describe('saveProject and saveProjectAs Integration with Native Bridge', () => {
    const mockProject: PixelProject = {
      id: 'test-project-123',
      name: 'PixelTest',
      width: 16,
      height: 16,
      layers: [{ id: 'l1', name: 'Layer 1', visible: true, locked: false, opacity: 1 }],
      frames: [{ id: 'f1', name: 'Frame 1', durationMs: 100 }],
      pixels: { f1: { l1: Array(256).fill('#000000') } },
      fps: 12,
      tags: [],
      lastSaved: Date.now(),
      fileFormat: 'onepixel'
    };

    it('should overwrite directly when project has nativeFileUri', async () => {
      const writeFileMock = vi.fn().mockResolvedValue(undefined);
      (window as any).__TAURI__ = {
        fs: { writeFile: writeFileMock },
        dialog: { save: vi.fn() }
      };

      const projectWithNativeUri: PixelProject = {
        ...mockProject,
        nativeFileUri: '/sdcard/Download/PixelTest.onepixel'
      };

      const result = await saveProject(projectWithNativeUri);

      expect(result.success).toBe(true);
      expect(result.savedViaHandle).toBe(true);
      expect(result.nativeFileUri).toBe('/sdcard/Download/PixelTest.onepixel');
      expect((window as any).__TAURI__.dialog.save).not.toHaveBeenCalled();
      expect(writeFileMock).toHaveBeenCalledWith(
        '/sdcard/Download/PixelTest.onepixel',
        expect.any(Uint8Array)
      );
    });

    it('should prompt native dialog on saveProject if no nativeFileUri exists', async () => {
      const writeFileMock = vi.fn().mockResolvedValue(undefined);
      (window as any).__TAURI__ = {
        dialog: {
          save: vi.fn().mockResolvedValue('/sdcard/Download/PixelTest_New.onepixel')
        },
        fs: { writeFile: writeFileMock }
      };

      const result = await saveProject(mockProject);

      expect(result.success).toBe(true);
      expect(result.savedViaHandle).toBe(true);
      expect(result.nativeFileUri).toBe('/sdcard/Download/PixelTest_New.onepixel');
      expect(result.actualName).toBe('PixelTest_New');
      expect(writeFileMock).toHaveBeenCalled();
    });

    it('should return cancelled: true without errors when user cancels native saveProjectAs', async () => {
      (window as any).__TAURI__ = {
        dialog: {
          save: vi.fn().mockResolvedValue(null)
        },
        fs: { writeFile: vi.fn() }
      };

      const result = await saveProjectAs(mockProject, 'PixelTest', 'onepixel');

      expect(result.success).toBe(false);
      expect(result.cancelled).toBe(true);
    });
  });

  describe('FileSaveService Export Integration with Native Bridge', () => {
    it('promptSaveHandle should return { nativeUri, isNative: true } in native environment', async () => {
      (window as any).__TAURI__ = {
        dialog: {
          save: vi.fn().mockResolvedValue('/storage/emulated/0/Download/sprite.png')
        },
        fs: { writeFile: vi.fn() }
      };

      const handle = await FileSaveService.promptSaveHandle('sprite', 'png');
      expect(handle).toEqual({
        nativeUri: '/storage/emulated/0/Download/sprite.png',
        isNative: true
      });
    });

    it('promptSaveHandle should throw CancelError when user cancels in native environment', async () => {
      (window as any).__TAURI__ = {
        dialog: {
          save: vi.fn().mockResolvedValue(null)
        },
        fs: { writeFile: vi.fn() }
      };

      await expect(FileSaveService.promptSaveHandle('sprite', 'png')).rejects.toThrow(CancelError);
    });

    it('FileSaveService.save should write binary data directly to nativeUri', async () => {
      const writeFileMock = vi.fn().mockResolvedValue(undefined);
      (window as any).__TAURI__ = {
        fs: { writeFile: writeFileMock },
        dialog: { save: vi.fn() }
      };

      const preSelected = {
        nativeUri: '/storage/emulated/0/Download/exported_sprite.png',
        isNative: true
      };

      const encodedFile = {
        filename: 'exported_sprite',
        extension: 'png',
        mimeType: 'image/png',
        data: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
      };

      await FileSaveService.save(encodedFile, preSelected);

      expect(writeFileMock).toHaveBeenCalledWith(
        '/storage/emulated/0/Download/exported_sprite.png',
        encodedFile.data
      );
    });
  });
});
