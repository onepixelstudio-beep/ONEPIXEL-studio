import { describe, it, expect } from 'vitest';
import { 
  GuideManager, 
  SnapEngine, 
  calculateRulerStep, 
  GUIDES_RULERS_THEME,
  SnapContext,
  GuidesSnapProvider,
  GridSnapProvider,
  SelectionBoundsSnapProvider,
  SymmetrySnapProvider,
  CanvasBoundsSnapProvider
} from '../guideUtils';
import { Guide } from '../../types';

describe('Guides & Rulers - guideUtils', () => {
  describe('GuideManager', () => {
    it('should create horizontal and vertical guides', () => {
      const guideH = GuideManager.createGuide('horizontal', 10, true);
      const guideV = GuideManager.createGuide('vertical', 20, false);

      expect(guideH.type).toBe('horizontal');
      expect(guideH.position).toBe(10);
      expect(guideH.isProjectLevel).toBe(true);
      expect(guideH.id).toBeDefined();

      expect(guideV.type).toBe('vertical');
      expect(guideV.position).toBe(20);
      expect(guideV.isProjectLevel).toBe(false);
    });

    it('should move a guide correctly', () => {
      const g1 = GuideManager.createGuide('vertical', 15, true);
      const guides = [g1];
      const updated = GuideManager.moveGuide(guides, g1.id, 50);

      expect(updated[0].position).toBe(50);
      expect(updated[0].id).toBe(g1.id);
    });

    it('should remove a guide correctly', () => {
      const g1 = GuideManager.createGuide('vertical', 15, true);
      const g2 = GuideManager.createGuide('horizontal', 30, false);
      const guides = [g1, g2];
      const updated = GuideManager.removeGuide(guides, g1.id);

      expect(updated.length).toBe(1);
      expect(updated[0].id).toBe(g2.id);
    });

    it('should clear guides of a specific level or all', () => {
      const g1 = GuideManager.createGuide('vertical', 15, true);
      const g2 = GuideManager.createGuide('horizontal', 30, false);
      const guides = [g1, g2];

      const clearedProject = GuideManager.clearGuides(guides, 'project');
      expect(clearedProject.length).toBe(1);
      expect(clearedProject[0].id).toBe(g2.id);

      const clearedSession = GuideManager.clearGuides(guides, 'session');
      expect(clearedSession.length).toBe(1);
      expect(clearedSession[0].id).toBe(g1.id);

      const clearedAll = GuideManager.clearGuides(guides, 'all');
      expect(clearedAll.length).toBe(0);
    });

    it('should lock/unlock guides correctly', () => {
      const g1 = GuideManager.createGuide('vertical', 15, true);
      const guides = [g1];
      const lockedGuides = GuideManager.lockGuides(guides, true);
      expect(lockedGuides[0].locked).toBe(true);
    });
  });

  describe('Ruler Step Calculator', () => {
    it('should return correct step for different zooms', () => {
      expect(calculateRulerStep(30)).toBe(2);
      expect(calculateRulerStep(15)).toBe(5);
      expect(calculateRulerStep(8)).toBe(10);
      expect(calculateRulerStep(4)).toBe(20);
      expect(calculateRulerStep(2)).toBe(50);
    });
  });

  describe('SnapEngine & Priorities', () => {
    const defaultCtx: SnapContext = {
      zoom: 10,
      gridSize: 8,
      gridVisible: true,
      guidesVisible: true,
      guides: [
        { id: 'g1', type: 'vertical', position: 12, isProjectLevel: true, locked: false },
        { id: 'g2', type: 'horizontal', position: 18, isProjectLevel: false, locked: false }
      ],
      canvasWidth: 32,
      canvasHeight: 32,
      symmetry: {
        x: true,
        y: true,
        centerX: 16,
        centerY: 16
      },
      selectionBounds: { x: 5, y: 5, width: 10, height: 10 } // X ranges: 5, 10, 15. Y ranges: 5, 10, 15
    };

    it('should bypass snapping completely if altKey is active', () => {
      const engine = new SnapEngine();
      const ctx = { ...defaultCtx, altKey: true };
      const res = engine.snap(12.1, 18.1, ctx, 8);

      expect(res.snapped).toBe(false);
      expect(res.x).toBe(12.1);
      expect(res.y).toBe(18.1);
    });

    it('should snap to Selection (highest priority 10) instead of guides/grid if close to both', () => {
      const engine = new SnapEngine();
      // Test value 15.1 is close to Selection Bound X=15 (dist=0.1)
      // and close to a Guide V or symmetry or grid line (nearest grid is 16, dist=0.9)
      const res = engine.snap(15.1, 5.1, defaultCtx, 8); // toleranceScreenPixels = 8, in canvas = 0.8

      expect(res.snapped).toBe(true);
      expect(res.x).toBe(15); // Snapped to Selection Bound X=15
      expect(res.targets.x).toBe('Borde Derecho Selección');
    });

    it('should snap to Guides (priority 20) over Grid (priority 30)', () => {
      const engine = new SnapEngine();
      // Test V guide is at 12. Grid lines are at multiples of 8 (8, 16, 24).
      // Test value 12.1 is 0.1 from guide 12, and 4.1 from grid 16 or 8.
      // But if we put test value at 16.1 (grid line) vs 16.2 symmetry:
      // Let's verify priority by placing a guide V at 16 (matches grid) and seeing targets.
      const customGuides: Guide[] = [
        { id: 'g3', type: 'vertical', position: 16, isProjectLevel: true, locked: false }
      ];
      const ctx = { ...defaultCtx, guides: customGuides };
      const res = engine.snap(16.05, 16.05, ctx, 8);

      expect(res.snapped).toBe(true);
      expect(res.targets.x).toBe('Guía Proyecto V'); // Snapped to guide instead of grid because priority of guides is 20, grid is 30
    });

    it('should snap to Grid properly', () => {
      const engine = new SnapEngine();
      // X=8.1 should snap to Grid line 8
      const res = engine.snap(8.1, 24.1, defaultCtx, 8);
      expect(res.snapped).toBe(true);
      expect(res.x).toBe(8);
      expect(res.y).toBe(24);
      expect(res.targets.x).toBe('Cuadrícula (8px)');
    });

    it('should snap to Canvas Bounds properly (Priority 50)', () => {
      const engine = new SnapEngine();
      // Close to boundary X=0, with grid visible turned off so it doesn't snap to grid 0
      const ctxWithNoGrid = { ...defaultCtx, gridVisible: false };
      const res = engine.snap(0.05, 31.95, ctxWithNoGrid, 8);
      expect(res.snapped).toBe(true);
      expect(res.x).toBe(0);
      expect(res.y).toBe(32); // Near canvas bottom bounds
      expect(res.targets.x).toBe('Borde Izquierdo Lienzo');
      expect(res.targets.y).toBe('Borde Inferior Lienzo');
    });

    it('should snap to Canvas Center properly (Priority 45)', () => {
      const engine = new SnapEngine();
      // 32x32 canvas, so center is 16. Test value is 16.05, close to 16.
      // Turn off grid and symmetry so it doesn't snap to Grid line 16 or Symmetry axis.
      const ctxWithNoGridOrSymmetry = { ...defaultCtx, gridVisible: false, symmetry: undefined };
      const res = engine.snap(16.05, 16.05, ctxWithNoGridOrSymmetry, 8);
      expect(res.snapped).toBe(true);
      expect(res.x).toBe(16);
      expect(res.y).toBe(16);
      expect(res.targets.x).toBe('Centro del Lienzo V');
      expect(res.targets.y).toBe('Centro del Lienzo H');
    });
  });
});
