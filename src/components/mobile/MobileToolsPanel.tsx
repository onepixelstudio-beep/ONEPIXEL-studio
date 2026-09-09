import React, { useState } from 'react';
import { 
  PenTool, Eraser, PaintBucket, Pipette, Move, Scan, 
  CircleDashed, Scissors, Wand2, Spline, Square, Circle,
  Sparkles, Check, Blend, Stamp, Columns, Rows, Sliders, ChevronDown
} from 'lucide-react';
import { ToolType, SymmetrySettings, TilingSettings, LanguageCode } from '../../types';
import { translate } from '../../i18n';

export interface MobileToolsPanelProps {
  currentTool: ToolType;
  onChangeTool: (tool: ToolType) => void;
  brushSize: number;
  onChangeBrushSize: (size: number) => void;
  pixelPerfect?: boolean;
  onChangePixelPerfect?: (val: boolean) => void;
  symmetry?: SymmetrySettings;
  onChangeSymmetry?: (s: SymmetrySettings) => void;
  tiling?: TilingSettings;
  onChangeTiling?: (t: TilingSettings) => void;
  isLandscape?: boolean;
  language: LanguageCode;
  onClose?: () => void;
}

export const MobileToolsPanel: React.FC<MobileToolsPanelProps> = React.memo(function MobileToolsPanel({
  currentTool,
  onChangeTool,
  brushSize,
  onChangeBrushSize,
  pixelPerfect = false,
  onChangePixelPerfect,
  symmetry,
  onChangeSymmetry,
  tiling,
  onChangeTiling,
  isLandscape = false,
  language,
  onClose
}) {
  const [subCategory, setSubCategory] = useState<'secondary' | 'shapes' | 'selection' | 'assistants'>('secondary');

  const handleSelectTool = (toolId: ToolType) => {
    onChangeTool(toolId);
    onClose?.();
  };

  // Primary Tools (The Core 6)
  const primaryTools: { id: ToolType; icon: any; label: string }[] = [
    { id: 'pen', icon: PenTool, label: translate('toolbar.pen', language) || 'Lápiz' },
    { id: 'eraser', icon: Eraser, label: translate('toolbar.eraser', language) || 'Borrador' },
    { id: 'bucket', icon: PaintBucket, label: translate('toolbar.bucket', language) || 'Relleno' },
    { id: 'picker', icon: Pipette, label: translate('toolbar.picker', language) || 'Gotero' },
    { id: 'rect_select', icon: Scan, label: translate('toolbar.select', language) || 'Selección' },
    { id: 'pan', icon: Move, label: translate('toolbar.pan', language) || 'Mover' },
  ];

  // Secondary Tools (Creative FX)
  const secondaryTools: { id: ToolType; icon: any; label: string; desc: string }[] = [
    { id: 'spray', icon: Sparkles, label: 'Aerógrafo', desc: 'Dispersión de píxeles' },
    { id: 'dithering', icon: Blend, label: 'Entramado', desc: 'Tramas retro dither' },
    { id: 'clone_stamp', icon: Stamp, label: 'Tampón', desc: 'Clonado de regiones' },
  ];

  // Shape Tools
  const shapeTools: { id: ToolType; icon: any; label: string }[] = [
    { id: 'line', icon: Spline, label: 'Línea' },
    { id: 'curve', icon: Spline, label: 'Curva' },
    { id: 'rectangle', icon: Square, label: 'Rectángulo' },
    { id: 'ellipse', icon: Circle, label: 'Elipse' },
  ];

  // Advanced Selection Tools
  const selectionTools: { id: ToolType; icon: any; label: string }[] = [
    { id: 'rect_select', icon: Scan, label: 'Marco Rectangular' },
    { id: 'ellipse_select', icon: CircleDashed, label: 'Marco Elíptico' },
    { id: 'lasso_select', icon: Scissors, label: 'Lazo Libre' },
    { id: 'wand', icon: Wand2, label: 'Varita Mágica' },
  ];

  // Quick brush presets
  const brushPresets = [1, 2, 3, 4, 8, 16];

  return (
    <div className={`w-full flex flex-col gap-3 select-none ${isLandscape ? 'max-h-[82vh]' : ''}`} id="mobile-tools-panel-redesign">
      
      {/* ----------------------------------------------------
          1. PRIMARY TOOLS DOCK (MINIMALIST FLOATING BAR)
         ---------------------------------------------------- */}
      <div className="bg-black/40 backdrop-blur-md p-2 rounded-3xl border border-white/10 flex flex-col gap-1.5 shadow-xl">
        <div className="flex items-center justify-between px-2 pt-0.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#C8A96A]">
            Herramientas Principales
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {primaryTools.find(t => t.id === currentTool)?.label || 'Avanzada'}
          </span>
        </div>

        {/* Primary Icons Dock: Clean outline icons with golden highlight on active */}
        <div className="grid grid-cols-6 gap-1.5 pt-1">
          {primaryTools.map((tool) => {
            const Icon = tool.icon;
            const isSelected = currentTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => handleSelectTool(tool.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 active:scale-90 touch-manipulation cursor-pointer ${
                  isSelected
                    ? 'bg-[#C8A96A]/20 text-[#C8A96A] border border-[#C8A96A] shadow-[0_0_16px_rgba(200,169,106,0.35)] ring-1 ring-[#C8A96A]/40 font-bold scale-[1.03]'
                    : 'bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 border border-white/5'
                }`}
                title={tool.label}
              >
                <Icon className={`w-5 h-5 stroke-[1.8] mb-1 transition-transform ${isSelected ? 'scale-110 drop-shadow-[0_0_6px_rgba(200,169,106,0.8)]' : ''}`} />
                <span className="text-[10px] truncate max-w-full font-medium leading-none">
                  {tool.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ----------------------------------------------------
          2. BRUSH SIZE MINIMALIST SLIDER & DOT PREVIEW
         ---------------------------------------------------- */}
      <div className="bg-black/30 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex flex-col gap-2 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">Grosor de Pincel</span>
            <span className="font-mono text-xs font-black text-[#C8A96A] bg-[#C8A96A]/10 px-2 py-0.5 rounded-full border border-[#C8A96A]/30">
              {brushSize}px
            </span>
          </div>

          {/* Dynamic live dot preview */}
          <div className="w-6 h-6 flex items-center justify-center shrink-0">
            <div 
              className="rounded-full bg-[#C8A96A] shadow-[0_0_8px_rgba(200,169,106,0.6)] transition-all duration-150"
              style={{
                width: `${Math.min(24, Math.max(3, brushSize * 1.5))}px`,
                height: `${Math.min(24, Math.max(3, brushSize * 1.5))}px`
              }}
            />
          </div>
        </div>

        {/* Tactile Slider */}
        <input
          type="range"
          min="1"
          max="32"
          value={brushSize}
          onChange={(e) => onChangeBrushSize(Number(e.target.value))}
          className="w-full accent-[#C8A96A] h-2 bg-slate-800 rounded-lg cursor-pointer"
        />

        {/* Quick Size Preset Pills */}
        <div className="flex items-center justify-between gap-1 pt-1">
          {brushPresets.map((size) => {
            const isSelected = brushSize === size;
            return (
              <button
                key={size}
                onClick={() => onChangeBrushSize(size)}
                className={`flex-1 py-1 rounded-xl text-[11px] font-mono font-bold transition-all active:scale-95 touch-manipulation cursor-pointer border ${
                  isSelected
                    ? 'bg-[#C8A96A] text-[#102419] border-[#C8A96A] shadow-xs'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white border-white/5'
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* ----------------------------------------------------
          3. SECONDARY TOOLS, SHAPES & PIXEL ASSISTANTS DRAWER
         ---------------------------------------------------- */}
      <div className="bg-black/30 backdrop-blur-md rounded-3xl p-3 border border-white/10 flex flex-col gap-2.5 shadow-md">
        
        {/* Navigation Segments */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setSubCategory('secondary')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 touch-manipulation cursor-pointer ${
              subCategory === 'secondary'
                ? 'bg-[#C8A96A] text-[#102419] shadow-sm font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Efectos FX
          </button>

          <button
            onClick={() => setSubCategory('shapes')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 touch-manipulation cursor-pointer ${
              subCategory === 'shapes'
                ? 'bg-[#C8A96A] text-[#102419] shadow-sm font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Formas
          </button>

          <button
            onClick={() => setSubCategory('selection')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 touch-manipulation cursor-pointer ${
              subCategory === 'selection'
                ? 'bg-[#C8A96A] text-[#102419] shadow-sm font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Selección
          </button>

          <button
            onClick={() => setSubCategory('assistants')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 touch-manipulation cursor-pointer ${
              subCategory === 'assistants'
                ? 'bg-[#C8A96A] text-[#102419] shadow-sm font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Modos
          </button>
        </div>

        {/* TAB A: EFECTOS FX (Spray, Dithering, Clonar) */}
        {subCategory === 'secondary' && (
          <div className="grid grid-cols-3 gap-2">
            {secondaryTools.map((tool) => {
              const Icon = tool.icon;
              const isSelected = currentTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => handleSelectTool(tool.id)}
                  className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-150 active:scale-95 touch-manipulation cursor-pointer border ${
                    isSelected
                      ? 'bg-[#C8A96A]/20 text-[#C8A96A] border-[#C8A96A] shadow-[0_0_14px_rgba(200,169,106,0.3)] ring-1 ring-[#C8A96A]/40'
                      : 'bg-white/[0.03] text-slate-300 hover:text-white border-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5 stroke-[1.8]" />
                  <span className="text-xs font-bold">{tool.label}</span>
                  <span className="text-[9px] text-slate-500 text-center leading-tight">
                    {tool.desc}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* TAB B: FORMAS GEOMÉTRICAS (Línea, Curva, Rectángulo, Elipse) */}
        {subCategory === 'shapes' && (
          <div className="grid grid-cols-2 gap-2">
            {shapeTools.map((tool) => {
              const Icon = tool.icon;
              const isSelected = currentTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => handleSelectTool(tool.id)}
                  className={`min-h-[44px] px-3 rounded-2xl flex items-center gap-2.5 transition-all duration-150 active:scale-95 touch-manipulation cursor-pointer border ${
                    isSelected
                      ? 'bg-[#C8A96A]/20 text-[#C8A96A] border-[#C8A96A] shadow-[0_0_14px_rgba(200,169,106,0.3)] font-bold'
                      : 'bg-white/[0.03] text-slate-300 hover:text-white border-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[1.8]" />
                  <span className="text-xs font-semibold">{tool.label}</span>
                  {isSelected && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-[#C8A96A] shadow-[0_0_6px_rgba(200,169,106,0.8)]" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* TAB C: SELECCIÓN AVANZADA */}
        {subCategory === 'selection' && (
          <div className="grid grid-cols-2 gap-2">
            {selectionTools.map((tool) => {
              const Icon = tool.icon;
              const isSelected = currentTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => handleSelectTool(tool.id)}
                  className={`min-h-[44px] px-3 rounded-2xl flex items-center gap-2.5 transition-all duration-150 active:scale-95 touch-manipulation cursor-pointer border ${
                    isSelected
                      ? 'bg-[#C8A96A]/20 text-[#C8A96A] border-[#C8A96A] shadow-[0_0_14px_rgba(200,169,106,0.3)] font-bold'
                      : 'bg-white/[0.03] text-slate-300 hover:text-white border-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[1.8]" />
                  <span className="text-xs font-semibold truncate">{tool.label}</span>
                  {isSelected && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-[#C8A96A] shadow-[0_0_6px_rgba(200,169,106,0.8)]" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* TAB D: MODOS & ASISTENTES PIXEL */}
        {subCategory === 'assistants' && (
          <div className="flex flex-col gap-2">
            
            {/* Pixel-Perfect Toggle */}
            {onChangePixelPerfect && (
              <button
                onClick={() => onChangePixelPerfect(!pixelPerfect)}
                className={`min-h-[44px] px-3 py-2 rounded-2xl flex items-center justify-between border transition-all active:scale-98 touch-manipulation cursor-pointer ${
                  pixelPerfect
                    ? 'bg-[#C8A96A]/20 text-[#C8A96A] border-[#C8A96A] shadow-[0_0_12px_rgba(200,169,106,0.25)]'
                    : 'bg-white/[0.03] text-slate-300 border-white/5'
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold">Pixel-Perfect</span>
                  <span className="text-[10px] text-slate-400">Suprime esquinas dobles en trazos</span>
                </div>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                  pixelPerfect ? 'bg-[#C8A96A] border-[#C8A96A] text-[#102419]' : 'border-slate-600'
                }`}>
                  {pixelPerfect && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            )}

            {/* Symmetry Controls */}
            {symmetry && onChangeSymmetry && (
              <div className="bg-white/[0.02] p-2.5 rounded-2xl border border-white/5 flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-slate-400">Simetría en Espejo</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => onChangeSymmetry({ ...symmetry, x: !symmetry.x })}
                    className={`min-h-[38px] rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition active:scale-95 touch-manipulation cursor-pointer ${
                      symmetry.x
                        ? 'bg-[#C8A96A] text-[#102419] border-[#C8A96A] shadow-xs'
                        : 'bg-white/[0.04] text-slate-400 border-white/5'
                    }`}
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span>Eje X</span>
                  </button>

                  <button
                    onClick={() => onChangeSymmetry({ ...symmetry, y: !symmetry.y })}
                    className={`min-h-[38px] rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition active:scale-95 touch-manipulation cursor-pointer ${
                      symmetry.y
                        ? 'bg-[#C8A96A] text-[#102419] border-[#C8A96A] shadow-xs'
                        : 'bg-white/[0.04] text-slate-400 border-white/5'
                    }`}
                  >
                    <Rows className="w-3.5 h-3.5" />
                    <span>Eje Y</span>
                  </button>

                  <button
                    onClick={() => onChangeSymmetry({ ...symmetry, radial: !symmetry.radial })}
                    className={`min-h-[38px] rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition active:scale-95 touch-manipulation cursor-pointer ${
                      symmetry.radial
                        ? 'bg-[#C8A96A] text-[#102419] border-[#C8A96A] shadow-xs'
                        : 'bg-white/[0.04] text-slate-400 border-white/5'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Radial</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tiling Mode */}
            {tiling && onChangeTiling && (
              <button
                onClick={() => onChangeTiling({ ...tiling, active: !tiling.active })}
                className={`min-h-[44px] px-3 py-2 rounded-2xl flex items-center justify-between border transition-all active:scale-98 touch-manipulation cursor-pointer ${
                  tiling.active
                    ? 'bg-[#C8A96A]/20 text-[#C8A96A] border-[#C8A96A] shadow-[0_0_12px_rgba(200,169,106,0.25)]'
                    : 'bg-white/[0.03] text-slate-300 border-white/5'
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold">Modo Patrón Repetible (Tiling)</span>
                  <span className="text-[10px] text-slate-400">Previsualiza texturas sin costuras en tiempo real</span>
                </div>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                  tiling.active ? 'bg-[#C8A96A] border-[#C8A96A] text-[#102419]' : 'border-slate-600'
                }`}>
                  {tiling.active && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            )}

          </div>
        )}

      </div>

    </div>
  );
});

export default MobileToolsPanel;
