import { describe, it, expect, beforeEach } from 'vitest';
import { CaptureService } from '../resources/CaptureService';
import { LibraryService } from '../resources/LibraryService';
import { StampResource } from '../../types';

// Define a safe mock localStorage behaving exactly like browser Storage
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => { 
    mockStorage[key] = value; 
    (localStorageMock as any)[key] = value;
    return true; 
  },
  removeItem: (key: string) => { 
    delete mockStorage[key]; 
    delete (localStorageMock as any)[key];
    return true; 
  },
  clear: () => { 
    Object.keys(mockStorage).forEach(k => {
      delete mockStorage[k];
      delete (localStorageMock as any)[k];
    }); 
  },
  get length() { return Object.keys(mockStorage).length; },
  key: (index: number) => Object.keys(mockStorage)[index] || null
};

globalThis.window = {
  localStorage: localStorageMock
} as any;
globalThis.localStorage = localStorageMock as any;

describe('Stamp Resources and Capture Mechanics (Bloque 8.1)', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('CaptureService', () => {
    it('should extract correct stamp from selection (Modo A - Exact)', () => {
      // 4x4 canvas
      const width = 4;
      const height = 4;
      
      // Selection covering a 2x2 area in the center: (1,1) to (2,2)
      const selectionPixels = [
        false, false, false, false,
        false, true,  true,  false,
        false, true,  true,  false,
        false, false, false, false
      ];

      // Layer pixels with distinct colors
      const layerPixels = [
        '#000000', '#111111', '#222222', '#333333',
        '#444444', '#555555', '#666666', '#777777',
        '#888888', '#999999', '#aaaaaa', '#bbbbbb',
        '#cccccc', '#dddddd', '#eeeeee', '#ffffff'
      ];

      const stamp = CaptureService.captureSelection(
        selectionPixels,
        layerPixels,
        width,
        height,
        { name: 'My Stamp', tags: ['cool', 'retro'], mode: 'exact' }
      );

      expect(stamp.name).toBe('My Stamp');
      expect(stamp.width).toBe(2);
      expect(stamp.height).toBe(2);
      expect(stamp.tags).toEqual(['cool', 'retro']);
      expect(stamp.version).toBe(1);
      
      // Captured pixels should match the 2x2 central area inside data:
      expect(stamp.data.pixels).toEqual([
        '#555555', '#666666',
        '#999999', '#aaaaaa'
      ]);
    });

    it('should correctly trim bounding box in Modo B (Trimmed)', () => {
      // 4x4 canvas
      const width = 4;
      const height = 4;
      
      // Selection covering 3x3: (1,1) to (3,3)
      const selectionPixels = [
        false, false, false, false,
        false, true,  true,  true,
        false, true,  true,  true,
        false, true,  true,  true
      ];

      // Opaque pixels only at (1,1) and (2,2)
      const layerPixels = [
        '', '', '', '',
        '', '#aaaaaa', '', '',
        '', '', '#bbbbbb', '',
        '', '', '', ''
      ];

      const stamp = CaptureService.captureSelection(
        selectionPixels,
        layerPixels,
        width,
        height,
        { name: 'Trimmed Stamp', tags: [], mode: 'trimmed' }
      );

      // The bounding box of selection was (1,1) to (3,3) (width=3, height=3).
      // But opaque pixels only at (1,1) and (2,2) which forms a 2x2 box: (1,1) to (2,2).
      // So trimmed stamp should have width 2, height 2!
      expect(stamp.width).toBe(2);
      expect(stamp.height).toBe(2);
      expect(stamp.data.pixels).toEqual([
        '#aaaaaa', '',
        '', '#bbbbbb'
      ]);
    });

    it('should throw error for empty selections', () => {
      const selectionPixels = [false, false, false, false];
      const layerPixels = ['', '', '', ''];
      
      expect(() => {
        CaptureService.captureSelection(selectionPixels, layerPixels, 2, 2, { name: 'Empty' });
      }).toThrow('Active selection contains no pixels');
    });
  });

  describe('LibraryService', () => {
    it('should store metadata in index and pixels separately (Lazy Loading)', () => {
      const stamp: StampResource = {
        id: 'stamp_test_123',
        version: 1,
        type: 'stamp',
        name: 'Lazy Test',
        description: '',
        width: 2,
        height: 2,
        createdAt: 1000,
        updatedAt: 1000,
        tags: ['test'],
        pivot: { x: 1, y: 1 },
        preview: '',
        author: 'user',
        origin: { x: 1, y: 1 },
        data: {
          pixels: ['#ff0000', '#00ff00', '#0000ff', '']
        }
      };

      LibraryService.saveStamp(stamp);

      // Verify lightweight Index
      const index = LibraryService.getStampsIndex();
      expect(index.length).toBe(51);
      const found = index.find(item => item.id === 'stamp_test_123');
      expect(found).toBeDefined();
      expect(found!.name).toBe('Lazy Test');
      expect((found as any).pixels).toBeUndefined(); // Pixels must NOT exist in the lightweight index!
      expect((found as any).data).toBeUndefined(); // Heavy data must NOT exist in the index!

      // Verify lazy loaded full stamp
      const loadedStamp = LibraryService.getStamp('stamp_test_123');
      expect(loadedStamp).not.toBeNull();
      expect(loadedStamp!.name).toBe('Lazy Test');
      expect(loadedStamp!.data.pixels).toEqual(['#ff0000', '#00ff00', '#0000ff', '']);
    });

    it('should delete stamps correctly from index and detailed storage', () => {
      const stamp: StampResource = {
        id: 'stamp_test_abc',
        version: 1,
        type: 'stamp',
        name: 'Delete Test',
        description: '',
        width: 1,
        height: 1,
        createdAt: 2000,
        updatedAt: 2000,
        tags: [],
        pivot: { x: 0, y: 0 },
        preview: '',
        author: 'user',
        origin: { x: 0, y: 0 },
        data: {
          pixels: ['#ffffff']
        }
      };

      LibraryService.saveStamp(stamp);
      expect(LibraryService.getStampsIndex().length).toBe(51);

      LibraryService.deleteStamp('stamp_test_abc');
      expect(LibraryService.getStampsIndex().length).toBe(50);
      expect(LibraryService.getStamp('stamp_test_abc')).toBeNull();
    });

    it('should perform migration (migrateAsset) and correctly fill missing fields for legacy/future assets', () => {
      const legacyAsset = {
        id: 'legacy_123',
        name: 'Legacy Stamp',
        width: 2,
        height: 2,
        pixels: ['#000', '#fff', '#aaa', ''],
        origin: { x: 1, y: 1 }
      };

      const migrated = LibraryService.migrateAsset(legacyAsset);

      // Verify all canonical version 1 fields are filled correctly with defaults or derived values
      expect(migrated.id).toBe('legacy_123');
      expect(migrated.version).toBe(1);
      expect(migrated.type).toBe('stamp');
      expect(migrated.name).toBe('Legacy Stamp');
      expect(migrated.description).toBe('');
      expect(migrated.width).toBe(2);
      expect(migrated.height).toBe(2);
      expect(migrated.pivot).toEqual({ x: 1, y: 1 }); // derived from origin
      expect(migrated.preview).toBe('');
      expect(migrated.author).toBe('user');
      expect(migrated.origin).toEqual({ x: 1, y: 1 });
      expect(migrated.data.pixels).toEqual(['#000', '#fff', '#aaa', '']);
    });
  });
});
