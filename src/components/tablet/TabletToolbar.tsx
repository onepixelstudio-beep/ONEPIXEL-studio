import React, { useState, useRef, useEffect } from 'react';
import { 
  PenTool, Eraser, Square, Circle, 
  PaintBucket, Pipette, Move, Wand2,
  Scaling, Scan, Scissors,
  Spline, Sparkles, Blend, Stamp, CircleDashed,
  Columns, Rows, Grid
} from 'lucide-react';
import { ToolType, SymmetrySettings, TilingSettings } from '../../types';
import { translate, LanguageCode } from '../../i18n';

interface TabletToolbarProps {
  currentTool: ToolType;
  onChangeTool: (tool: ToolType) => void;
  brushSize: number;
  onChangeBrushSize: (size: number) => void;
  symmetry: SymmetrySettings;
  onChangeSymmetry: (settings: SymmetrySettings) => void;
  tiling: TilingSettings;
  onChangeTiling: (settings: TilingSettings) => void;
  language: LanguageCode;
  isLeftHanded?: boolean;
}

const SHAPE_TOOLS: { id: ToolType; icon: any }[] = [
  { id: 'rectangle', icon: Square },
  { id: 'ellipse', icon: Circle },
  { id: 'line', icon: Scaling },
  { id: 'curve', icon: Spline },
];

const FX_TOOLS: { id: ToolType; icon: any }[] = [
  { id: 'spray', icon: Sparkles },
  { id: 'dithering', icon: Blend },
];

const SELECT_TOOLS: { id: ToolType; icon: any }[] = [
  { id: 'rect_select', icon: Scan },
  { id: 'ellipse_select', icon: CircleDashed },
  { id: 'lasso_select', icon: Scissors },
  { id: 'wand', icon: Wand2 },
];

export const TabletToolbar: React.FC<TabletToolbarProps> = React.memo(function TabletToolbar({
  currentTool,
  onChangeTool,
  brushSize,
  onChangeBrushSize,
  symmetry,
  onChangeSymmetry,
  tiling,
  onChangeTiling,
  language,
  isLeftHanded = false
}) {
  const [activeGroup, setActiveGroup] = useState<'shapes' | 'fx' | 'select' | null>(null);
  const [lastSelectedShape, setLastSelectedShape] = useState<ToolType>('rectangle');
  const [lastSelectedFx, setLastSelectedFx] = useState<ToolType>('spray');
  const [lastSelectedSelect, setLastSelectedSelect] = useState<ToolType>('rect_select');

  // Track active tool in groups
  useEffect(() => {
    if (SHAPE_TOOLS.some(t => t.id === currentTool)) {
      setLastSelectedShape(currentTool);
    } else if (FX_TOOLS.some(t => t.id === currentTool)) {
      setLastSelectedFx(currentTool);
    } else if (SELECT_TOOLS.some(t => t.id === currentTool)) {
      setLastSelectedSelect(currentTool);
    }
  }, [currentTool]);

  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setActiveGroup(null);
      }
    };
    if (activeGroup) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [activeGroup]);

  const getToolLabel = (id: ToolType): string => {
    if (id === 'clone_stamp') return translate('toolbar.cloneStamp', language) || 'Sello / Estampa';
    if (id === 'rect_select') return translate('toolbar.rectSelect', language) || 'Sel. Rectangular';
    if (id === 'ellipse_select') return translate('toolbar.ellipseSelect', language) || 'Sel. Elíptica';
    if (id === 'lasso_select') return translate('toolbar.lassoSelect', language) || 'Lazo Libre';
    if (id === 'curve') return translate('toolbar.curve', language) || 'Línea Curva';
    return translate(`toolbar.${id}` as any, language) || id;
  };

  const isShapeActive = SHAPE_TOOLS.some(t => t.id === currentTool);
  const isFxActive = FX_TOOLS.some(t => t.id === currentTool);
  const isSelectActive = SELECT_TOOLS.some(t => t.id === currentTool);

  const activeShapeTool = SHAPE_TOOLS.find(t => t.id === lastSelectedShape) || SHAPE_TOOLS[0];
  const activeFxTool = FX_TOOLS.find(t => t.id === lastSelectedFx) || FX_TOOLS[0];
  const activeSelectTool = SELECT_TOOLS.find(t => t.id === lastSelectedSelect) || SELECT_TOOLS[0];

  return (
    <div 
      className="bg-[#102419] border border-[#1b3d2b] rounded-xl p-1.5 flex flex-col items-center gap-1.5 text-slate-100 shadow-xl select-none h-full overflow-y-auto custom-scrollbar relative w-[58px]"
      id="tablet-editor-toolbar"
    >
      {/* 1. PEN */}
      <button
        onClick={() => { onChangeTool('pen'); setActiveGroup(null); }}
        className={`w-[42px] min-h-[42px] h-[42px] rounded-lg flex items-center justify-center transition-all duration-150 relative cursor-pointer touch-manipulation active:scale-95 ${
          currentTool === 'pen'
            ? 'bg-[#C8A96A] text-[#102419] font-bold shadow-lg shadow-[#C8A96A]/20 ring-2 ring-[#C8A96A]' 
            : 'bg-[#0b1b12] text-slate-300 hover:text-white hover:bg-[#153022] border border-[#1b3d2b]'
        }`}
        title={getToolLabel('pen')}
        aria-label={getToolLabel('pen')}
      >
        <PenTool className="w-5 h-5 shrink-0" />
      </button>

      {/* 2. ERASER */}
      <button
        onClick={() => { onChangeTool('eraser'); setActiveGroup(null); }}
        className={`w-[42px] min-h-[42px] h-[42px] rounded-lg flex items-center justify-center transition-all duration-150 relative cursor-pointer touch-manipulation active:scale-95 ${
          currentTool === 'eraser'
            ? 'bg-[#C8A96A] text-[#102419] font-bold shadow-lg shadow-[#C8A96A]/20 ring-2 ring-[#C8A96A]' 
            : 'bg-[#0b1b12] text-slate-300 hover:text-white hover:bg-[#153022] border border-[#1b3d2b]'
        }`}
        title={getToolLabel('eraser')}
        aria-label={getToolLabel('eraser')}
      >
        <Eraser className="w-5 h-5 shrink-0" />
      </button>

      {/* 3. PICKER */}
      <button
        onClick={() => { onChangeTool('picker'); setActiveGroup(null); }}
        className={`w-[42px] min-h-[42px] h-[42px] rounded-lg flex items-center justify-center transition-all duration-150 relative cursor-pointer touch-manipulation active:scale-95 ${
          currentTool === 'picker'
            ? 'bg-[#C8A96A] text-[#102419] font-bold shadow-lg shadow-[#C8A96A]/20 ring-2 ring-[#C8A96A]' 
            : 'bg-[#0b1b12] text-slate-300 hover:text-white hover:bg-[#153022] border border-[#1b3d2b]'
        }`}
        title={getToolLabel('picker')}
        aria-label={getToolLabel('picker')}
      >
        <Pipette className="w-5 h-5 shrink-0" />
      </button>

      {/* 4. BUCKET */}
      <button
        onClick={() => { onChangeTool('bucket'); setActiveGroup(null); }}
        className={`w-[42px] min-h-[42px] h-[42px] rounded-lg flex items-center justify-center transition-all duration-150 relative cursor-pointer touch-manipulation active:scale-95 ${
          currentTool === 'bucket'
            ? 'bg-[#C8A96A] text-[#102419] font-bold shadow-lg shadow-[#C8A96A]/20 ring-2 ring-[#C8A96A]' 
            : 'bg-[#0b1b12] text-slate-300 hover:text-white hover:bg-[#153022] border border-[#1b3d2b]'
        }`}
        title={getToolLabel('bucket')}
        aria-label={getToolLabel('bucket')}
      >
        <PaintBucket className="w-5 h-5 shrink-0" />
      </button>

      {/* 5. SHAPES GROUP (Rectangle, Ellipse, Line, Curve) */}
      <div className="relative">
        <button
          onClick={() => {
            if (isShapeActive) {
              setActiveGroup(prev => prev === 'shapes' ? null : 'shapes');
            } else {
              onChangeTool(lastSelectedShape);
              setActiveGroup('shapes');
            }
          }}
          className={`w-[42px] min-h-[42px] h-[42px] rounded-lg flex items-center justify-center transition-all duration-150 relative cursor-pointer touch-manipulation active:scale-95 ${
            isShapeActive
              ? 'bg-[#C8A96A] text-[#102419] font-bold shadow-lg shadow-[#C8A96A]/20 ring-2 ring-[#C8A96A]' 
              : 'bg-[#0b1b12] text-slate-300 hover:text-white hover:bg-[#153022] border border-[#1b3d2b]'
          }`}
          title={getToolLabel(activeShapeTool.id)}
          aria-label={getToolLabel(activeShapeTool.id)}
        >
          <activeShapeTool.icon className="w-5 h-5 shrink-0" />
          {/* Subtle indicator dot for group */}
          <span className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ${isShapeActive ? 'bg-[#102419]' : 'bg-[#C8A96A]/80'}`} />
        </button>

        {activeGroup === 'shapes' && (
          <div 
            ref={popoverRef}
            className={`${isLeftHanded ? 'fixed right-[66px]' : 'fixed left-[66px]'} bg-[#102419] border border-[#C8A96A]/50 rounded-xl p-1.5 shadow-2xl z-50 flex flex-col gap-1 min-w-[170px] animate-in fade-in zoom-in-95 duration-100`}
            style={{ top: 'auto' }}
          >
            <span className="text-[9px] uppercase font-bold text-[#C8A96A] px-2 py-0.5 tracking-wider">
              {translate('toolbar.shapes', language) || 'Formas'}
            </span>
            {SHAPE_TOOLS.map(t => {
              const Icon = t.icon;
              const isSelected = currentTool === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    onChangeTool(t.id);
                    setLastSelectedShape(t.id);
                    setActiveGroup(null);
                  }}
                  className={`w-full min-h-[42px] h-[42px] px-3 rounded-lg flex items-center gap-2.5 text-xs font-semibold cursor-pointer transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-[#C8A96A] text-[#102419] font-bold shadow-md'
                      : 'bg-[#0b1b12] text-slate-200 hover:bg-[#153022] hover:text-white border border-[#1b3d2b]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{getToolLabel(t.id)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. FX GROUP (Spray, Dithering) */}
      <div className="relative">
        <button
          onClick={() => {
            if (isFxActive) {
              setActiveGroup(prev => prev === 'fx' ? null : 'fx');
            } else {
              onChangeTool(lastSelectedFx);
              setActiveGroup('fx');
            }
          }}
          className={`w-[42px] min-h-[42px] h-[42px] rounded-lg flex items-center justify-center transition-all duration-150 relative cursor-pointer touch-manipulation active:scale-95 ${
            isFxActive
              ? 'bg-[#C8A96A] text-[#102419] font-bold shadow-lg shadow-[#C8A96A]/20 ring-2 ring-[#C8A96A]' 
              : 'bg-[#0b1b12] text-slate-300 hover:text-white hover:bg-[#153022] border border-[#1b3d2b]'
          }`}
          title={getToolLabel(activeFxTool.id)}
          aria-label={getToolLabel(activeFxTool.id)}
        >
          <activeFxTool.icon className="w-5 h-5 shrink-0" />
          <span className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ${isFxActive ? 'bg-[#102419]' : 'bg-[#C8A96A]/80'}`} />
        </button>

        {activeGroup === 'fx' && (
          <div 
            ref={popoverRef}
            className={`${isLeftHanded ? 'fixed right-[66px]' : 'fixed left-[66px]'} bg-[#102419] border border-[#C8A96A]/50 rounded-xl p-1.5 shadow-2xl z-50 flex flex-col gap-1 min-w-[170px] animate-in fade-in zoom-in-95 duration-100`}
          >
            <span className="text-[9px] uppercase font-bold text-[#C8A96A] px-2 py-0.5 tracking-wider">
              {translate('toolbar.effects', language) || 'Efectos'}
            </span>
            {FX_TOOLS.map(t => {
              const Icon = t.icon;
              const isSelected = currentTool === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    onChangeTool(t.id);
                    setLastSelectedFx(t.id);
                    setActiveGroup(null);
                  }}
                  className={`w-full min-h-[42px] h-[42px] px-3 rounded-lg flex items-center gap-2.5 text-xs font-semibold cursor-pointer transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-[#C8A96A] text-[#102419] font-bold shadow-md'
                      : 'bg-[#0b1b12] text-slate-200 hover:bg-[#153022] hover:text-white border border-[#1b3d2b]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{getToolLabel(t.id)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. CLONE STAMP */}
      <button
        onClick={() => { onChangeTool('clone_stamp'); setActiveGroup(null); }}
        className={`w-[42px] min-h-[42px] h-[42px] rounded-lg flex items-center justify-center transition-all duration-150 relative cursor-pointer touch-manipulation active:scale-95 ${
          currentTool === 'clone_stamp'
            ? 'bg-[#C8A96A] text-[#102419] font-bold shadow-lg shadow-[#C8A96A]/20 ring-2 ring-[#C8A96A]' 
            : 'bg-[#0b1b12] text-slate-300 hover:text-white hover:bg-[#153022] border border-[#1b3d2b]'
        }`}
        title={getToolLabel('clone_stamp')}
        aria-label={getToolLabel('clone_stamp')}
      >
        <Stamp className="w-5 h-5 shrink-0" />
      </button>

      {/* 8. SELECT GROUP (Rect, Ellipse, Lasso, Wand) */}
      <div className="relative">
        <button
          onClick={() => {
            if (isSelectActive) {
              setActiveGroup(prev => prev === 'select' ? null : 'select');
            } else {
              onChangeTool(lastSelectedSelect);
              setActiveGroup('select');
            }
          }}
          className={`w-[42px] min-h-[42px] h-[42px] rounded-lg flex items-center justify-center transition-all duration-150 relative cursor-pointer touch-manipulation active:scale-95 ${
            isSelectActive
              ? 'bg-[#C8A96A] text-[#102419] font-bold shadow-lg shadow-[#C8A96A]/20 ring-2 ring-[#C8A96A]' 
              : 'bg-[#0b1b12] text-slate-300 hover:text-white hover:bg-[#153022] border border-[#1b3d2b]'
          }`}
          title={getToolLabel(activeSelectTool.id)}
          aria-label={getToolLabel(activeSelectTool.id)}
        >
          <activeSelectTool.icon className="w-5 h-5 shrink-0" />
          <span className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ${isSelectActive ? 'bg-[#102419]' : 'bg-[#C8A96A]/80'}`} />
        </button>

        {activeGroup === 'select' && (
          <div 
            ref={popoverRef}
            className={`${isLeftHanded ? 'fixed right-[66px]' : 'fixed left-[66px]'} bg-[#102419] border border-[#C8A96A]/50 rounded-xl p-1.5 shadow-2xl z-50 flex flex-col gap-1 min-w-[170px] animate-in fade-in zoom-in-95 duration-100`}
          >
            <span className="text-[9px] uppercase font-bold text-[#C8A96A] px-2 py-0.5 tracking-wider">
              {translate('headerMenu.seleccion', language) || 'Selección'}
            </span>
            {SELECT_TOOLS.map(t => {
              const Icon = t.icon;
              const isSelected = currentTool === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    onChangeTool(t.id);
                    setLastSelectedSelect(t.id);
                    setActiveGroup(null);
                  }}
                  className={`w-full min-h-[42px] h-[42px] px-3 rounded-lg flex items-center gap-2.5 text-xs font-semibold cursor-pointer transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-[#C8A96A] text-[#102419] font-bold shadow-md'
                      : 'bg-[#0b1b12] text-slate-200 hover:bg-[#153022] hover:text-white border border-[#1b3d2b]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{getToolLabel(t.id)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 9. PAN */}
      <button
        onClick={() => { onChangeTool('pan'); setActiveGroup(null); }}
        className={`w-[42px] min-h-[42px] h-[42px] rounded-lg flex items-center justify-center transition-all duration-150 relative cursor-pointer touch-manipulation active:scale-95 ${
          currentTool === 'pan'
            ? 'bg-[#C8A96A] text-[#102419] font-bold shadow-lg shadow-[#C8A96A]/20 ring-2 ring-[#C8A96A]' 
            : 'bg-[#0b1b12] text-slate-300 hover:text-white hover:bg-[#153022] border border-[#1b3d2b]'
        }`}
        title={getToolLabel('pan')}
        aria-label={getToolLabel('pan')}
      >
        <Move className="w-5 h-5 shrink-0" />
      </button>

      <div className="w-full h-[1px] bg-[#1b3d2b] my-0.5 shrink-0" />

      {/* Quick Brush Sizes (1, 2, 3, 4 px) */}
      <div className="w-full flex flex-col items-center gap-1 shrink-0">
        <span className="text-[8px] uppercase font-bold text-[#C8A96A] tracking-wider leading-none">
          {translate('toolbar.brushSize', language) || 'Px'}
        </span>
        <div className="grid grid-cols-2 gap-1 w-full">
          {[1, 2, 3, 4].map((size) => (
            <button
              key={size}
              onClick={() => onChangeBrushSize(size)}
              className={`w-full min-h-[22px] h-[22px] rounded text-[10px] font-bold font-mono transition cursor-pointer touch-manipulation active:scale-95 flex items-center justify-center ${
                brushSize === size 
                  ? 'bg-[#C8A96A] text-[#102419] font-extrabold shadow-sm' 
                  : 'bg-[#0b1b12] text-slate-300 hover:text-white border border-[#1b3d2b]'
              }`}
              title={`${size}px`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full h-[1px] bg-[#1b3d2b] my-0.5 shrink-0" />

      {/* Quick Symmetry and Tiling toggles */}
      <div className="w-full flex flex-col items-center gap-1 shrink-0">
        <div className="grid grid-cols-2 gap-1 w-full">
          <button
            onClick={() => onChangeSymmetry({ ...symmetry, x: !symmetry.x })}
            className={`w-full min-h-[22px] h-[22px] rounded text-[9px] font-bold transition cursor-pointer touch-manipulation active:scale-95 flex items-center justify-center gap-0.5 ${
              symmetry.x
                ? 'bg-[#C8A96A] text-[#102419] shadow-sm'
                : 'bg-[#0b1b12] text-slate-400 hover:text-slate-200 border border-[#1b3d2b]'
            }`}
            title="Simetría Horizontal (X)"
          >
            <Columns className="w-3 h-3 shrink-0" />
            <span>X</span>
          </button>
          <button
            onClick={() => onChangeSymmetry({ ...symmetry, y: !symmetry.y })}
            className={`w-full min-h-[22px] h-[22px] rounded text-[9px] font-bold transition cursor-pointer touch-manipulation active:scale-95 flex items-center justify-center gap-0.5 ${
              symmetry.y
                ? 'bg-[#C8A96A] text-[#102419] shadow-sm'
                : 'bg-[#0b1b12] text-slate-400 hover:text-slate-200 border border-[#1b3d2b]'
            }`}
            title="Simetría Vertical (Y)"
          >
            <Rows className="w-3 h-3 shrink-0" />
            <span>Y</span>
          </button>
        </div>
        <button
          onClick={() => onChangeTiling({ ...tiling, active: !tiling.active })}
          className={`w-full min-h-[22px] h-[22px] rounded text-[9px] font-bold transition cursor-pointer touch-manipulation active:scale-95 flex items-center justify-center gap-1 ${
            tiling.active
              ? 'bg-[#C8A96A] text-[#102419] shadow-sm'
              : 'bg-[#0b1b12] text-slate-400 hover:text-slate-200 border border-[#1b3d2b]'
          }`}
          title="Modo Mosaico (Tiling)"
        >
          <Grid className="w-3 h-3 shrink-0" />
          <span>Tile</span>
        </button>
      </div>
    </div>
  );
});

