import React, { useState } from 'react';
import { 
  PenTool, Eraser, PaintBucket, Pipette, Move, Scan, 
  CircleDashed, Scissors, Wand2, Spline, Square, Circle,
  Sparkles, Check, Blend, Stamp, Columns, Rows, RotateCw,
  FlipHorizontal, FlipVertical, X, FolderOpen, Plus, Minus
} from 'lucide-react';
import { ToolType, SymmetrySettings, TilingSettings, LanguageCode } from '../../types';
import { translate } from '../../i18n';
import { 
  MOBILE_PRESET_BRUSHES, 
  MOBILE_SPRAY_SHAPES, 
  MOBILE_DITHERING_PATTERNS,
  PresetBrush
} from './mobileToolData';

export interface MobileToolsPanelProps {
  currentTool: ToolType;
  onChangeTool: (tool: ToolType) => void;
  brushSize: number;
  onChangeBrushSize: (size: number) => void;
  pixelPerfect?: boolean;
  onChangePixelPerfect?: (val: boolean) => void;
  activeBrush?: any;
  onChangeActiveBrush?: (brush: any) => void;
  sprayDensity?: number;
  onChangeSprayDensity?: (val: number) => void;
  sprayRandomness?: number;
  onChangeSprayRandomness?: (val: number) => void;
  sprayShape?: 'round' | 'square' | 'cross' | 'star';
  onChangeSprayShape?: (shape: 'round' | 'square' | 'cross' | 'star') => void;
  ditheringPattern?: 'checkerboard' | 'bayer' | '25%' | '50%' | '75%' | 'lines' | 'cross' | 'noise';
  onChangeDitheringPattern?: (pat: 'checkerboard' | 'bayer' | '25%' | '50%' | '75%' | 'lines' | 'cross' | 'noise') => void;
  cloneSource?: { x: number; y: number } | null;
  onChangeCloneSource?: (src: { x: number; y: number } | null) => void;
  isSelectingCloneSource?: boolean;
  onStartSelectCloneSource?: () => void;
  bucketContiguous?: boolean;
  onChangeBucketContiguous?: (val: boolean) => void;
  bucketRefer?: 'active' | 'all';
  onChangeBucketRefer?: (val: 'active' | 'all') => void;
  tolerance?: number;
  onChangeTolerance?: (val: number) => void;
  fillShape?: boolean;
  onChangeFillShape?: (val: boolean) => void;
  symmetry?: SymmetrySettings;
  onChangeSymmetry?: (s: SymmetrySettings) => void;
  tiling?: TilingSettings;
  onChangeTiling?: (t: TilingSettings) => void;
  selectionActive?: boolean;
  onClearSelection?: () => void;
  onInvertSelection?: () => void;
  onSaveAsStamp?: () => void;
  onOpenAssetLibrary?: () => void;
  activeStamp?: { pixels: string[]; width: number; height: number; name: string } | null;
  onClearActiveStamp?: () => void;
  stampScale?: number;
  onChangeStampScale?: (scale: number | ((prev: number) => number)) => void;
  stampRotation?: number;
  onChangeStampRotation?: (rot: number | ((prev: number) => number)) => void;
  stampFlipH?: boolean;
  onChangeStampFlipH?: (flip: boolean | ((prev: boolean) => boolean)) => void;
  stampFlipV?: boolean;
  onChangeStampFlipV?: (flip: boolean | ((prev: boolean) => boolean)) => void;
  patternMode?: 'stamp' | 'pattern';
  onChangePatternMode?: (mode: 'stamp' | 'pattern') => void;
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
  activeBrush,
  onChangeActiveBrush,
  sprayDensity = 15,
  onChangeSprayDensity,
  sprayRandomness = 4,
  onChangeSprayRandomness,
  sprayShape = 'round',
  onChangeSprayShape,
  ditheringPattern = 'checkerboard',
  onChangeDitheringPattern,
  cloneSource,
  onChangeCloneSource,
  isSelectingCloneSource = false,
  onStartSelectCloneSource,
  bucketContiguous = true,
  onChangeBucketContiguous,
  bucketRefer = 'active',
  onChangeBucketRefer,
  tolerance = 0,
  onChangeTolerance,
  fillShape = false,
  onChangeFillShape,
  symmetry,
  onChangeSymmetry,
  tiling,
  onChangeTiling,
  selectionActive = false,
  onClearSelection,
  onInvertSelection,
  onSaveAsStamp,
  onOpenAssetLibrary,
  activeStamp,
  onClearActiveStamp,
  stampScale = 1,
  onChangeStampScale,
  stampRotation = 0,
  onChangeStampRotation,
  stampFlipH = false,
  onChangeStampFlipH,
  stampFlipV = false,
  onChangeStampFlipV,
  patternMode = 'stamp',
  onChangePatternMode,
  isLandscape = false,
  language,
  onClose
}) {
  const [subCategory, setSubCategory] = useState<'secondary' | 'shapes' | 'selection' | 'assistants'>(
    ['spray', 'dithering', 'clone_stamp'].includes(currentTool) ? 'secondary' :
    ['line', 'curve', 'rectangle', 'ellipse'].includes(currentTool) ? 'shapes' :
    ['rect_select', 'ellipse_select', 'lasso_select', 'wand'].includes(currentTool) ? 'selection' :
    'secondary'
  );

  const brushPresets = [1, 2, 3, 4, 8, 16];

  // Tool categories
  const primaryTools: { id: ToolType; icon: any; label: string }[] = [
    { id: 'pen', icon: PenTool, label: translate('toolbar.pen', language) || 'Lápiz' },
    { id: 'eraser', icon: Eraser, label: translate('toolbar.eraser', language) || 'Borrador' },
    { id: 'bucket', icon: PaintBucket, label: translate('toolbar.bucket', language) || 'Relleno' },
    { id: 'picker', icon: Pipette, label: translate('toolbar.picker', language) || 'Gotero' },
    { id: 'rect_select', icon: Scan, label: translate('toolbar.select', language) || 'Selección' },
    { id: 'pan', icon: Move, label: translate('toolbar.pan', language) || 'Mover' },
  ];

  const secondaryTools: { id: ToolType; icon: any; label: string; desc: string }[] = [
    { id: 'spray', icon: Sparkles, label: 'Aerógrafo', desc: 'Dispersión de píxeles' },
    { id: 'dithering', icon: Blend, label: 'Entramado', desc: 'Tramas retro dither' },
    { id: 'clone_stamp', icon: Stamp, label: 'Tampón', desc: 'Clonado de regiones' },
  ];

  const shapeTools: { id: ToolType; icon: any; label: string }[] = [
    { id: 'line', icon: Spline, label: 'Línea' },
    { id: 'curve', icon: Spline, label: 'Curva' },
    { id: 'rectangle', icon: Square, label: 'Rectángulo' },
    { id: 'ellipse', icon: Circle, label: 'Elipse' },
  ];

  const selectionTools: { id: ToolType; icon: any; label: string }[] = [
    { id: 'rect_select', icon: Scan, label: 'Marco Rectangular' },
    { id: 'ellipse_select', icon: CircleDashed, label: 'Marco Elíptico' },
    { id: 'lasso_select', icon: Scissors, label: 'Lazo Libre' },
    { id: 'wand', icon: Wand2, label: 'Varita Mágica' },
  ];

  const getToolDisplayName = (tool: ToolType): string => {
    switch (tool) {
      case 'pen': return translate('toolbar.pen', language) || 'Lápiz';
      case 'eraser': return translate('toolbar.eraser', language) || 'Borrador';
      case 'bucket': return translate('toolbar.bucket', language) || 'Relleno';
      case 'picker': return translate('toolbar.picker', language) || 'Gotero';
      case 'spray': return 'Aerógrafo (Spray)';
      case 'dithering': return 'Entramado (Dithering)';
      case 'clone_stamp': return 'Tampón de Clonar';
      case 'line': return 'Línea';
      case 'curve': return 'Curva';
      case 'rectangle': return 'Rectángulo';
      case 'ellipse': return 'Elipse';
      case 'rect_select': return 'Marco Rectangular';
      case 'ellipse_select': return 'Marco Elíptico';
      case 'lasso_select': return 'Lazo Libre';
      case 'wand': return 'Varita Mágica';
      case 'pan': return translate('toolbar.pan', language) || 'Mover Lienzo';
      default: return tool;
    }
  };

  const handleSelectPresetBrush = (preset: PresetBrush) => {
    if (activeBrush?.id === preset.id) {
      onChangeActiveBrush?.(null);
    } else {
      onChangeActiveBrush?.(preset);
      onChangeBrushSize(preset.size);
    }
  };

  return (
    <div className={`w-full flex flex-col gap-3 select-none pb-4 ${isLandscape ? 'max-h-[82dvh]' : ''}`} id="mobile-tools-panel-redesign">

      {/* ------------------------------------------------------------------ */}
      {/* 0. ACTIVE STAMP / SPRITE BANNER (IF A STAMP IS ACTIVE)             */}
      {/* ------------------------------------------------------------------ */}
      {activeStamp && (
        <div className="bg-[#C8A96A]/15 border border-[#C8A96A]/50 rounded-2xl p-3 flex flex-col gap-2 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stamp className="w-4 h-4 text-[#C8A96A]" />
              <span className="text-xs font-bold text-[#C8A96A] uppercase tracking-wider">
                Sello Activo:
              </span>
              <span className="text-xs font-bold text-white max-w-[140px] truncate">
                {activeStamp.name || 'Sprite'}
              </span>
            </div>
            {onClearActiveStamp && (
              <button
                onClick={onClearActiveStamp}
                className="px-2 py-0.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-bold active:scale-95 transition"
              >
                Desactivar
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {/* Stamp Mode: Single vs Tiled */}
            {onChangePatternMode && (
              <div className="flex items-center bg-black/40 rounded-xl p-0.5 border border-white/10">
                <button
                  onClick={() => onChangePatternMode('stamp')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                    patternMode === 'stamp' ? 'bg-[#C8A96A] text-[#102419]' : 'text-slate-400'
                  }`}
                >
                  Único
                </button>
                <button
                  onClick={() => onChangePatternMode('pattern')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                    patternMode === 'pattern' ? 'bg-[#C8A96A] text-[#102419]' : 'text-slate-400'
                  }`}
                >
                  Patrón
                </button>
              </div>
            )}

            {/* Stamp Scale Controls */}
            {onChangeStampScale && (
              <div className="flex items-center gap-1 bg-black/40 rounded-xl px-1.5 py-0.5 border border-white/10">
                <button
                  onClick={() => onChangeStampScale(Math.max(1, stampScale - 1))}
                  className="w-6 h-6 rounded-lg bg-white/5 text-slate-300 flex items-center justify-center active:scale-90"
                  title="Reducir escala"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-[11px] font-mono font-bold text-[#C8A96A] px-1">
                  {stampScale}x
                </span>
                <button
                  onClick={() => onChangeStampScale(Math.min(8, stampScale + 1))}
                  className="w-6 h-6 rounded-lg bg-white/5 text-slate-300 flex items-center justify-center active:scale-90"
                  title="Aumentar escala"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Rotation & Flips */}
            {onChangeStampRotation && (
              <button
                onClick={() => onChangeStampRotation(((stampRotation || 0) + 90) % 360)}
                className="p-1.5 rounded-xl bg-black/40 text-slate-300 hover:text-white border border-white/10 active:scale-90 transition"
                title="Rotar 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            )}

            {onChangeStampFlipH && (
              <button
                onClick={() => onChangeStampFlipH(!stampFlipH)}
                className={`p-1.5 rounded-xl border transition active:scale-90 ${
                  stampFlipH ? 'bg-[#C8A96A] text-[#102419] border-[#C8A96A]' : 'bg-black/40 text-slate-300 border-white/10'
                }`}
                title="Voltear horizontal"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
              </button>
            )}

            {onChangeStampFlipV && (
              <button
                onClick={() => onChangeStampFlipV(!stampFlipV)}
                className={`p-1.5 rounded-xl border transition active:scale-90 ${
                  stampFlipV ? 'bg-[#C8A96A] text-[#102419] border-[#C8A96A]' : 'bg-black/40 text-slate-300 border-white/10'
                }`}
                title="Voltear vertical"
              >
                <FlipVertical className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 1. DYNAMIC TOOL OPTIONS (ESPECÍFICAS PARA LA HERRAMIENTA ACTIVA)     */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-gradient-to-b from-black/60 to-black/40 backdrop-blur-md p-3 rounded-3xl border border-[#C8A96A]/30 flex flex-col gap-2.5 shadow-xl">
        
        {/* Active Tool Header Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#C8A96A]">
              Ajustes: {getToolDisplayName(currentTool)}
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="px-2.5 py-1 rounded-xl bg-[#C8A96A] text-[#102419] text-[10px] font-black flex items-center gap-1 active:scale-95 transition shadow-sm"
              title="Volver al lienzo"
            >
              <Check className="w-3 h-3 stroke-[3]" />
              <span>Listo</span>
            </button>
          )}
        </div>

        {/* --- OPTION SET A: PEN & ERASER --- */}
        {(currentTool === 'pen' || currentTool === 'eraser') && (
          <div className="flex flex-col gap-2.5 pt-0.5">
            {/* Brush Size Slider & Dot Preview */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">Grosor de Pincel</span>
                  <span className="font-mono text-xs font-black text-[#C8A96A] bg-[#C8A96A]/10 px-2 py-0.5 rounded-full border border-[#C8A96A]/30">
                    {brushSize}px
                  </span>
                </div>
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
              <input
                type="range"
                min="1"
                max="32"
                value={brushSize}
                onChange={(e) => onChangeBrushSize(Number(e.target.value))}
                className="w-full accent-[#C8A96A] h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex items-center justify-between gap-1 pt-0.5">
                {brushPresets.map((size) => (
                  <button
                    key={size}
                    onClick={() => onChangeBrushSize(size)}
                    className={`flex-1 py-1 rounded-xl text-[11px] font-mono font-bold transition-all active:scale-95 touch-manipulation cursor-pointer border ${
                      brushSize === size
                        ? 'bg-[#C8A96A] text-[#102419] border-[#C8A96A] shadow-xs'
                        : 'bg-white/[0.04] text-slate-400 hover:text-white border-white/5'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Pixel-Perfect Toggle for Pen */}
            {currentTool === 'pen' && onChangePixelPerfect && (
              <button
                onClick={() => onChangePixelPerfect(!pixelPerfect)}
                className={`min-h-[40px] px-3 py-1.5 rounded-2xl flex items-center justify-between border transition-all active:scale-98 touch-manipulation cursor-pointer ${
                  pixelPerfect
                    ? 'bg-[#C8A96A]/20 text-[#C8A96A] border-[#C8A96A] shadow-[0_0_12px_rgba(200,169,106,0.25)]'
                    : 'bg-white/[0.03] text-slate-300 border-white/5'
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold">Pixel-Perfect</span>
                  <span className="text-[9.5px] text-slate-400">Suprime esquinas dobles en trazos rápidos</span>
                </div>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                  pixelPerfect ? 'bg-[#C8A96A] border-[#C8A96A] text-[#102419]' : 'border-slate-600'
                }`}>
                  {pixelPerfect && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            )}

            {/* Brush Presets (Shapes) */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Pinceles y Formas de Trazo
              </span>
              <div className="grid grid-cols-5 gap-1.5">
                {MOBILE_PRESET_BRUSHES.map((preset) => {
                  const isSelected = activeBrush?.id === preset.id;
                  const maxDim = preset.pixels.length;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPresetBrush(preset)}
                      className={`h-11 rounded-xl flex flex-col items-center justify-center p-1 border transition-all active:scale-95 touch-manipulation cursor-pointer ${
                        isSelected
                          ? 'bg-[#C8A96A] text-[#102419] border-[#C8A96A] font-bold shadow-md'
                          : 'bg-white/[0.04] text-slate-300 hover:text-white border-white/10'
                      }`}
                      title={preset.id}
                    >
                      <div 
                        className="grid gap-[1px]"
                        style={{
                          gridTemplateColumns: `repeat(${preset.pixels[0]?.length || 1}, minmax(0, 1fr))`
                        }}
                      >
                        {preset.pixels.map((row, rIdx) =>
                          row.map((cell, cIdx) => (
                            <div
                              key={`${rIdx}-${cIdx}`}
                              className={`w-1.5 h-1.5 rounded-[0.5px] ${
                                cell 
                                  ? (isSelected ? 'bg-[#102419]' : 'bg-[#C8A96A]') 
                                  : 'bg-transparent'
                              }`}
                            />
                          ))
                        )}
                      </div>
                      <span className="text-[8.5px] font-bold mt-1 truncate max-w-full">
                        {preset.size}px
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* --- OPTION SET B: SPRAY (AERÓGRAFO) --- */}
        {currentTool === 'spray' && (
          <div className="flex flex-col gap-2.5 pt-0.5">
            {/* Brush size for spray */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Radio del Aerosol</span>
                <span className="font-mono text-xs font-black text-[#C8A96A] bg-[#C8A96A]/10 px-2 py-0.5 rounded-full border border-[#C8A96A]/30">
                  {brushSize}px
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="32"
                value={brushSize}
                onChange={(e) => onChangeBrushSize(Number(e.target.value))}
                className="w-full accent-[#C8A96A] h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Spray Density Slider */}
            {onChangeSprayDensity && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Densidad (Gotas)</span>
                  <span className="font-mono text-xs font-black text-[#C8A96A] bg-[#C8A96A]/10 px-2 py-0.5 rounded-full border border-[#C8A96A]/30">
                    {sprayDensity}
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={sprayDensity}
                  onChange={(e) => onChangeSprayDensity(Number(e.target.value))}
                  className="w-full accent-[#C8A96A] h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            )}

            {/* Spray Randomness / Dispersion */}
            {onChangeSprayRandomness && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Dispersión</span>
                  <span className="font-mono text-xs font-black text-[#C8A96A] bg-[#C8A96A]/10 px-2 py-0.5 rounded-full border border-[#C8A96A]/30">
                    {sprayRandomness}
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="12"
                  value={sprayRandomness}
                  onChange={(e) => onChangeSprayRandomness(Number(e.target.value))}
                  className="w-full accent-[#C8A96A] h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            )}

            {/* Spray Shape Picker */}
            {onChangeSprayShape && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Forma de Difusión
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {MOBILE_SPRAY_SHAPES.map((shape) => {
                    const isSelected = sprayShape === shape.id;
                    return (
                      <button
                        key={shape.id}
                        onClick={() => onChangeSprayShape(shape.id)}
                        className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 border transition active:scale-95 touch-manipulation cursor-pointer ${
                          isSelected
                            ? 'bg-[#C8A96A] text-[#102419] border-[#C8A96A] font-bold shadow-md'
                            : 'bg-white/[0.04] text-slate-300 hover:text-white border-white/10'
                        }`}
                      >
                        <div className="w-5 h-5 flex items-center justify-center">
                          <div className="grid grid-cols-8 gap-[0.5px]">
                            {shape.pixels.slice(1, 7).map((row, rIdx) =>
                              row.slice(1, 7).map((cell, cIdx) => (
                                <div
                                  key={`${rIdx}-${cIdx}`}
                                  className={`w-[2px] h-[2px] rounded-[0.2px] ${
                                    cell 
                                      ? (isSelected ? 'bg-[#102419]' : 'bg-[#C8A96A]') 
                                      : 'bg-transparent'
                                  }`}
                                />
                              ))
                            )}
                          </div>
                        </div>
                        <span className="text-[9px] font-bold capitalize">{shape.id}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- OPTION SET C: DITHERING (ENTRAMADO) --- */}
        {currentTool === 'dithering' && (
          <div className="flex flex-col gap-2.5 pt-0.5">
            {/* Brush size for dithering */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Grosor de Entramado</span>
                <span className="font-mono text-xs font-black text-[#C8A96A] bg-[#C8A96A]/10 px-2 py-0.5 rounded-full border border-[#C8A96A]/30">
                  {brushSize}px
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="32"
                value={brushSize}
                onChange={(e) => onChangeBrushSize(Number(e.target.value))}
                className="w-full accent-[#C8A96A] h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Dithering Pattern Picker */}
            {onChangeDitheringPattern && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Patrón de Trama Retro
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {MOBILE_DITHERING_PATTERNS.map((pattern) => {
                    const isSelected = ditheringPattern === pattern.id;
                    return (
                      <button
                        key={pattern.id}
                        onClick={() => onChangeDitheringPattern(pattern.id)}
                        className={`py-1.5 px-1 rounded-xl flex flex-col items-center justify-center gap-1 border transition active:scale-95 touch-manipulation cursor-pointer ${
                          isSelected
                            ? 'bg-[#C8A96A] text-[#102419] border-[#C8A96A] font-bold shadow-md'
                            : 'bg-white/[0.04] text-slate-300 hover:text-white border-white/10'
                        }`}
                      >
                        <div className="w-5 h-5 flex items-center justify-center">
                          <div className="grid grid-cols-6 gap-[0.5px]">
                            {pattern.pixels.slice(0, 6).map((row, rIdx) =>
                              row.slice(0, 6).map((cell, cIdx) => (
                                <div
                                  key={`${rIdx}-${cIdx}`}
                                  className={`w-[2px] h-[2px] rounded-[0.2px] ${
                                    cell 
                                      ? (isSelected ? 'bg-[#102419]' : 'bg-[#C8A96A]') 
                                      : 'bg-transparent'
                                  }`}
                                />
                              ))
                            )}
                          </div>
                        </div>
                        <span className="text-[8.5px] font-bold truncate max-w-full capitalize">
                          {pattern.id}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- OPTION SET D: BUCKET & WAND (RELLENO Y VARITA) --- */}
        {(currentTool === 'bucket' || currentTool === 'wand') && (
          <div className="flex flex-col gap-2.5 pt-0.5">
            {/* Tolerance Slider */}
            {onChangeTolerance && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Tolerancia de Color</span>
                  <span className="font-mono text-xs font-black text-[#C8A96A] bg-[#C8A96A]/10 px-2 py-0.5 rounded-full border border-[#C8A96A]/30">
                    {tolerance}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={tolerance}
                  onChange={(e) => onChangeTolerance(Number(e.target.value))}
                  className="w-full accent-[#C8A96A] h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-[9px] text-slate-400">
                  0 = Solo color idéntico; mayor valor = tolera tonos similares
                </span>
              </div>
            )}

            {/* Contiguous Toggle */}
            {onChangeBucketContiguous && (
              <div className="flex items-center justify-between p-2 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-200">Modo Contiguo</span>
                  <span className="text-[9.5px] text-slate-400">
                    {bucketContiguous ? 'Solo píxeles conectados' : 'Rellena todos los píxeles idénticos'}
                  </span>
                </div>
                <div className="flex items-center bg-black/50 p-0.5 rounded-xl border border-white/10">
                  <button
                    onClick={() => onChangeBucketContiguous(true)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                      bucketContiguous ? 'bg-[#C8A96A] text-[#102419]' : 'text-slate-400'
                    }`}
                  >
                    Contiguo
                  </button>
                  <button
                    onClick={() => onChangeBucketContiguous(false)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                      !bucketContiguous ? 'bg-[#C8A96A] text-[#102419]' : 'text-slate-400'
                    }`}
                  >
                    Global
                  </button>
                </div>
              </div>
            )}

            {/* Reference Layer */}
            {onChangeBucketRefer && (
              <div className="flex items-center justify-between p-2 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-200">Capa de Referencia</span>
                  <span className="text-[9.5px] text-slate-400">
                    {bucketRefer === 'active' ? 'Solo capa actual' : 'Muestreo visible de todas las capas'}
                  </span>
                </div>
                <div className="flex items-center bg-black/50 p-0.5 rounded-xl border border-white/10">
                  <button
                    onClick={() => onChangeBucketRefer('active')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                      bucketRefer === 'active' ? 'bg-[#C8A96A] text-[#102419]' : 'text-slate-400'
                    }`}
                  >
                    Capa Activa
                  </button>
                  <button
                    onClick={() => onChangeBucketRefer('all')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                      bucketRefer === 'all' ? 'bg-[#C8A96A] text-[#102419]' : 'text-slate-400'
                    }`}
                  >
                    Todas
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- OPTION SET E: GEOMETRIC SHAPES (LÍNEA, CURVA, RECTÁNGULO, ELIPSE) --- */}
        {(currentTool === 'line' || currentTool === 'curve' || currentTool === 'rectangle' || currentTool === 'ellipse') && (
          <div className="flex flex-col gap-2.5 pt-0.5">
            {/* Stroke size */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Grosor de Trazo</span>
                <span className="font-mono text-xs font-black text-[#C8A96A] bg-[#C8A96A]/10 px-2 py-0.5 rounded-full border border-[#C8A96A]/30">
                  {brushSize}px
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="32"
                value={brushSize}
                onChange={(e) => onChangeBrushSize(Number(e.target.value))}
                className="w-full accent-[#C8A96A] h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Shape Fill Toggle (Rectangle and Ellipse) */}
            {(currentTool === 'rectangle' || currentTool === 'ellipse') && onChangeFillShape && (
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-200">Relleno de Forma</span>
                  <span className="text-[9.5px] text-slate-400">
                    {fillShape ? 'Rellena el interior de la figura' : 'Solo dibuja el borde exterior'}
                  </span>
                </div>
                <div className="flex items-center bg-black/50 p-0.5 rounded-xl border border-white/10">
                  <button
                    onClick={() => onChangeFillShape(false)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition ${
                      !fillShape ? 'bg-[#C8A96A] text-[#102419]' : 'text-slate-400'
                    }`}
                  >
                    Contorno
                  </button>
                  <button
                    onClick={() => onChangeFillShape(true)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition ${
                      fillShape ? 'bg-[#C8A96A] text-[#102419]' : 'text-slate-400'
                    }`}
                  >
                    Relleno
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- OPTION SET F: CLONE STAMP (TAMPÓN DE CLONAR) --- */}
        {currentTool === 'clone_stamp' && (
          <div className="flex flex-col gap-2.5 pt-0.5">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Tamaño del Tampón</span>
                <span className="font-mono text-xs font-black text-[#C8A96A] bg-[#C8A96A]/10 px-2 py-0.5 rounded-full border border-[#C8A96A]/30">
                  {brushSize}px
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="32"
                value={brushSize}
                onChange={(e) => onChangeBrushSize(Number(e.target.value))}
                className="w-full accent-[#C8A96A] h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Clone Source Information & Reset */}
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">Origen de Clonado</span>
                {cloneSource && onChangeCloneSource && (
                  <button
                    onClick={() => onChangeCloneSource(null)}
                    className="px-2 py-0.5 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-bold active:scale-95 transition"
                  >
                    Limpiar Origen
                  </button>
                )}
              </div>

              {/* Fijar Origen Tactile Touch Button */}
              {onStartSelectCloneSource && (
                <button
                  type="button"
                  onClick={onStartSelectCloneSource}
                  className={`w-full min-h-[44px] px-3 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition active:scale-95 touch-manipulation cursor-pointer ${
                    isSelectingCloneSource
                      ? 'bg-[#C8A96A] text-[#102419] border-[#C8A96A] shadow-md animate-pulse'
                      : 'bg-[#102419] hover:bg-[#152e20] text-[#C8A96A] border-[#C8A96A]/40 shadow-sm'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current animate-ping" />
                  <span>{isSelectingCloneSource ? 'Toca el lienzo para fijar origen...' : 'Fijar Origen (Tocar lienzo)'}</span>
                </button>
              )}

              {cloneSource ? (
                <div className="flex items-center gap-2 bg-black/40 px-2.5 py-1.5 rounded-xl border border-white/5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-[#C8A96A]">
                    X: {cloneSource.x}, Y: {cloneSource.y}
                  </span>
                  <span className="text-[10px] text-emerald-400/90 ml-auto font-semibold">Fijado</span>
                </div>
              ) : (
                <span className="text-[10px] text-amber-400/90 italic">
                  Pulsa "Fijar Origen" y luego toca la posición del lienzo que deseas clonar.
                </span>
              )}
            </div>
          </div>
        )}

        {/* --- OPTION SET G: SELECTION TOOLS & ACTIVE SELECTION ACTIONS --- */}
        {(['rect_select', 'ellipse_select', 'lasso_select', 'wand'].includes(currentTool) || selectionActive) && (
          <div className="flex flex-col gap-2 pt-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Acciones de Selección
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {onClearSelection && (
                <button
                  onClick={onClearSelection}
                  disabled={!selectionActive}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition active:scale-95 ${
                    selectionActive
                      ? 'bg-red-500/20 text-red-300 border-red-500/40 cursor-pointer'
                      : 'bg-white/[0.02] text-slate-600 border-white/5 cursor-not-allowed'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Deseleccionar</span>
                </button>
              )}

              {onInvertSelection && (
                <button
                  onClick={onInvertSelection}
                  disabled={!selectionActive}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition active:scale-95 ${
                    selectionActive
                      ? 'bg-[#C8A96A]/20 text-[#C8A96A] border-[#C8A96A]/50 cursor-pointer'
                      : 'bg-white/[0.02] text-slate-600 border-white/5 cursor-not-allowed'
                  }`}
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span>Invertir</span>
                </button>
              )}

              {onSaveAsStamp && (
                <button
                  onClick={() => {
                    onSaveAsStamp();
                    onClose?.();
                  }}
                  disabled={!selectionActive}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition active:scale-95 ${
                    selectionActive
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 cursor-pointer'
                      : 'bg-white/[0.02] text-slate-600 border-white/5 cursor-not-allowed'
                  }`}
                >
                  <Stamp className="w-3.5 h-3.5" />
                  <span>Crear Sello</span>
                </button>
              )}

              {onOpenAssetLibrary && (
                <button
                  onClick={() => {
                    onOpenAssetLibrary();
                    onClose?.();
                  }}
                  className="py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-white/[0.04] text-slate-300 hover:text-white border border-white/10 active:scale-95 transition cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-[#C8A96A]" />
                  <span>Biblioteca Sprites</span>
                </button>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. PRIMARY TOOLS GRID (THE CORE 6)                                 */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-black/40 backdrop-blur-md p-2.5 rounded-3xl border border-white/10 flex flex-col gap-1.5 shadow-xl">
        <div className="flex items-center justify-between px-2 pt-0.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#C8A96A]">
            Herramientas Principales
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {primaryTools.find(t => t.id === currentTool)?.label || 'Avanzada'}
          </span>
        </div>

        <div className="grid grid-cols-6 gap-1.5 pt-1">
          {primaryTools.map((tool) => {
            const Icon = tool.icon;
            const isSelected = currentTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => onChangeTool(tool.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 active:scale-90 touch-manipulation cursor-pointer ${
                  isSelected
                    ? 'bg-[#C8A96A]/25 text-[#C8A96A] border border-[#C8A96A] shadow-[0_0_16px_rgba(200,169,106,0.35)] ring-1 ring-[#C8A96A]/40 font-bold scale-[1.03]'
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

      {/* ------------------------------------------------------------------ */}
      {/* 3. SECONDARY TOOLS, SHAPES & PIXEL ASSISTANTS DRAWER               */}
      {/* ------------------------------------------------------------------ */}
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
                  onClick={() => onChangeTool(tool.id)}
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
                  onClick={() => onChangeTool(tool.id)}
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
                  onClick={() => onChangeTool(tool.id)}
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

      {/* ------------------------------------------------------------------ */}
      {/* 4. TACTILE "VOLVER AL LIENZO" ACTION BUTTON                        */}
      {/* ------------------------------------------------------------------ */}
      {onClose && (
        <button
          onClick={onClose}
          className="w-full min-h-[44px] py-3 rounded-2xl bg-[#C8A96A] hover:bg-[#d6b778] text-[#102419] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98 transition shadow-lg shadow-[#C8A96A]/20 cursor-pointer"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Volver al Lienzo</span>
        </button>
      )}

    </div>
  );
});

export default MobileToolsPanel;
