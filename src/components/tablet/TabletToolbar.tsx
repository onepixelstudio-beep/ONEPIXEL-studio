import React from 'react';
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
}

export const TabletToolbar: React.FC<TabletToolbarProps> = React.memo(function TabletToolbar({
  currentTool,
  onChangeTool,
  brushSize,
  onChangeBrushSize,
  symmetry,
  onChangeSymmetry,
  tiling,
  onChangeTiling,
  language
}) {
  const tools: { id: ToolType; icon: any; category: 'draw' | 'fill' | 'select' | 'nav' }[] = [
    { id: 'pen', icon: PenTool, category: 'draw' },
    { id: 'eraser', icon: Eraser, category: 'draw' },
    { id: 'picker', icon: Pipette, category: 'fill' },
    { id: 'bucket', icon: PaintBucket, category: 'fill' },
    { id: 'line', icon: Scaling, category: 'draw' },
    { id: 'curve', icon: Spline, category: 'draw' },
    { id: 'rectangle', icon: Square, category: 'draw' },
    { id: 'ellipse', icon: Circle, category: 'draw' },
    { id: 'spray', icon: Sparkles, category: 'draw' },
    { id: 'dithering', icon: Blend, category: 'draw' },
    { id: 'clone_stamp', icon: Stamp, category: 'fill' },
    { id: 'rect_select', icon: Scan, category: 'select' },
    { id: 'ellipse_select', icon: CircleDashed, category: 'select' },
    { id: 'lasso_select', icon: Scissors, category: 'select' },
    { id: 'wand', icon: Wand2, category: 'select' },
    { id: 'pan', icon: Move, category: 'nav' },
  ];

  const getToolLabel = (id: ToolType): string => {
    if (id === 'clone_stamp') return translate('toolbar.cloneStamp', language) || 'Sello / Estampa';
    if (id === 'rect_select') return translate('toolbar.rectSelect', language) || 'Sel. Rectangular';
    if (id === 'ellipse_select') return translate('toolbar.ellipseSelect', language) || 'Sel. Elíptica';
    if (id === 'lasso_select') return translate('toolbar.lassoSelect', language) || 'Lazo Libre';
    return translate(`toolbar.${id}` as any, language) || id;
  };

  return (
    <div 
      className="bg-[#102419] border border-[#1b3d2b] rounded-xl p-1.5 flex flex-col items-center gap-2 text-slate-100 shadow-xl select-none h-full overflow-y-auto custom-scrollbar"
      id="tablet-editor-toolbar"
    >
      {/* Tools Grid - 2 columns of 42px touch targets */}
      <div className="grid grid-cols-2 gap-1.5 w-full">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = currentTool === tool.id;
          const label = getToolLabel(tool.id);
          return (
            <button
              key={tool.id}
              onClick={() => onChangeTool(tool.id)}
              className={`w-full min-h-[42px] h-[42px] rounded-lg flex items-center justify-center transition-all duration-150 relative cursor-pointer touch-manipulation active:scale-95 ${
                isActive 
                  ? 'bg-[#C8A96A] text-[#102419] font-bold shadow-lg shadow-[#C8A96A]/20 ring-2 ring-[#C8A96A]' 
                  : 'bg-[#0b1b12] text-slate-300 hover:text-white hover:bg-[#153022] border border-[#1b3d2b]'
              }`}
              title={label}
              aria-label={label}
            >
              <Icon className="w-5 h-5 shrink-0" />
            </button>
          );
        })}
      </div>

      <div className="w-full h-[1px] bg-[#1b3d2b] my-0.5 shrink-0" />

      {/* Quick Brush Sizes (1, 2, 3, 4 px) */}
      <div className="w-full flex flex-col items-center gap-1 shrink-0">
        <span className="text-[9px] uppercase font-bold text-[#C8A96A] tracking-wider">
          {translate('toolbar.brushSize', language) || 'Pincel'}
        </span>
        <div className="grid grid-cols-2 gap-1 w-full">
          {[1, 2, 3, 4].map((size) => (
            <button
              key={size}
              onClick={() => onChangeBrushSize(size)}
              className={`min-h-[34px] h-[34px] rounded-md text-[11px] font-bold font-mono transition cursor-pointer touch-manipulation active:scale-95 flex items-center justify-center ${
                brushSize === size 
                  ? 'bg-[#C8A96A] text-[#102419] font-extrabold shadow-md' 
                  : 'bg-[#0b1b12] text-slate-300 hover:text-white border border-[#1b3d2b]'
              }`}
              title={`${size}px`}
            >
              {size}p
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
            className={`min-h-[34px] h-[34px] rounded-md text-[10px] font-bold transition cursor-pointer touch-manipulation active:scale-95 flex items-center justify-center gap-1 ${
              symmetry.x
                ? 'bg-[#C8A96A] text-[#102419] shadow-md'
                : 'bg-[#0b1b12] text-slate-400 hover:text-slate-200 border border-[#1b3d2b]'
            }`}
            title="Simetría Horizontal (X)"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>X</span>
          </button>
          <button
            onClick={() => onChangeSymmetry({ ...symmetry, y: !symmetry.y })}
            className={`min-h-[34px] h-[34px] rounded-md text-[10px] font-bold transition cursor-pointer touch-manipulation active:scale-95 flex items-center justify-center gap-1 ${
              symmetry.y
                ? 'bg-[#C8A96A] text-[#102419] shadow-md'
                : 'bg-[#0b1b12] text-slate-400 hover:text-slate-200 border border-[#1b3d2b]'
            }`}
            title="Simetría Vertical (Y)"
          >
            <Rows className="w-3.5 h-3.5" />
            <span>Y</span>
          </button>
        </div>
        <button
          onClick={() => onChangeTiling({ ...tiling, active: !tiling.active })}
          className={`w-full min-h-[32px] h-[32px] rounded-md text-[10px] font-bold transition cursor-pointer touch-manipulation active:scale-95 flex items-center justify-center gap-1.5 ${
            tiling.active
              ? 'bg-[#C8A96A] text-[#102419] shadow-md'
              : 'bg-[#0b1b12] text-slate-400 hover:text-slate-200 border border-[#1b3d2b]'
          }`}
          title="Modo Mosaico (Tiling)"
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Tiling</span>
        </button>
      </div>
    </div>
  );
});
