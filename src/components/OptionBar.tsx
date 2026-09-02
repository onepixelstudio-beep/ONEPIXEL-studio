import React, { useState, useEffect } from 'react';
import { 
  Sliders, ArrowLeftRight, ArrowUpDown, Trash, Blend, 
  Trash2, HelpCircle, PenTool, Eraser, CheckSquare, Square, 
  PaintBucket, Wand2, RefreshCw, Layers, Grid, Scaling, Camera, Folder, X,
  RotateCw, FlipHorizontal, FlipVertical, Repeat
} from 'lucide-react';
import { ToolType, SymmetrySettings, TilingSettings } from '../types';
import { translate, LanguageCode } from '../i18n';

interface OptionBarProps {
  currentTool: ToolType;
  language: LanguageCode;
  
  // Brush options
  brushSize: number;
  onChangeBrushSize: (size: number) => void;
  pixelPerfect: boolean;
  onChangePixelPerfect: (val: boolean) => void;
  activeBrush: any;
  onChangeActiveBrush: (brush: any) => void;
  
  // Spray options
  sprayDensity: number;
  onChangeSprayDensity: (val: number) => void;
  sprayRandomness: number;
  onChangeSprayRandomness: (val: number) => void;
  sprayShape: 'round' | 'square' | 'cross' | 'star';
  onChangeSprayShape: (shape: 'round' | 'square' | 'cross' | 'star') => void;
  
  // Dithering options
  ditheringPattern: 'checkerboard' | 'bayer' | '25%' | '50%' | '75%' | 'lines' | 'cross' | 'noise';
  onChangeDitheringPattern: (pat: 'checkerboard' | 'bayer' | '25%' | '50%' | '75%' | 'lines' | 'cross' | 'noise') => void;
  
  // Clone options
  cloneSource: { x: number; y: number } | null;
  onChangeCloneSource: (src: { x: number; y: number } | null) => void;
  
  // Bucket / Wand options
  bucketContiguous: boolean;
  onChangeBucketContiguous: (val: boolean) => void;
  bucketRefer: 'active' | 'all';
  onChangeBucketRefer: (val: 'active' | 'all') => void;
  tolerance: number;
  onChangeTolerance: (val: number) => void;
  
  // Quick symmetry / tiling toggles for options bar
  symmetry: SymmetrySettings;
  onChangeSymmetry: (sym: SymmetrySettings) => void;
  tiling: TilingSettings;
  onChangeTiling: (til: TilingSettings) => void;
  
  // Shapes fill toggle
  fillShape: boolean;
  onChangeFillShape: (val: boolean) => void;

  // Selection actions
  selectionActive: boolean;
  onClearSelection: () => void;
  onInvertSelection: () => void;
  onSaveAsStamp?: () => void;
  onOpenAssetLibrary?: () => void;

  // Active Stamp / Sprite options
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
}

const PRESET_BRUSHES = [
  { id: 'fine', nameKey: 'toolbar.brushFine', size: 1, tag: 'Fine', pixels: [[true]] },
  { id: 'square', nameKey: 'toolbar.brushSquare', size: 2, tag: 'Block', pixels: [[true, true], [true, true]] },
  { id: 'round', nameKey: 'toolbar.brushRound', size: 3, tag: 'Soft', pixels: [[false, true, false], [true, true, true], [false, true, false]] },
  { id: 'star', nameKey: 'toolbar.brushStar', size: 5, tag: 'Effect', pixels: [
    [false, false, true, false, false],
    [false, false, true, false, false],
    [true, true, true, true, true],
    [false, false, true, false, false],
    [false, false, true, false, false]
  ]}
];

const DITHERING_PATTERNS_INFO: {
  id: 'checkerboard' | 'bayer' | '25%' | '50%' | '75%' | 'lines' | 'cross' | 'noise';
  key: string;
  pixels: boolean[][];
}[] = [
  {
    id: 'checkerboard',
    key: 'toolbar.ditheringCheckerboard',
    pixels: Array.from({ length: 8 }, (_, y) =>
      Array.from({ length: 8 }, (_, x) => (x + y) % 2 === 0)
    )
  },
  {
    id: 'bayer',
    key: 'toolbar.ditheringBayer',
    pixels: (() => {
      const bayer = [
        [0, 8, 2, 10],
        [12, 4, 14, 6],
        [3, 11, 1, 9],
        [15, 7, 13, 5]
      ];
      return Array.from({ length: 8 }, (_, y) =>
        Array.from({ length: 8 }, (_, x) => bayer[y % 4][x % 4] < 8)
      );
    })()
  },
  {
    id: '25%',
    key: 'toolbar.ditheringDensity25',
    pixels: Array.from({ length: 8 }, (_, y) =>
      Array.from({ length: 8 }, (_, x) => x % 2 === 0 && y % 2 === 0)
    )
  },
  {
    id: '50%',
    key: 'toolbar.ditheringDensity50',
    pixels: Array.from({ length: 8 }, (_, y) =>
      Array.from({ length: 8 }, (_, x) => (x + y) % 2 === 0)
    )
  },
  {
    id: '75%',
    key: 'toolbar.ditheringDensity75',
    pixels: Array.from({ length: 8 }, (_, y) =>
      Array.from({ length: 8 }, (_, x) => x % 2 === 0 || y % 2 === 0)
    )
  },
  {
    id: 'lines',
    key: 'toolbar.ditheringLines',
    pixels: Array.from({ length: 8 }, (_, y) =>
      Array.from({ length: 8 }, () => y % 2 === 0)
    )
  },
  {
    id: 'cross',
    key: 'toolbar.ditheringCross',
    pixels: Array.from({ length: 8 }, (_, y) =>
      Array.from({ length: 8 }, (_, x) => x % 2 === 0 || y % 2 === 0)
    )
  },
  {
    id: 'noise',
    key: 'toolbar.ditheringNoise',
    pixels: [
      [true, false, true, false, false, true, false, true],
      [false, true, false, false, true, false, true, false],
      [true, false, false, true, false, true, false, false],
      [false, false, true, false, true, false, false, true],
      [true, true, false, false, false, true, true, false],
      [false, false, true, true, false, false, false, true],
      [true, false, false, false, true, true, false, false],
      [false, true, true, false, false, false, true, true]
    ]
  }
];

const SPRAY_SHAPES_INFO: {
  id: 'round' | 'square' | 'cross' | 'star';
  key: string;
  pixels: boolean[][];
}[] = [
  {
    id: 'round',
    key: 'toolbar.shapeRound',
    pixels: [
      [false, false, true, true, true, true, false, false],
      [false, true, true, true, true, true, true, false],
      [true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true],
      [false, true, true, true, true, true, true, false],
      [false, false, true, true, true, true, false, false],
    ]
  },
  {
    id: 'square',
    key: 'toolbar.shapeSquare',
    pixels: [
      [false, false, false, false, false, false, false, false],
      [false, true, true, true, true, true, true, false],
      [false, true, true, true, true, true, true, false],
      [false, true, true, true, true, true, true, false],
      [false, true, true, true, true, true, true, false],
      [false, true, true, true, true, true, true, false],
      [false, true, true, true, true, true, true, false],
      [false, false, false, false, false, false, false, false],
    ]
  },
  {
    id: 'cross',
    key: 'toolbar.shapeCross',
    pixels: [
      [false, false, false, true, true, false, false, false],
      [false, false, false, true, true, false, false, false],
      [false, false, false, true, true, false, false, false],
      [true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true],
      [false, false, false, true, true, false, false, false],
      [false, false, false, true, true, false, false, false],
      [false, false, false, true, true, false, false, false],
    ]
  },
  {
    id: 'star',
    key: 'toolbar.shapeStar',
    pixels: [
      [false, false, false, true, true, false, false, false],
      [false, false, true, true, true, true, false, false],
      [false, true, true, true, true, true, true, false],
      [true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true],
      [false, true, true, true, true, true, true, false],
      [false, false, true, true, true, true, false, false],
      [false, false, false, true, true, false, false, false],
    ]
  }
];

export const OptionBar: React.FC<OptionBarProps> = ({
  currentTool,
  language,
  brushSize,
  onChangeBrushSize,
  pixelPerfect,
  onChangePixelPerfect,
  activeBrush,
  onChangeActiveBrush,
  sprayDensity,
  onChangeSprayDensity,
  sprayRandomness,
  onChangeSprayRandomness,
  sprayShape,
  onChangeSprayShape,
  ditheringPattern,
  onChangeDitheringPattern,
  cloneSource,
  onChangeCloneSource,
  bucketContiguous,
  onChangeBucketContiguous,
  bucketRefer,
  onChangeBucketRefer,
  tolerance,
  onChangeTolerance,
  symmetry,
  onChangeSymmetry,
  tiling,
  onChangeTiling,
  fillShape,
  onChangeFillShape,
  selectionActive,
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
  onChangePatternMode
}) => {
  // Temporary string states for keyboard typing, allowing fluid user input
  const [typedBrushSize, setTypedBrushSize] = useState<string>(brushSize.toString());
  const [typedTolerance, setTypedTolerance] = useState<string>(tolerance.toString());
  const [typedDensity, setTypedDensity] = useState<string>(sprayDensity.toString());
  const [typedRandomness, setTypedRandomness] = useState<string>(sprayRandomness.toString());

  // Synchronize typed values when props change externally
  useEffect(() => { setTypedBrushSize(brushSize.toString()); }, [brushSize]);
  useEffect(() => { setTypedTolerance(tolerance.toString()); }, [tolerance]);
  useEffect(() => { setTypedDensity(sprayDensity.toString()); }, [sprayDensity]);
  useEffect(() => { setTypedRandomness(sprayRandomness.toString()); }, [sprayRandomness]);

  const handleBrushSizeInput = (val: string) => {
    setTypedBrushSize(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 1 && num <= 32) {
      onChangeBrushSize(num);
    }
  };

  const handleToleranceInput = (val: string) => {
    setTypedTolerance(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0 && num <= 255) {
      onChangeTolerance(num);
    }
  };

  const handleDensityInput = (val: string) => {
    setTypedDensity(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 5 && num <= 40) {
      onChangeSprayDensity(num);
    }
  };

  const handleRandomnessInput = (val: string) => {
    setTypedRandomness(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 2 && num <= 12) {
      onChangeSprayRandomness(num);
    }
  };

  // Helper to render label + value container with keyboard inputs
  const renderNumericController = (
    label: string, 
    value: number, 
    min: number, 
    max: number, 
    typedValue: string, 
    onInputChange: (val: string) => void,
    onSliderChange: (num: number) => void,
    icon?: React.ReactNode,
    tooltip?: string
  ) => {
    const percentage = ((value - min) / (max - min)) * 100;

    const handleCommit = () => {
      const num = parseInt(typedValue, 10);
      if (isNaN(num)) {
        onInputChange(value.toString());
      } else {
        const clamped = Math.max(min, Math.min(max, num));
        onSliderChange(clamped);
        onInputChange(clamped.toString());
      }
    };

    return (
      <div className="flex items-center gap-1 shrink-0" title={tooltip}>
        {icon ? (
          <span className="p-0.5 rounded text-slate-400 hover:text-[#C8A96A] transition-colors shrink-0 flex items-center justify-center">
            {icon}
          </span>
        ) : label ? (
          <span className="text-[8.5px] uppercase font-bold text-slate-400 select-none shrink-0">{label}</span>
        ) : null}
        <div className="flex items-center gap-1 shrink-0">
          <input 
            type="range" 
            min={min} 
            max={max} 
            value={value}
            onChange={(e) => {
              const val = Number(e.target.value);
              onSliderChange(val);
              onInputChange(val.toString());
            }}
            className="w-10 sm:w-16 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#C8A96A]"
            style={{ 
              background: `linear-gradient(to right, #C8A96A 0%, #C8A96A ${percentage}%, #102419 ${percentage}%, #102419 100%)`,
              height: '3px'
            }}
          />
          <input
            type="text"
            pattern="[0-9]*"
            value={typedValue}
            onChange={(e) => onInputChange(e.target.value)}
            onBlur={handleCommit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCommit();
                e.currentTarget.blur();
              }
            }}
            className="w-6.5 h-4.5 text-center text-[8.5px] font-bold text-[#C8A96A] bg-[#102419] border border-[#102419]/70 rounded focus:outline-none focus:ring-1 focus:ring-[#C8A96A] font-mono leading-none px-0.5"
          />
        </div>
      </div>
    );
  };

  // Quick Mirror Toggles
  const handleToggleSymmetryX = () => {
    onChangeSymmetry({ ...symmetry, x: !symmetry.x });
  };

  const handleToggleSymmetryY = () => {
    onChangeSymmetry({ ...symmetry, y: !symmetry.y });
  };

  return (
    <div id="editor-option-bar" className="w-full bg-[#102419] border border-[#102419]/80 rounded-md h-[28px] min-h-[28px] max-h-[28px] px-2 py-0 flex flex-nowrap items-center justify-between gap-1.5 shadow-md text-slate-200 overflow-x-auto custom-scrollbar shrink-0 leading-none">
      {activeStamp ? (
        <div className="flex flex-nowrap items-center gap-2 shrink-0 w-full justify-between">
          {/* Active Sprite Badge */}
          <div className="flex items-center gap-1.5 bg-[#102419] px-2 py-0.5 rounded border border-[#C8A96A]/40 shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#C8A96A] animate-pulse shrink-0" />
            <span className="text-[8.5px] uppercase font-bold text-slate-300">
              {translate('toolbar.activeSprite', language)}
            </span>
            <span className="text-[9.5px] font-bold text-[#C8A96A] truncate max-w-[120px]" title={activeStamp.name}>
              {activeStamp.name}
            </span>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center gap-0.5 bg-[#102419] p-0.5 rounded border border-[#102419]/70 shrink-0">
            <button
              onClick={() => onChangePatternMode?.('stamp')}
              className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold transition flex items-center gap-1 cursor-pointer leading-none h-5 ${
                (patternMode || 'stamp') === 'stamp'
                  ? 'bg-[#C8A96A]/20 border border-[#C8A96A] text-[#C8A96A]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={translate('toolbar.stampModeSingle', language)}
            >
              <Grid className="w-3 h-3" />
              <span>{translate('toolbar.stampSingle', language)}</span>
            </button>
            <button
              onClick={() => onChangePatternMode?.('pattern')}
              className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold transition flex items-center gap-1 cursor-pointer leading-none h-5 ${
                patternMode === 'pattern'
                  ? 'bg-[#C8A96A]/20 border border-[#C8A96A] text-[#C8A96A]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={translate('toolbar.stampModeTiled', language)}
            >
              <Repeat className="w-3 h-3" />
              <span>{translate('toolbar.stampTiled', language)}</span>
            </button>
          </div>

          {/* Scale Controller */}
          <div className="flex items-center gap-1 bg-[#102419] px-1.5 py-0.5 rounded border border-[#102419]/70 shrink-0 h-5">
            <span className="text-[8.5px] uppercase font-bold text-slate-400">{translate('toolbar.stampScale', language)}</span>
            <button
              onClick={() => onChangeStampScale?.(prev => Math.max(1, typeof prev === 'number' ? prev - 1 : 1))}
              className="px-1.5 rounded bg-[#102419] hover:bg-[#102419]/80 text-slate-200 font-bold text-[10px] hover:text-[#C8A96A] cursor-pointer leading-none"
              title={translate('toolbar.reduceScale', language)}
            >
              -
            </button>
            <span className="text-[9.5px] font-mono font-bold text-[#C8A96A] min-w-[16px] text-center">
              {stampScale ?? 1}x
            </span>
            <button
              onClick={() => onChangeStampScale?.(prev => Math.min(8, typeof prev === 'number' ? prev + 1 : 8))}
              className="px-1.5 rounded bg-[#102419] hover:bg-[#102419]/80 text-slate-200 font-bold text-[10px] hover:text-[#C8A96A] cursor-pointer leading-none"
              title={translate('toolbar.increaseScale', language)}
            >
              +
            </button>
          </div>

          {/* Rotation & Flips */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onChangeStampRotation?.(prev => (typeof prev === 'number' ? (prev + 90) % 360 : 90))}
              className={`p-1 rounded transition border flex items-center gap-1 text-[8.5px] font-mono font-bold cursor-pointer h-5 ${
                (stampRotation || 0) > 0
                  ? 'bg-[#C8A96A]/20 border-[#C8A96A] text-[#C8A96A]'
                  : 'bg-[#102419] border-[#102419]/70 text-slate-400 hover:text-white'
              }`}
              title={translate('toolbar.rotate90deg', language)}
            >
              <RotateCw className="w-3 h-3" />
              <span>{stampRotation || 0}°</span>
            </button>
            <button
              onClick={() => onChangeStampFlipH?.(prev => !prev)}
              className={`p-1 rounded transition border cursor-pointer h-5 ${
                stampFlipH
                  ? 'bg-[#C8A96A]/20 border-[#C8A96A] text-[#C8A96A]'
                  : 'bg-[#102419] border-[#102419]/70 text-slate-400 hover:text-white'
              }`}
              title={translate('toolbar.flipHorizontalTitle', language)}
            >
              <FlipHorizontal className="w-3 h-3" />
            </button>
            <button
              onClick={() => onChangeStampFlipV?.(prev => !prev)}
              className={`p-1 rounded transition border cursor-pointer h-5 ${
                stampFlipV
                  ? 'bg-[#C8A96A]/20 border-[#C8A96A] text-[#C8A96A]'
                  : 'bg-[#102419] border-[#102419]/70 text-slate-400 hover:text-white'
              }`}
              title={translate('toolbar.flipVerticalTitle', language)}
            >
              <FlipVertical className="w-3 h-3" />
            </button>
          </div>

          {/* Close / Desactivar Sello */}
          <button
            onClick={() => onClearActiveStamp?.()}
            className="ml-auto px-2 py-0.5 bg-[#102419] hover:bg-[#C8A96A] hover:text-[#102419] text-white rounded text-[8.5px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0 leading-none h-5 border border-[#C8A96A]/30"
            title={translate('toolbar.closeStampTitle', language)}
          >
            <X className="w-3 h-3 text-[#C8A96A]" />
            <span>{translate('toolbar.closeStamp', language)}</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-nowrap items-center gap-2 shrink-0">
          {/* Left side: Active Tool Icon and adaptive settings */}
            <div className="flex items-center gap-1 border-r border-[#102419]/80 pr-1.5 shrink-0">
              <Sliders className="w-2.5 h-2.5 text-[#C8A96A]" />
              <span className="text-[9.5px] font-bold text-[#C8A96A] tracking-wide uppercase leading-none">
                {translate(`toolbar.${currentTool}` as any, language) || currentTool}
              </span>
            </div>

            {/* 1. BRUSH / ERASER OPTIONS */}
            {(currentTool === 'pen' || currentTool === 'eraser' || currentTool === 'line' || currentTool === 'clone_stamp') && (
              <div className="flex flex-nowrap items-center gap-1.5 shrink-0">
                {renderNumericController(
                  translate('toolbar.sizeAbbr', language),
                  brushSize,
                  1,
                  32,
                  typedBrushSize,
                  handleBrushSizeInput,
                  onChangeBrushSize
                )}

                {/* Pixel Perfect (only for pen / eraser) */}
                {(currentTool === 'pen' || currentTool === 'eraser') && (
                  <button
                    onClick={() => onChangePixelPerfect(!pixelPerfect)}
                    className={`h-5 px-1.5 rounded text-[8.5px] font-bold border transition flex items-center gap-1 cursor-pointer shrink-0 leading-none ${
                      pixelPerfect 
                        ? 'bg-[#C8A96A]/20 border-[#C8A96A] text-[#C8A96A]' 
                        : 'bg-[#102419] border-[#102419]/70 text-slate-400 hover:text-white'
                    }`}
                    title={translate('toolbar.pixelPerfect', language)}
                  >
                    <span className="uppercase tracking-wider">{translate('toolbar.pixelPerfectAbbr', language)}</span>
                    <div className={`w-3.5 h-1.5 rounded-full p-0.5 transition ${pixelPerfect ? 'bg-[#C8A96A]' : 'bg-slate-700'}`}>
                      <div className={`w-0.5 h-0.5 rounded-full bg-white transition-all transform ${pixelPerfect ? 'translate-x-2' : 'translate-x-0'}`} />
                    </div>
                  </button>
                )}

                {/* Brush presets mini-library */}
                {(currentTool === 'pen' || currentTool === 'eraser') && (
                  <div className="flex items-center gap-0.5 border-l border-[#102419]/80 pl-1 shrink-0">
                    {PRESET_BRUSHES.map((b) => {
                      const isSelected = activeBrush?.id === b.id;
                      return (
                        <button
                          key={b.id}
                          onClick={() => {
                            if (isSelected) {
                              onChangeActiveBrush(null);
                            } else {
                              onChangeActiveBrush(b);
                              onChangeBrushSize(b.size);
                            }
                          }}
                          title={translate(b.nameKey as any, language)}
                          className={`h-5 w-5 rounded border flex items-center justify-center p-0.5 transition cursor-pointer shrink-0 ${
                            isSelected 
                              ? 'bg-[#C8A96A] border-[#C8A96A] text-white' 
                              : 'bg-[#102419] border-[#102419]/70 text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="w-3.5 h-3.5 bg-[#102419] rounded flex items-center justify-center p-0.5 shrink-0">
                            <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${b.size}, 1fr)` }}>
                              {b.pixels.flatMap(row => row).map((pixel, pIdx) => (
                                <span 
                                  key={pIdx} 
                                  className={`rounded-xs ${pixel ? 'bg-[#C8A96A]' : 'bg-transparent'}`} 
                                  style={{ 
                                    width: b.size > 3 ? '1px' : '1.5px', 
                                    height: b.size > 3 ? '1px' : '1.5px' 
                                  }} 
                                />
                              ))}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SPRAY OPTIONS */}
            {currentTool === 'spray' && (
              <div className="flex flex-nowrap items-center gap-1.5 shrink-0">
                {renderNumericController(
                  '',
                  sprayDensity,
                  5,
                  40,
                  typedDensity,
                  handleDensityInput,
                  onChangeSprayDensity,
                  <Layers className="w-3 h-3 text-[#C8A96A]" />,
                  translate('toolbar.sprayDensityTooltip', language)
                )}
                {renderNumericController(
                  '',
                  sprayRandomness,
                  2,
                  12,
                  typedRandomness,
                  handleRandomnessInput,
                  onChangeSprayRandomness,
                  <Scaling className="w-3 h-3 text-[#C8A96A]" />,
                  translate('toolbar.sprayDispersionTooltip', language)
                )}
                <div className="flex items-center gap-1 pl-1 border-l border-[#102419]/80 shrink-0">
                  <div className="flex items-center gap-1">
                    {SPRAY_SHAPES_INFO.map((shapeItem) => {
                      const isSelected = sprayShape === shapeItem.id;
                      const label = translate(shapeItem.key as any, language);
                      return (
                        <button
                          key={shapeItem.id}
                          onClick={() => onChangeSprayShape(shapeItem.id)}
                          className={`p-0.5 rounded transition-all cursor-pointer flex items-center justify-center shrink-0 border h-5 w-5 ${
                            isSelected
                              ? 'bg-[#C8A96A]/20 border-[#C8A96A] text-[#C8A96A] shadow-xs scale-105'
                              : 'bg-[#102419] border-[#102419]/70 text-slate-400 hover:text-white hover:border-slate-500'
                          }`}
                          title={label}
                        >
                          <svg viewBox="0 0 8 8" className="w-3.5 h-3.5 shrink-0" shapeRendering="crispEdges">
                            {shapeItem.pixels.map((row, y) =>
                              row.map((active, x) =>
                                active ? (
                                  <rect
                                    key={`${x}-${y}`}
                                    x={x}
                                    y={y}
                                    width={1}
                                    height={1}
                                    fill={isSelected ? '#C8A96A' : 'currentColor'}
                                  />
                                ) : null
                              )
                            )}
                          </svg>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* DITHERING OPTIONS */}
            {currentTool === 'dithering' && (
              <div className="flex flex-nowrap items-center gap-1.5 shrink-0">
                {renderNumericController(
                  '',
                  brushSize,
                  1,
                  32,
                  typedBrushSize,
                  handleBrushSizeInput,
                  onChangeBrushSize,
                  <PenTool className="w-3 h-3 text-[#C8A96A]" />,
                  translate('toolbar.ditheringBrushSizeTooltip', language)
                )}
                <div className="flex items-center gap-1 pl-1 border-l border-[#102419]/80 shrink-0">
                  <div className="flex items-center gap-1">
                    {DITHERING_PATTERNS_INFO.map((pat) => {
                      const isSelected = ditheringPattern === pat.id;
                      const label = translate(pat.key as any, language);
                      return (
                        <button
                          key={pat.id}
                          onClick={() => onChangeDitheringPattern(pat.id)}
                          className={`p-0.5 rounded transition-all cursor-pointer flex items-center justify-center shrink-0 border h-5 w-5 ${
                            isSelected
                              ? 'bg-[#C8A96A]/20 border-[#C8A96A] text-[#C8A96A] shadow-xs scale-105'
                              : 'bg-[#102419] border-[#102419]/70 text-slate-400 hover:text-white hover:border-slate-500'
                          }`}
                          title={label}
                        >
                          <svg viewBox="0 0 8 8" className="w-3.5 h-3.5 shrink-0" shapeRendering="crispEdges">
                            {pat.pixels.map((row, y) =>
                              row.map((active, x) =>
                                active ? (
                                  <rect
                                    key={`${x}-${y}`}
                                    x={x}
                                    y={y}
                                    width={1}
                                    height={1}
                                    fill={isSelected ? '#C8A96A' : 'currentColor'}
                                  />
                                ) : null
                              )
                            )}
                          </svg>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

        {/* 2. SHAPES (RECTANGLE / ELLIPSE) OPTIONS */}
        {(currentTool === 'rectangle' || currentTool === 'ellipse') && (
          <div className="flex flex-nowrap items-center gap-1.5 shrink-0">
            <button
              onClick={() => onChangeFillShape(!fillShape)}
              className={`h-5 px-1.5 rounded text-[8.5px] font-bold border transition flex items-center gap-1 cursor-pointer shrink-0 leading-none ${
                fillShape 
                  ? 'bg-[#C8A96A]/20 border-[#C8A96A] text-[#C8A96A]' 
                  : 'bg-[#102419] border-[#102419]/70 text-slate-400 hover:text-white'
              }`}
              title={translate('toolbar.fillShape', language)}
            >
              <span className="uppercase tracking-wider">{translate('toolbar.fill', language)}</span>
              <div className={`w-3.5 h-1.5 rounded-full p-0.5 transition ${fillShape ? 'bg-[#C8A96A]' : 'bg-slate-700'}`}>
                <div className={`w-0.5 h-0.5 rounded-full bg-white transition-all transform ${fillShape ? 'translate-x-2' : 'translate-x-0'}`} />
              </div>
            </button>
          </div>
        )}

        {/* 3. CLONE STAMP STATUS & CLEAR */}
        {currentTool === 'clone_stamp' && (
          <div className="flex items-center gap-1.5 shrink-0">
            {cloneSource ? (
              <div className="flex items-center gap-1 bg-[#102419] px-1.5 py-0 rounded border border-[#102419]/80 text-[8.5px] text-emerald-400 h-5 leading-none">
                <span className="font-mono">{translate('toolbar.origCoord', language, { x: cloneSource.x, y: cloneSource.y })}</span>
                <button 
                  onClick={() => onChangeCloneSource(null)}
                  className="p-0.5 hover:bg-[#102419] text-slate-400 hover:text-rose-400 rounded transition"
                  title={translate('toolbar.clearSource', language)}
                >
                  <Trash className="w-2.5 h-2.5" />
                </button>
              </div>
            ) : (
              <div className="bg-[#102419] px-1.5 py-0 rounded border border-dashed border-[#102419]/80 text-center text-[8.5px] text-amber-500 h-5 flex items-center leading-none">
                {translate('toolbar.cloneStampDesc', language)}
              </div>
            )}
          </div>
        )}

        {/* 4. BUCKET & WAND (TOLERANCE AND CONTIGUOUS OPTIONS) */}
        {(currentTool === 'bucket' || currentTool === 'wand') && (
          <div className="flex flex-nowrap items-center gap-1.5 shrink-0">
            {renderNumericController(
              translate('toolbar.tolAbbr', language),
              tolerance,
              0,
              255,
              typedTolerance,
              handleToleranceInput,
              onChangeTolerance
            )}

            <button
              onClick={() => onChangeBucketContiguous(!bucketContiguous)}
              className={`h-5 px-1.5 rounded text-[8.5px] font-bold border transition flex items-center gap-1 cursor-pointer shrink-0 leading-none ${
                bucketContiguous 
                  ? 'bg-[#C8A96A]/20 border-[#C8A96A] text-[#C8A96A]' 
                  : 'bg-[#102419] border-[#102419]/70 text-slate-400 hover:text-white'
              }`}
              title={translate('toolbar.bucketContiguousDesc', language)}
            >
              <span className="uppercase tracking-wider">Cont.</span>
              <div className={`w-3.5 h-1.5 rounded-full p-0.5 transition ${bucketContiguous ? 'bg-[#C8A96A]' : 'bg-slate-700'}`}>
                <div className={`w-0.5 h-0.5 rounded-full bg-white transition-all transform ${bucketContiguous ? 'translate-x-2' : 'translate-x-0'}`} />
              </div>
            </button>

            <div className="flex items-center gap-1 pl-1 border-l border-[#102419]/80 shrink-0">
              <span className="text-[8.5px] uppercase font-bold text-slate-400">{translate('toolbar.refAbbr', language)}</span>
              <div className="flex gap-0.5">
                {(['active', 'all'] as const).map((source) => (
                  <button
                    key={source}
                    onClick={() => onChangeBucketRefer(source)}
                    className={`px-1.5 h-5 rounded border text-[8px] font-bold uppercase transition leading-none ${
                      bucketRefer === source 
                        ? 'bg-[#C8A96A] border-[#C8A96A] text-white' 
                        : 'bg-[#102419] border-[#102419]/70 text-slate-400 hover:text-white'
                    }`}
                  >
                    {source === 'active' 
                      ? translate('toolbar.bucketReferActiveShort', language) 
                      : translate('toolbar.bucketReferAllShort', language)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. SELECTION TOOLS (RECT_SELECT / ELLIPSE_SELECT / LASSO_SELECT / WAND) & ACTIVE SELECTION ACTIONS */}
        {(currentTool === 'rect_select' || currentTool === 'ellipse_select' || currentTool === 'lasso_select' || currentTool === 'wand' || selectionActive) && (
          <div className="flex flex-nowrap items-center gap-1 shrink-0">
            {selectionActive ? (
              <div className="flex items-center gap-1 bg-[#102419] border border-[#102419]/80 rounded px-1 py-0.5">
                <button
                  onClick={onClearSelection}
                  className="px-1.5 h-4.5 rounded bg-rose-950/50 border border-rose-800/60 text-[8.5px] uppercase font-bold text-rose-300 hover:bg-rose-900/80 hover:text-white transition flex items-center gap-1 shrink-0 leading-none cursor-pointer"
                  title={translate('toolbar.selectionClear', language) || 'Deseleccionar'}
                >
                  <X className="w-2.5 h-2.5 text-rose-400" />
                  <span className="hidden sm:inline">{translate('toolbar.selectionClear', language) || 'Deseleccionar'}</span>
                </button>

                <button
                  onClick={onInvertSelection}
                  className="px-1.5 h-4.5 rounded bg-[#102419] border border-[#102419]/70 text-[8.5px] uppercase font-bold text-[#C8A96A] hover:bg-[#102419]/80 hover:text-amber-200 transition flex items-center gap-1 shrink-0 leading-none cursor-pointer"
                  title={translate('toolbar.selectionInvert', language) || 'Invertir'}
                >
                  <RefreshCw className="w-2.5 h-2.5 text-[#C8A96A]" />
                  <span className="hidden sm:inline">{translate('toolbar.selectionInvert', language) || 'Invertir'}</span>
                </button>

                {onSaveAsStamp && (
                  <button
                    onClick={onSaveAsStamp}
                    className="px-1.5 h-4.5 rounded bg-[#102419] border border-[#102419]/70 text-[8.5px] uppercase font-bold text-[#C8A96A] hover:bg-[#102419]/80 hover:text-amber-200 transition flex items-center gap-1 cursor-pointer shrink-0 leading-none"
                    title={translate('toolbar.selectionSaveStamp', language) || 'Guardar como Sello'}
                  >
                    <Camera className="w-2.5 h-2.5 text-[#C8A96A]" />
                    <span className="hidden md:inline">{translate('toolbar.stampShort', language)}</span>
                  </button>
                )}

                {onOpenAssetLibrary && (
                  <button
                    onClick={onOpenAssetLibrary}
                    className="px-1.5 h-4.5 rounded bg-[#102419] border border-[#102419]/70 text-[8.5px] uppercase font-bold text-slate-200 hover:bg-[#102419]/80 hover:text-white transition flex items-center gap-1 cursor-pointer shrink-0 leading-none"
                    title={translate('toolbar.assetLibraryTitle', language)}
                  >
                    <Folder className="w-2.5 h-2.5 text-slate-300" />
                    <span className="hidden md:inline">{translate('toolbar.assetsShort', language)}</span>
                  </button>
                )}
              </div>
            ) : (
              <span className="text-[8.5px] text-slate-400 italic leading-none px-1">
                {currentTool === 'rect_select' ? translate('toolbar.dragToSelect', language) : currentTool === 'wand' ? translate('toolbar.clickToSelect', language) : translate('toolbar.drawToSelect', language)}
              </span>
            )}
          </div>
        )}
      </div>
    )}

      {/* Right side: Quick Symmetry toggles and tiling */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-[8.5px] uppercase font-bold text-slate-400 border-l border-[#102419]/80 pl-1.5 mr-0.5 hidden md:inline shrink-0">
          {translate('toolbar.mirrorQuickToggles', language)}
        </span>
        
        {/* Quick Mirror Horizontal */}
        <button
          onClick={handleToggleSymmetryY}
          className={`h-5 w-5 rounded border flex items-center justify-center transition cursor-pointer shrink-0 ${
            symmetry.y 
              ? 'bg-[#C8A96A] border-[#C8A96A] text-white font-bold' 
              : 'bg-[#102419] border-[#102419]/70 text-slate-400 hover:text-white'
          }`}
          title={translate('toolbar.symmetryY', language)}
        >
          <ArrowLeftRight className="w-2.5 h-2.5" />
        </button>

        {/* Quick Mirror Vertical */}
        <button
          onClick={handleToggleSymmetryX}
          className={`h-5 w-5 rounded border flex items-center justify-center transition cursor-pointer shrink-0 ${
            symmetry.x 
              ? 'bg-[#C8A96A] border-[#C8A96A] text-white font-bold' 
              : 'bg-[#102419] border-[#102419]/70 text-slate-400 hover:text-white'
          }`}
          title={translate('toolbar.symmetryX', language)}
        >
          <ArrowUpDown className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
};
