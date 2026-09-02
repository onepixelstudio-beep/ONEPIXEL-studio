import { describe, it, expect } from 'vitest';
import { ProjectSerializer } from '../ProjectSerializer';
import { ProjectDeserializer } from '../ProjectDeserializer';
import { PixelProject } from '../../../types';

describe('Project Serialization & Deserialization System (EBA P-2)', () => {
  const dummyProject: PixelProject = {
    id: 'test-project-id-123',
    name: 'Castillo Fantasma',
    width: 64,
    height: 64,
    layers: [
      { id: 'layer-1', name: 'Capa Base', visible: true, opacity: 1, locked: false, blendMode: 'normal' }
    ],
    frames: [
      { id: 'frame-1', name: 'Fotograma 1', durationMs: 150 }
    ],
    pixels: {
      'frame-1': {
        'layer-1': ['#ffffff', '#000000']
      }
    },
    fps: 10,
    tags: ['halloween', 'dark'],
    lastSaved: 1672531199000,
    fileFormat: 'onepixel',
    fileHandle: { someHandle: true } // Volatile property to be removed
  };

  const dummyOptions = {
    symmetry: { x: true, y: false, radial: true, radialCount: 8, centerX: 32, centerY: 32 },
    tiling: { active: true, repeatX: true, repeatY: false },
    referenceImage: 'data:image/png;base64,mockImageData...',
    referenceOpacity: 0.75,
    referenceScale: 1.5,
    customPalette: ['#ff0000', '#00ff00', '#0000ff']
  };

  it('Serializer should correctly serialize project to clean object and strip volatile data', () => {
    // 1. Serialize using explicit options
    const serializedObj = ProjectSerializer.serializeToObj(dummyProject, dummyOptions);

    // Assert fundamental data remains untouched
    expect(serializedObj.id).toBe(dummyProject.id);
    expect(serializedObj.name).toBe(dummyProject.name);
    expect(serializedObj.width).toBe(dummyProject.width);
    expect(serializedObj.height).toBe(dummyProject.height);
    expect(serializedObj.fps).toBe(dummyProject.fps);
    expect(serializedObj.tags).toContain('halloween');

    // Assert workspace settings are integrated
    expect(serializedObj.symmetry?.x).toBe(true);
    expect(serializedObj.symmetry?.radialCount).toBe(8);
    expect(serializedObj.tiling?.repeatY).toBe(false);
    expect(serializedObj.referenceImage).toBe(dummyOptions.referenceImage);
    expect(serializedObj.referenceOpacity).toBe(dummyOptions.referenceOpacity);
    expect(serializedObj.referenceScale).toBe(dummyOptions.referenceScale);
    expect(serializedObj.customPalette).toContain('#ff0000');

    // Assert volatile fileHandle property is stripped
    expect((serializedObj as any).fileHandle).toBeUndefined();
    expect((serializedObj as any).undoStack).toBeUndefined();
    expect((serializedObj as any).redoStack).toBeUndefined();
  });

  it('Serializer should serialize to string correctly', () => {
    const serializedStr = ProjectSerializer.serializeToString(dummyProject, dummyOptions, false);
    expect(typeof serializedStr).toBe('string');
    
    // Parse back using standard JSON to verify string is completely valid
    const parsed = JSON.parse(serializedStr);
    expect(parsed.id).toBe(dummyProject.id);
    expect(parsed.symmetry?.radialCount).toBe(8);
  });

  it('Deserializer should reconstruct complete project structure from string or object', () => {
    const serializedStr = ProjectSerializer.serializeToString(dummyProject, dummyOptions, false);
    
    const result = ProjectDeserializer.deserialize(serializedStr);

    expect(result.project.id).toBe(dummyProject.id);
    expect(result.project.name).toBe(dummyProject.name);
    expect(result.project.width).toBe(64);
    expect(result.project.height).toBe(64);
    expect(result.project.layers.length).toBe(1);
    expect(result.project.frames.length).toBe(1);
    
    expect(result.symmetry.x).toBe(true);
    expect(result.tiling.active).toBe(true);
    expect(result.referenceImage).toBe(dummyOptions.referenceImage);
    expect(result.referenceOpacity).toBe(0.75);
    expect(result.referenceScale).toBe(1.5);
    expect(result.customPalette).toContain('#0000ff');

    // Ensure histories are not restored/copied to project
    expect((result.project as any).undoStack).toBeUndefined();
    expect((result.project as any).redoStack).toBeUndefined();
  });

  it('Deserializer should apply safe defaults on heavily corrupted or empty inputs', () => {
    const corruptedObj = {
      id: 'corrupt-1',
      name: '',
      // width and height are completely missing
      layers: null,
      frames: undefined,
      pixels: 'not-an-object'
    };

    const result = ProjectDeserializer.deserialize(corruptedObj);

    expect(result.project.id).toBe('corrupt-1');
    expect(result.project.name).toBe('Sin Título');
    expect(result.project.width).toBe(32); // Default
    expect(result.project.height).toBe(32); // Default
    expect(result.project.layers.length).toBe(1); // Restored safe default layer
    expect(result.project.frames.length).toBe(1); // Restored safe default frame
    expect(result.project.pixels).toEqual({});
    
    // Workspace defaults
    expect(result.symmetry.x).toBe(false);
    expect(result.tiling.active).toBe(false);
    expect(result.referenceImage).toBeNull();
    expect(result.referenceOpacity).toBe(0.5);
    expect(result.referenceScale).toBe(1.0);
  });

  it('Deserializer should maintain complete backward compatibility with older formats containing undoStack/redoStack', () => {
    // This represents a project saved BEFORE P-1 containing heavy histories
    const legacyProjectWithHistory = {
      id: 'legacy-proj-999',
      name: 'Castillo Antiguo',
      width: 16,
      height: 16,
      layers: [{ id: 'l1', name: 'Base' }],
      frames: [{ id: 'f1' }],
      pixels: {},
      undoStack: [
        { type: 'DRAW', pixels: { 'f1': { 'l1': [] } } },
        { type: 'ERASE', pixels: {} }
      ],
      redoStack: [
        { type: 'COLOR_REPLACE', pixels: {} }
      ],
      symmetry: { x: true, y: true }
    };

    const result = ProjectDeserializer.deserialize(legacyProjectWithHistory);

    expect(result.project.id).toBe('legacy-proj-999');
    expect(result.project.name).toBe('Castillo Antiguo');
    
    // Histories should be completely ignored/dropped from the final loaded project
    expect((result.project as any).undoStack).toBeUndefined();
    expect((result.project as any).redoStack).toBeUndefined();
    
    // Legacy settings must load successfully
    expect(result.symmetry.x).toBe(true);
    expect(result.symmetry.y).toBe(true);
  });
});
