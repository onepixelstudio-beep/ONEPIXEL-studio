import React from 'react';
import { 
  PenTool, Eraser, Square, Circle, ShieldAlert,
  PaintBucket, Pipette, Move, Wand2, RefreshCw,
  Columns, Rows, Grid, Scaling, Scan, Scissors,
  Spline, Sparkles, Blend, Stamp, Trash, CircleDashed
} from 'lucide-react';
import { ToolType, SymmetrySettings, TilingSettings } from '../types';
import { translate, LanguageCode } from '../i18n';

interface ToolbarProps {
  currentTool: ToolType;
  onChangeTool: (tool: ToolType) => void;
  brushSize: number;
  onChangeBrushSize: (size: number) => void;
  symmetry: SymmetrySettings;
  onChangeSymmetry: (settings: SymmetrySettings) => void;
  tiling: TilingSettings;
  onChangeTiling: (settings: TilingSettings) => void;
  
  // Custom tool configuration props
  sprayDensity?: number;
  onChangeSprayDensity?: (density: number) => void;
  sprayRandomness?: number;
  onChangeSprayRandomness?: (randomness: number) => void;
  sprayShape?: 'round' | 'square' | 'cross' | 'star';
  onChangeSprayShape?: (shape: 'round' | 'square' | 'cross' | 'star') => void;
  ditheringPattern?: 'checkerboard' | 'bayer' | '25%' | '50%' | '75%' | 'lines' | 'cross' | 'noise';
  onChangeDitheringPattern?: (pattern: 'checkerboard' | 'bayer' | '25%' | '50%' | '75%' | 'lines' | 'cross' | 'noise') => void;
  cloneSource?: { x: number; y: number } | null;
  onChangeCloneSource?: (source: { x: number; y: number } | null) => void;
  activeBrush?: any;
  onChangeActiveBrush?: (brush: any) => void;
  pixelPerfect?: boolean;
  onChangePixelPerfect?: (val: boolean) => void;
  bucketContiguous?: boolean;
  onChangeBucketContiguous?: (val: boolean) => void;
  bucketRefer?: 'active' | 'all';
  onChangeBucketRefer?: (val: 'active' | 'all') => void;
  language: LanguageCode;
  largeButtons?: boolean;
}

const Toolbar = React.memo(function Toolbar({
  currentTool,
  onChangeTool,
  brushSize,
  onChangeBrushSize,
  symmetry,
  onChangeSymmetry,
  tiling,
  onChangeTiling,
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
  activeBrush,
  onChangeActiveBrush,
  pixelPerfect = false,
  onChangePixelPerfect,
  bucketContiguous = true,
  onChangeBucketContiguous,
  bucketRefer = 'active',
  onChangeBucketRefer,
  language,
  largeButtons = false
}: ToolbarProps) {

  const PRESET_BRUSHES = [
    {
      id: 'brush-pixel',
      name: translate('toolbar.brushFine', language),
      size: 1,
      pixels: [[true]],
      tags: [translate('toolbar.tagFine', language)]
    },
    {
      id: 'brush-square-2x2',
      name: translate('toolbar.brushSquare', language),
      size: 2,
      pixels: [
        [true, true],
        [true, true]
      ],
      tags: [translate('toolbar.tagBlock', language)]
    },
    {
      id: 'brush-circle-3x3',
      name: translate('toolbar.brushRound', language),
      size: 3,
      pixels: [
        [false, true, false],
        [true, true, true],
        [false, true, false]
      ],
      tags: [translate('toolbar.tagSoft', language)]
    },
    {
      id: 'brush-diagonal-2px',
      name: translate('toolbar.brushDiagonal', language),
      size: 2,
      pixels: [
        [true, false],
        [false, true]
      ],
      tags: [translate('toolbar.tagEffect', language)]
    },
    {
      id: 'brush-star-5px',
      name: translate('toolbar.brushStar', language),
      size: 5,
      pixels: [
        [false, false, true, false, false],
        [false, false, true, false, false],
        [true, true, true, true, true],
        [false, false, true, false, false],
        [false, false, true, false, false]
      ],
      tags: [translate('toolbar.tagEffect', language)]
    }
  ];

  const tools: { id: ToolType; icon: any }[] = [
    { id: 'pen', icon: PenTool },
    { id: 'eraser', icon: Eraser },
    { id: 'picker', icon: Pipette },
    { id: 'bucket', icon: PaintBucket },
    { id: 'line', icon: Scaling },
    { id: 'curve', icon: Spline },
    { id: 'rectangle', icon: Square },
    { id: 'ellipse', icon: Circle },
    { id: 'spray', icon: Sparkles },
    { id: 'dithering', icon: Blend },
    { id: 'clone_stamp', icon: Stamp },
    { id: 'rect_select', icon: Scan },
    { id: 'ellipse_select', icon: CircleDashed },
    { id: 'lasso_select', icon: Scissors },
    { id: 'wand', icon: Wand2 },
    { id: 'pan', icon: Move },
  ];

  const TOOL_SHORTCUTS: Partial<Record<ToolType, string>> = {
    pen: 'P',
    eraser: 'E',
    picker: 'I',
    bucket: 'G',
    line: 'L',
    curve: 'C',
    rectangle: 'U',
    ellipse: 'O',
    spray: 'R',
    dithering: 'D',
    clone_stamp: 'S',
    rect_select: 'M',
    ellipse_select: 'Shift+M',
    lasso_select: 'K',
    wand: 'W',
    pan: 'H'
  };

  const getToolLabel = (id: ToolType): string => {
    let name = translate(`toolbar.${id}` as any, language);
    if (id === 'clone_stamp') name = translate('toolbar.cloneStamp', language);
    if (id === 'rect_select') name = translate('toolbar.rectSelect', language);
    if (id === 'ellipse_select') name = translate('toolbar.ellipseSelect', language);
    if (id === 'lasso_select') name = translate('toolbar.lassoSelect', language);
    
    const key = TOOL_SHORTCUTS[id];
    return key ? `${name} [${key}]` : name;
  };

  return (
    <div className="lg:bg-[#102419] lg:border lg:border-[#102419] lg:rounded-xl lg:p-1.5 p-0 bg-transparent border-none flex flex-col gap-1.5 text-slate-100" id="editor-toolbar">
      
      {/* Drawing Tools Section */}
      <div>
        <h4 className="text-[9px] uppercase font-bold text-[#C8A96A] tracking-wider mb-0.5 text-center hidden lg:block">
          {translate('toolbar.title', language)}
        </h4>
        <div className="grid grid-cols-8 sm:grid-cols-8 lg:grid-cols-3 gap-0.5">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = currentTool === tool.id;
            const label = getToolLabel(tool.id);
            return (
              <button
                key={tool.id}
                onClick={() => onChangeTool(tool.id)}
                className={`${largeButtons ? 'p-2' : 'p-1'} rounded-md flex items-center justify-center transition relative group cursor-pointer ${
                  isActive 
                    ? 'bg-[#C8A96A] text-[#102419] font-bold shadow-md ring-1 ring-white/40' 
                    : 'bg-[#102419] text-slate-300 hover:text-white hover:bg-[#0F3D34] border border-[#0F3D34]/50'
                }`}
                title={label}
              >
                <Icon className={`${largeButtons ? 'w-5 h-5' : 'w-4 h-4'} shrink-0`} />
                
                {/* Tooltip */}
                <span className="hidden group-hover:block absolute left-full ml-2 bg-[#030408] text-slate-100 text-[11px] font-medium px-2 py-1 rounded shadow-xl z-50 pointer-events-none border border-[#0F3D34] whitespace-nowrap">
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <hr className="border-[#102419]/80 my-0.5" />

      {/* Brush Size Selector */}
      <div className="flex items-center justify-between gap-1 text-[8px]">
        <span className="text-slate-400 uppercase font-bold shrink-0">{translate('toolbar.brushSize', language)}:</span>
        <div className="grid grid-cols-4 gap-0.5 flex-1">
          {[1, 2, 3, 4].map((size) => (
            <button
              key={size}
              onClick={() => onChangeBrushSize(size)}
              className={`py-0.5 rounded text-[8px] font-bold border transition ${
                brushSize === size 
                  ? 'bg-[#C8A96A] border-[#C8A96A] text-white' 
                  : 'bg-[#102419] border-[#102419] text-slate-400 hover:text-white'
              }`}
            >
              {size}p
            </button>
          ))}
        </div>
      </div>

      {/* Fixed-Height Tool Options Slot (Guarantees zero panel height changes or jumps) */}
      <div className="min-h-[72px] max-h-[72px] h-[72px] bg-[#102419] p-1 rounded-lg border border-[#102419]/80 flex flex-col justify-center overflow-hidden shrink-0">
        
        {/* 1. SPRAY TOOL OPTIONS */}
        {currentTool === 'spray' && (
          <div className="flex flex-col gap-1">
            <div className="grid grid-cols-2 gap-1 text-[8px]">
              <div>
                <div className="flex justify-between text-slate-400 mb-0.5">
                  <span>{translate('toolbar.sprayDens', language)}</span>
                  <span className="text-[#C8A96A]">{sprayDensity}</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="40" 
                  value={sprayDensity}
                  onChange={(e) => onChangeSprayDensity?.(Number(e.target.value))}
                  className="w-full accent-[#C8A96A] h-1 bg-[#0F3D34] rounded appearance-none"
                />
              </div>
              <div>
                <div className="flex justify-between text-slate-400 mb-0.5">
                  <span>{translate('toolbar.sprayDisp', language)}</span>
                  <span className="text-[#C8A96A]">{sprayRandomness}</span>
                </div>
                <input 
                  type="range" 
                  min="2" 
                  max="12" 
                  value={sprayRandomness}
                  onChange={(e) => onChangeSprayRandomness?.(Number(e.target.value))}
                  className="w-full accent-[#C8A96A] h-1 bg-[#0F3D34] rounded appearance-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-0.5 text-[8px]">
              {(['round', 'square', 'cross', 'star'] as const).map((shape) => (
                <button
                  key={shape}
                  onClick={() => onChangeSprayShape?.(shape)}
                  className={`py-0.5 rounded border capitalize text-center transition ${
                    sprayShape === shape 
                      ? 'bg-[#C8A96A] border-[#C8A96A] text-white font-bold' 
                      : 'bg-[#102419] border-[#0F3D34]/70 text-slate-400 hover:text-white'
                  }`}
                >
                  {shape === 'round' ? translate('toolbar.sprayRound', language) : shape === 'square' ? translate('toolbar.spraySquare', language) : shape === 'cross' ? translate('toolbar.sprayCross', language) : translate('toolbar.sprayStar', language)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2. DITHERING TOOL OPTIONS */}
        {currentTool === 'dithering' && (
          <div className="flex flex-col gap-1">
            <span className="text-[8px] uppercase font-bold text-[#C8A96A] block text-center">
              {translate('toolbar.ditheringPattern', language)}
            </span>
            <div className="grid grid-cols-4 gap-0.5 text-[7.5px]">
              {(['checkerboard', 'bayer', '25%', '50%', '75%', 'lines', 'cross', 'noise'] as const).map((pat) => (
                <button
                  key={pat}
                  onClick={() => onChangeDitheringPattern?.(pat)}
                  className={`py-0.5 px-0.5 rounded border capitalize text-center truncate transition ${
                    ditheringPattern === pat 
                      ? 'bg-[#C8A96A] border-[#C8A96A] text-white font-bold' 
                      : 'bg-[#102419] border-[#0F3D34]/70 text-slate-400 hover:text-white'
                  }`}
                  title={pat}
                >
                  {pat === 'checkerboard' ? translate('toolbar.ditherChecker', language) : pat === 'lines' ? translate('toolbar.ditherLines', language) : pat === 'cross' ? translate('toolbar.ditherCross', language) : pat === 'noise' ? translate('toolbar.ditherNoise', language) : pat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. CLONE STAMP TOOL OPTIONS */}
        {currentTool === 'clone_stamp' && (
          <div className="flex flex-col gap-1 items-center justify-center">
            <span className="text-[8px] uppercase font-bold text-[#C8A96A]">{translate('toolbar.cloneStampTitle', language)}</span>
            {cloneSource ? (
              <div className="flex items-center justify-between w-full bg-[#0F3D34] px-1.5 py-1 rounded border border-[#102419] text-[8px] text-emerald-400">
                <span>{translate('toolbar.cloneOrigCoord', language, { x: String(cloneSource.x), y: String(cloneSource.y) })}</span>
                <button 
                  onClick={() => onChangeCloneSource?.(null)}
                  className="p-0.5 hover:bg-[#102419] text-slate-400 hover:text-rose-400 rounded transition"
                  title={translate('toolbar.clearSource', language)}
                >
                  <Trash className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <p className="text-[7.5px] text-amber-400 text-center leading-tight">
                {translate('toolbar.noSource', language)}
              </p>
            )}
          </div>
        )}

        {/* 4. BUCKET TOOL OPTIONS */}
        {currentTool === 'bucket' && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[8px] text-slate-400">
              <span>{translate('toolbar.bucketContiguous', language)}:</span>
              <button
                onClick={() => onChangeBucketContiguous?.(!bucketContiguous)}
                className={`w-6 h-3 rounded-full p-0.5 transition ${bucketContiguous ? 'bg-[#C8A96A]' : 'bg-slate-700'}`}
              >
                <div className={`w-2 h-2 rounded-full bg-white transition-all transform ${bucketContiguous ? 'translate-x-3' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-0.5 text-[8px]">
              {(['active', 'all'] as const).map((source) => (
                <button
                  key={source}
                  onClick={() => onChangeBucketRefer?.(source)}
                  className={`py-0.5 px-0.5 rounded border capitalize text-center transition ${
                    bucketRefer === source 
                      ? 'bg-[#C8A96A] border-[#C8A96A] text-white font-bold' 
                      : 'bg-[#102419] border-[#0F3D34]/70 text-slate-400 hover:text-white'
                  }`}
                >
                  {source === 'active' ? translate('toolbar.bucketActiveLayer', language) : translate('toolbar.bucketAllLayers', language)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 5. DEFAULT BRUSH PRESETS & PIXEL PERFECT (FOR PEN, ERASER AND OTHER TOOLS) */}
        {currentTool !== 'spray' && currentTool !== 'dithering' && currentTool !== 'clone_stamp' && currentTool !== 'bucket' && (
          <div className="flex flex-col gap-1">
            {/* Pixel Perfect Row */}
            {(currentTool === 'pen' || currentTool === 'eraser') && (
              <button
                onClick={() => onChangePixelPerfect?.(!pixelPerfect)}
                className={`w-full py-0.5 px-1.5 rounded text-[8px] font-bold border transition flex items-center justify-between cursor-pointer ${
                  pixelPerfect
                    ? 'bg-[#C8A96A]/20 border-[#C8A96A] text-[#C8A96A]'
                    : 'bg-[#102419] border-[#0F3D34] text-slate-400 hover:text-white'
                }`}
              >
                <span className="uppercase tracking-wider">{translate('toolbar.pixelPerfect', language)}</span>
                <div className={`w-5 h-2.5 rounded-full p-0.5 transition ${pixelPerfect ? 'bg-[#C8A96A]' : 'bg-slate-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full bg-white transition-all transform ${pixelPerfect ? 'translate-x-2.5' : 'translate-x-0'}`} />
                </div>
              </button>
            )}

            {/* Brushes Mini Preset Selector */}
            <div className="grid grid-cols-5 gap-0.5">
              {PRESET_BRUSHES.map((b) => {
                const isSelected = activeBrush?.id === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => {
                      if (isSelected) {
                        onChangeActiveBrush?.(null);
                      } else {
                        onChangeActiveBrush?.(b);
                        onChangeBrushSize(b.size);
                      }
                    }}
                    title={b.name}
                    className={`h-6 rounded border flex items-center justify-center p-0.5 transition cursor-pointer ${
                      isSelected 
                        ? 'bg-[#C8A96A] border-[#C8A96A] text-white' 
                        : 'bg-[#102419] border-[#0F3D34] text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="w-4 h-4 bg-[#0F3D34] rounded flex items-center justify-center p-0.5 shrink-0">
                      <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${b.size}, 1fr)` }}>
                        {b.pixels.flatMap(row => row).map((pixel, pIdx) => (
                          <span 
                            key={pIdx} 
                            className={`rounded-xs ${pixel ? 'bg-[#C8A96A]' : 'bg-transparent'}`} 
                            style={{ 
                              width: b.size > 3 ? '1.5px' : '2px', 
                              height: b.size > 3 ? '1.5px' : '2px' 
                            }} 
                          />
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>

      <hr className="border-[#102419]/80 my-0.5" />

      {/* Symmetry & Mosaic Sections */}
      <div className="space-y-1">
        {/* Sub-group: Symmetry */}
        <div>
          <h4 className="text-[8.5px] uppercase font-bold text-[#C8A96A] tracking-wider mb-0.5 text-center hidden lg:block">
            {translate('toolbar.symmetryTitle', language)}
          </h4>
          <div className="grid grid-cols-3 gap-0.5">
            {/* Horizontal Mirror */}
            <button
              onClick={() => onChangeSymmetry({ ...symmetry, x: !symmetry.x })}
              className={`p-1 rounded-md border flex items-center justify-center transition relative group cursor-pointer ${
                symmetry.x 
                  ? 'bg-[#C8A96A] text-[#102419] font-bold border-[#C8A96A] shadow-md' 
                  : 'bg-[#102419] border-[#0F3D34]/50 text-slate-300 hover:text-white hover:bg-[#0F3D34]'
              }`}
              title={translate('toolbar.symmetryX', language)}
            >
              <Columns className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden group-hover:block absolute left-full ml-2 bg-[#030408] text-slate-100 text-[11px] font-medium px-2 py-1 rounded shadow-xl z-50 pointer-events-none border border-[#0F3D34] whitespace-nowrap">
                {translate('toolbar.symmetryX', language)}
              </span>
            </button>

            {/* Vertical Mirror */}
            <button
              onClick={() => onChangeSymmetry({ ...symmetry, y: !symmetry.y })}
              className={`p-1 rounded-md border flex items-center justify-center transition relative group cursor-pointer ${
                symmetry.y 
                  ? 'bg-[#C8A96A] text-[#102419] font-bold border-[#C8A96A] shadow-md' 
                  : 'bg-[#102419] border-[#0F3D34]/50 text-slate-300 hover:text-white hover:bg-[#0F3D34]'
              }`}
              title={translate('toolbar.symmetryY', language)}
            >
              <Rows className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden group-hover:block absolute left-full ml-2 bg-[#030408] text-slate-100 text-[11px] font-medium px-2 py-1 rounded shadow-xl z-50 pointer-events-none border border-[#0F3D34] whitespace-nowrap">
                {translate('toolbar.symmetryY', language)}
              </span>
            </button>

            {/* Radial Mirror */}
            <button
              onClick={() => onChangeSymmetry({ ...symmetry, radial: !symmetry.radial })}
              className={`p-1 rounded-md border flex items-center justify-center transition relative group cursor-pointer ${
                symmetry.radial 
                  ? 'bg-[#C8A96A] text-[#102419] font-bold border-[#C8A96A] shadow-md' 
                  : 'bg-[#102419] border-[#0F3D34]/50 text-slate-300 hover:text-white hover:bg-[#0F3D34]'
              }`}
              title={translate('toolbar.symmetryRadial', language)}
            >
              <RefreshCw className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden group-hover:block absolute left-full ml-2 bg-[#030408] text-slate-100 text-[11px] font-medium px-2 py-1 rounded shadow-xl z-50 pointer-events-none border border-[#0F3D34] whitespace-nowrap">
                {translate('toolbar.symmetryRadial', language)}
              </span>
            </button>
          </div>
        </div>

        {/* Sub-group: Mosaic (Tiling) */}
        <div>
          <button
            onClick={() => onChangeTiling({ ...tiling, active: !tiling.active })}
            className={`w-full p-1 rounded-md border flex items-center justify-center gap-1 transition relative group cursor-pointer ${
              tiling.active 
                ? 'bg-[#C8A96A] text-[#102419] font-bold border-[#C8A96A] shadow-md' 
                : 'bg-[#102419] border-[#0F3D34]/50 text-slate-300 hover:text-white hover:bg-[#0F3D34]'
            }`}
            title={translate('toolbar.tilingDesc', language)}
          >
            <Grid className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[9px] font-mono hidden lg:inline font-bold">
              {tiling.active ? translate('toolbar.tileActive', language) : translate('toolbar.tile', language)}
            </span>
            <span className="hidden group-hover:block absolute left-full ml-2 bg-[#030408] text-slate-100 text-[11px] font-medium px-2 py-1 rounded shadow-xl z-50 pointer-events-none border border-[#0F3D34] whitespace-nowrap">
              {translate('toolbar.tilingDesc', language)}
            </span>
          </button>
        </div>
      </div>

    </div>
  );
})

export default Toolbar;
