import { describe, it, expect } from 'vitest';
import { LayerResolutionService } from '../LayerResolutionService';
import { PixelProject } from '../../../types';

describe('LayerResolutionService - Static & Animated Layers Parity Suite', () => {
  // Base 2x2 project
  const createBaseProject = (overrides?: Partial<PixelProject>): PixelProject => ({
    id: 'test-proj',
    name: 'Test Project',
    width: 2,
    height: 2,
    fps: 8,
    tags: [],
    frames: [
      { id: 'f1', name: 'Frame 1' },
      { id: 'f2', name: 'Frame 2' },
      { id: 'f3', name: 'Frame 3' },
      { id: 'f4', name: 'Frame 4' },
      { id: 'f5', name: 'Frame 5' },
    ],
    layers: [
      { id: 'layer-bg', name: 'Fondo', isStatic: true, visible: true, locked: false, opacity: 100 },
      { id: 'layer-char', name: 'Personaje', isStatic: false, visible: true, locked: false, opacity: 100 },
    ],
    pixels: {
      f1: {
        'layer-bg': ['#111111', '#111111', '#111111', '#111111'],
        'layer-char': ['#ff0000', '', '', ''],
      },
      f2: {
        'layer-bg': ['', '', '', ''],
        'layer-char': ['', '#ff0000', '', ''],
      },
      f3: {
        'layer-bg': ['', '', '', ''],
        'layer-char': ['', '', '#ff0000', ''],
      },
      f4: {
        'layer-bg': ['', '', '', ''],
        'layer-char': ['', '', '', '#ff0000'],
      },
      f5: {
        'layer-bg': ['', '', '', ''],
        'layer-char': ['#ff0000', '#ff0000', '', ''],
      },
    },
    lastSaved: Date.now(),
    ...overrides,
  });

  it('PRUEBA 1: Fondo estático + personaje 5 frames (Fondo visible in all frames without duplicating arrays)', () => {
    const project = createBaseProject();

    for (const frame of project.frames) {
      const bgEffective = LayerResolutionService.getEffectiveLayerPixels(project, frame.id, 'layer-bg');
      expect(bgEffective).toBeDefined();
      expect(bgEffective?.isStatic).toBe(true);
      expect(bgEffective?.pixels).toEqual(['#111111', '#111111', '#111111', '#111111']);
      expect(bgEffective?.sourceFrameId).toBe('f1');
    }

    // Verify character changes per frame
    const charF1 = LayerResolutionService.getEffectiveLayerPixels(project, 'f1', 'layer-char');
    const charF2 = LayerResolutionService.getEffectiveLayerPixels(project, 'f2', 'layer-char');
    expect(charF1?.pixels).toEqual(['#ff0000', '', '', '']);
    expect(charF2?.pixels).toEqual(['', '#ff0000', '', '']);
  });

  it('PRUEBA 2: Capa 1 y Capa 2 ambas animadas (isStatic=false) cambian independientemente', () => {
    const project = createBaseProject({
      layers: [
        { id: 'layer-1', name: 'L1', isStatic: false, visible: true, locked: false, opacity: 100 },
        { id: 'layer-2', name: 'L2', isStatic: false, visible: true, locked: false, opacity: 100 },
      ],
      pixels: {
        f1: { 'layer-1': ['#aaa', '', '', ''], 'layer-2': ['#111', '', '', ''] },
        f2: { 'layer-1': ['', '#aaa', '', ''], 'layer-2': ['', '#222', '', ''] },
        f3: { 'layer-1': ['', '', '#aaa', ''], 'layer-2': ['', '', '#333', ''] },
      },
    });

    const l1_f2 = LayerResolutionService.getEffectiveLayerPixels(project, 'f2', 'layer-1');
    const l2_f2 = LayerResolutionService.getEffectiveLayerPixels(project, 'f2', 'layer-2');
    expect(l1_f2?.pixels).toEqual(['', '#aaa', '', '']);
    expect(l2_f2?.pixels).toEqual(['', '#222', '', '']);
  });

  it('PRUEBA 3: Fondo estático + 2 capas animadas', () => {
    const project = createBaseProject({
      layers: [
        { id: 'bg', name: 'Fondo', isStatic: true, visible: true, locked: false, opacity: 100 },
        { id: 'anim1', name: 'A1', isStatic: false, visible: true, locked: false, opacity: 100 },
        { id: 'anim2', name: 'A2', isStatic: false, visible: true, locked: false, opacity: 100 },
      ],
      pixels: {
        f1: { bg: ['#000', '#000', '#000', '#000'], anim1: ['#f00', '', '', ''], anim2: ['', '', '#00f', ''] },
        f2: { bg: ['', '', '', ''], anim1: ['', '#f00', '', ''], anim2: ['', '', '', '#00f'] },
        f3: { bg: ['', '', '', ''], anim1: ['', '', '#f00', ''], anim2: ['#00f', '', '', ''] },
      },
    });

    ['f1', 'f2', 'f3'].forEach(fId => {
      const bg = LayerResolutionService.getEffectiveLayerPixels(project, fId, 'bg');
      expect(bg?.pixels).toEqual(['#000', '#000', '#000', '#000']);
      expect(bg?.isStatic).toBe(true);
    });

    expect(LayerResolutionService.getEffectiveLayerPixels(project, 'f2', 'anim1')?.pixels).toEqual(['', '#f00', '', '']);
    expect(LayerResolutionService.getEffectiveLayerPixels(project, 'f2', 'anim2')?.pixels).toEqual(['', '', '', '#00f']);
  });

  it('PRUEBA 4: Frame vacío explícito en capa animada se respeta y NO hereda', () => {
    const project = createBaseProject({
      layers: [
        { id: 'hero', name: 'Hero', isStatic: false, visible: true, locked: false, opacity: 100 },
      ],
      pixels: {
        f1: { hero: ['#f00', '#f00', '', ''] },
        f2: { hero: ['', '', '', ''] }, // Deliberately empty / transparent frame
        f3: { hero: ['#00f', '#00f', '', ''] },
      },
    });

    const f1 = LayerResolutionService.getEffectiveLayerPixels(project, 'f1', 'hero');
    const f2 = LayerResolutionService.getEffectiveLayerPixels(project, 'f2', 'hero');
    const f3 = LayerResolutionService.getEffectiveLayerPixels(project, 'f3', 'hero');

    expect(f1?.pixels).toEqual(['#f00', '#f00', '', '']);
    expect(f2?.pixels).toEqual(['', '', '', '']); // MUST remain empty, not inherit f1
    expect(LayerResolutionService.isPixelArrayEmpty(f2?.pixels)).toBe(true);
    expect(f3?.pixels).toEqual(['#00f', '#00f', '', '']);
  });

  it('PRUEBA 5: No se crean copias de fondo estático al consultar effective frame pixels', () => {
    const project = createBaseProject();
    const effectiveF3 = LayerResolutionService.getEffectiveFramePixels(project, 'f3');

    expect(effectiveF3['layer-bg']).toEqual(['#111111', '#111111', '#111111', '#111111']);
    expect(effectiveF3['layer-char']).toEqual(['', '', '#ff0000', '']);

    // Check that physical project object was not mutated or cloned with duplicate pixel arrays
    expect(project.pixels.f3['layer-bg']).toEqual(['', '', '', '']);
  });
});
