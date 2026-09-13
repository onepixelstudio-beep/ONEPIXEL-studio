import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, Check, Copy, ArrowLeftRight, Trash2, 
  Sparkles, Sliders, Palette as PaletteIcon, Grid, 
  RotateCcw, SlidersHorizontal
} from 'lucide-react';
import { LanguageCode } from '../../types';
import { translate } from '../../i18n';
import { parseHexColor, rgbToHex } from '../../utils/colorUtils';

// Helper: Convert HSV to RGB
function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  h = (h % 360 + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  v = Math.max(0, Math.min(100, v)) / 100;

  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let rPrime = 0, gPrime = 0, bPrime = 0;
  if (h < 60) {
    rPrime = c; gPrime = x; bPrime = 0;
  } else if (h < 120) {
    rPrime = x; gPrime = c; bPrime = 0;
  } else if (h < 180) {
    rPrime = 0; gPrime = c; bPrime = x;
  } else if (h < 240) {
    rPrime = 0; gPrime = x; bPrime = c;
  } else if (h < 300) {
    rPrime = x; gPrime = 0; bPrime = c;
  } else {
    rPrime = c; gPrime = 0; bPrime = x;
  }

  return {
    r: Math.round((rPrime + m) * 255),
    g: Math.round((gPrime + m) * 255),
    b: Math.round((bPrime + m) * 255)
  };
}

// Helper: Convert RGB to HSV
function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : Math.round((delta / max) * 100);
  const v = Math.round(max * 100);

  return { h, s, v };
}

// Iconic Pixel Art Presets with distinct aesthetics
const RETRO_PALETTES = [
  {
    name: 'PICO-8',
    count: 16,
    colors: [
      '#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8',
      '#FF004D', '#FFA300', '#FFEC27', '#00E436', '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA'
    ]
  },
  {
    name: 'Game Boy',
    count: 4,
    colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f']
  },
  {
    name: 'Endesga 32',
    count: 32,
    colors: [
      '#be4a2f', '#d77643', '#ead4aa', '#e4a672', '#b86f50', '#733e39', '#3e2731', '#a22633',
      '#e43b44', '#f77622', '#feae34', '#fee761', '#63c74d', '#3e8948', '#265c42', '#193c3e',
      '#124e89', '#0099db', '#2ce8f5', '#ffffff', '#c0cbdc', '#8b9bb4', '#5a6988', '#3a4466',
      '#262b44', '#181425', '#ff0044', '#68386c', '#b55088', '#f6757a', '#e8b796', '#c28569'
    ]
  },
  {
    name: 'Cyberpunk Neon',
    count: 8,
    colors: ['#080811', '#1a0b2e', '#ff007f', '#00f0ff', '#ffe600', '#7122fa', '#00ff66', '#ffffff']
  },
  {
    name: 'DawnBringer 16',
    count: 16,
    colors: [
      '#140c1c', '#442434', '#30346d', '#4e4a4e', '#854c30', '#346524', '#d04648', '#757161',
      '#597dce', '#d27d2c', '#8595a1', '#6daa2c', '#d2a474', '#70c1b3', '#247ba0', '#ffe7d9'
    ]
  }
];

export interface MobileColorPickerProps {
  currentColor: string;
  secondaryColor?: string;
  onChangeColor: (color: string) => void;
  onChangeSecondaryColor?: (color: string) => void;
  onSwapColors?: () => void;
  opacity?: number;
  onChangeOpacity?: (opacity: number) => void;
  documentColors?: string[];
  customPalette?: string[];
  onAddToCustomPalette?: (color: string) => void;
  onClearCustomPalette?: () => void;
  onInvertPalette?: () => void;
  onRemoveFromCustomPalette?: (indexOrColor: any) => void;
  onLoadPalette?: (nameOrColors: any, colors?: string[]) => void;
  isLandscape?: boolean;
  language: LanguageCode;
  onClose?: () => void;
}

export const MobileColorPicker: React.FC<MobileColorPickerProps> = React.memo(function MobileColorPicker({
  currentColor,
  secondaryColor = '#000000',
  onChangeColor,
  onChangeSecondaryColor,
  onSwapColors,
  opacity = 100,
  onChangeOpacity,
  documentColors = [],
  customPalette = [],
  onAddToCustomPalette,
  onClearCustomPalette,
  onInvertPalette,
  onRemoveFromCustomPalette,
  onLoadPalette,
  isLandscape = false,
  language,
  onClose
}) {
  const [pickerMode, setPickerMode] = useState<'box' | 'presets'>('box');
  const [copiedHex, setCopiedHex] = useState(false);

  // Compute HSV from current color
  const initialHsv = useMemo(() => {
    const rgba = parseHexColor(currentColor);
    if (rgba) {
      return rgbToHsv(rgba.r, rgba.g, rgba.b);
    }
    return { h: 0, s: 100, v: 100 };
  }, [currentColor]);

  const [hue, setHue] = useState<number>(initialHsv.h);
  const [sat, setSat] = useState<number>(initialHsv.s);
  const [val, setVal] = useState<number>(initialHsv.v);

  // Synchronize when currentColor changes from outside
  useEffect(() => {
    const rgba = parseHexColor(currentColor);
    if (rgba) {
      const hsv = rgbToHsv(rgba.r, rgba.g, rgba.b);
      setHue(hsv.h);
      setSat(hsv.s);
      setVal(hsv.v);
    }
  }, [currentColor]);

  // Update color helper
  const updateColorFromHsv = useCallback((h: number, s: number, v: number) => {
    const rgb = hsvToRgb(h, s, v);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    onChangeColor(hex);
  }, [onChangeColor]);

  // Pure hue at 100% saturation and 100% value
  const pureHueHex = useMemo(() => {
    const rgb = hsvToRgb(hue, 100, 100);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  }, [hue]);

  // ----------------------------------------------------
  // SATURATION-VALUE BOX GESTURE LOGIC (TRADITIONAL COLOR BOX)
  // ----------------------------------------------------
  const boxRef = useRef<HTMLDivElement>(null);
  const isDraggingBox = useRef(false);

  const handleBoxPointerMove = useCallback((clientX: number, clientY: number) => {
    if (!boxRef.current) return;
    const rect = boxRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

    const newSat = Math.round((x / rect.width) * 100);
    const newVal = Math.round((1 - y / rect.height) * 100);

    setSat(newSat);
    setVal(newVal);
    updateColorFromHsv(hue, newSat, newVal);
  }, [hue, updateColorFromHsv]);

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingBox.current) return;
      if (e.cancelable) e.preventDefault();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      handleBoxPointerMove(clientX, clientY);
    };

    const onEnd = () => {
      isDraggingBox.current = false;
    };

    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [handleBoxPointerMove]);

  // ----------------------------------------------------
  // 3. VALUE (BRIGHTNESS) SLIDER
  // ----------------------------------------------------
  const valSliderRef = useRef<HTMLDivElement>(null);
  const isDraggingVal = useRef(false);

  const handleValPointerMove = useCallback((clientX: number) => {
    if (!valSliderRef.current) return;
    const rect = valSliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const newVal = Math.round((x / rect.width) * 100);

    setVal(newVal);
    updateColorFromHsv(hue, sat, newVal);
  }, [hue, sat, updateColorFromHsv]);

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingVal.current) return;
      if (e.cancelable) e.preventDefault();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      handleValPointerMove(clientX);
    };

    const onEnd = () => {
      isDraggingVal.current = false;
    };

    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [handleValPointerMove]);

  // ----------------------------------------------------
  // 4. HUE SLIDER (FOR BOX MODE)
  // ----------------------------------------------------
  const hueSliderRef = useRef<HTMLDivElement>(null);
  const isDraggingHue = useRef(false);

  const handleHuePointerMove = useCallback((clientX: number) => {
    if (!hueSliderRef.current) return;
    const rect = hueSliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const newHue = Math.round((x / rect.width) * 360) % 360;

    setHue(newHue);
    updateColorFromHsv(newHue, sat, val);
  }, [sat, val, updateColorFromHsv]);

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingHue.current) return;
      if (e.cancelable) e.preventDefault();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      handleHuePointerMove(clientX);
    };

    const onEnd = () => {
      isDraggingHue.current = false;
    };

    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [handleHuePointerMove]);

  // Copy HEX action
  const handleCopyHex = () => {
    navigator.clipboard?.writeText(currentColor.toUpperCase());
    setCopiedHex(true);
    setTimeout(() => setCopiedHex(false), 1500);
  };

  // Combined unique active palette colors (custom + document colors)
  const activeSwatches = useMemo(() => {
    const combined = [...customPalette, ...documentColors].filter(Boolean);
    const set = new Set<string>();
    const result: string[] = [];
    for (const c of combined) {
      const lower = c.toLowerCase();
      if (!set.has(lower)) {
        set.add(lower);
        result.push(c);
      }
    }
    return result;
  }, [customPalette, documentColors]);

  // -------------------------------------------------------------------------
  // RENDER COMPONENT: CHROMATIC SELECTOR (TRADITIONAL COLOR BOX)
  // -------------------------------------------------------------------------
  const renderChromaticSelector = () => {
    return (
      <div className="w-full bg-black/40 backdrop-blur-md rounded-3xl p-4 border border-white/10 flex flex-col gap-4 shadow-xl">
        {/* 1. Expansive 2D SV Box (Traditional Color Box) */}
        <div
          ref={boxRef}
          onMouseDown={(e) => {
            isDraggingBox.current = true;
            handleBoxPointerMove(e.clientX, e.clientY);
          }}
          onTouchStart={(e) => {
            if (e.cancelable) e.preventDefault();
            isDraggingBox.current = true;
            handleBoxPointerMove(e.touches[0].clientX, e.touches[0].clientY);
          }}
          className="relative w-full h-52 rounded-2xl cursor-crosshair overflow-hidden border-2 border-white/20 shadow-md touch-none select-none"
          style={{
            backgroundColor: `hsl(${hue}, 100%, 50%)`,
            backgroundImage: `
              linear-gradient(to right, #ffffff 0%, rgba(255, 255, 255, 0) 100%),
              linear-gradient(to top, #000000 0%, rgba(0, 0, 0, 0) 100%)
            `
          }}
        >
          {/* Traditional Square Box Cursor */}
          <div
            className="absolute w-6 h-6 -ml-3 -mt-3 rounded-sm border-2 border-white shadow-[0_0_10px_rgba(0,0,0,0.9)] pointer-events-none ring-2 ring-[#C8A96A] flex items-center justify-center"
            style={{
              left: `${sat}%`,
              top: `${100 - val}%`,
              backgroundColor: currentColor
            }}
          >
            <div className="w-1.5 h-1.5 rounded-[1px] bg-white shadow-xs" />
          </div>
        </div>

        {/* 2. Rainbow Hue Bar Slider */}
        <div className="flex flex-col gap-1.5 px-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Matiz Cromático (Hue)</span>
            <span className="text-[#C8A96A] font-mono font-bold bg-black/50 px-2 py-0.5 rounded-md border border-white/10">
              {hue}°
            </span>
          </div>

          <div
            ref={hueSliderRef}
            onMouseDown={(e) => {
              isDraggingHue.current = true;
              handleHuePointerMove(e.clientX);
            }}
            onTouchStart={(e) => {
              if (e.cancelable) e.preventDefault();
              isDraggingHue.current = true;
              handleHuePointerMove(e.touches[0].clientX);
            }}
            className="relative h-7 w-full rounded-full cursor-pointer overflow-hidden border-2 border-white/20 touch-none shadow-inner select-none"
            style={{
              background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
            }}
          >
            <div
              className="absolute top-0 bottom-0 w-7 -ml-3.5 rounded-full bg-white border-2 border-[#C8A96A] shadow-md pointer-events-none flex items-center justify-center"
              style={{ left: `${(hue / 360) * 100}%` }}
            >
              <div className="w-2 h-2 rounded-full bg-[#C8A96A]" />
            </div>
          </div>
        </div>

        {/* 3. Luminosity / Brightness Slider */}
        <div className="flex flex-col gap-1.5 px-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#C8A96A]" />
              <span>Luminosidad / Brillo</span>
            </span>
            <span className="text-[#C8A96A] font-mono font-bold bg-black/50 px-2 py-0.5 rounded-md border border-white/10">
              {val}%
            </span>
          </div>

          <div
            ref={valSliderRef}
            onMouseDown={(e) => {
              isDraggingVal.current = true;
              handleValPointerMove(e.clientX);
            }}
            onTouchStart={(e) => {
              if (e.cancelable) e.preventDefault();
              isDraggingVal.current = true;
              handleValPointerMove(e.touches[0].clientX);
            }}
            className="relative h-7 w-full rounded-full cursor-pointer overflow-hidden border-2 border-white/20 touch-none shadow-inner select-none"
            style={{
              background: `linear-gradient(to right, #000000 0%, ${pureHueHex} 100%)`
            }}
          >
            <div
              className="absolute top-0 bottom-0 w-7 -ml-3.5 rounded-full bg-white border-2 border-[#C8A96A] shadow-[0_0_8px_rgba(0,0,0,0.8)] pointer-events-none ring-1 ring-black/40 flex items-center justify-center"
              style={{ left: `${val}%` }}
            >
              <div className="w-2 h-2 rounded-full bg-[#C8A96A]" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // RENDER COMPONENT: EXPANSIVE & SPACIOUS SWATCHES SECTION (TIRAS DE MUESTRAS DESPEJADAS)
  // -------------------------------------------------------------------------
  const renderSwatchesSection = () => {
    return (
      <div className="w-full bg-black/40 backdrop-blur-md rounded-3xl p-3.5 border border-white/10 flex flex-col gap-3 shadow-xl">
        {/* Header with Title and Add Button */}
        <div className="flex items-center justify-between px-1 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <PaletteIcon className="w-4 h-4 text-[#C8A96A]" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
              Paleta Activa
            </span>
            <span className="text-[11px] text-[#C8A96A] font-mono font-bold bg-black/50 px-1.5 py-0.5 rounded-md border border-white/10">
              {activeSwatches.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {onInvertPalette && activeSwatches.length > 1 && (
              <button
                type="button"
                onClick={onInvertPalette}
                className="min-h-[32px] px-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-white/10 transition active:scale-95 touch-manipulation cursor-pointer"
                title={translate('colors.invertPalette', language) || 'Invertir paleta'}
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-[#C8A96A]" />
                <span className="hidden min-[380px]:inline text-[11px]">{translate('colors.invertPalette', language) || 'Invertir'}</span>
              </button>
            )}

            {onClearCustomPalette && (customPalette.length > 0 || activeSwatches.length > 0) && (
              <button
                type="button"
                onClick={onClearCustomPalette}
                className="min-h-[32px] px-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-semibold flex items-center gap-1 border border-red-500/20 transition active:scale-95 touch-manipulation cursor-pointer"
                title={translate('colors.clearPalette', language) || 'Limpiar paleta'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden min-[380px]:inline text-[11px]">{translate('colors.clearPalette', language) || 'Limpiar'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onAddToCustomPalette?.(currentColor)}
              className="min-h-[32px] px-3 rounded-xl bg-[#C8A96A] text-[#102419] hover:bg-white text-xs font-black flex items-center gap-1.5 transition active:scale-95 touch-manipulation cursor-pointer shadow-md"
              title="Guardar color actual en la paleta"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Añadir</span>
            </button>
          </div>
        </div>

        {/* Spacious Swatches Grid / Tiras */}
        <div className="w-full">
          {activeSwatches.length === 0 ? (
            <div className="text-xs text-slate-400 py-4 px-2 text-center italic bg-white/[0.02] rounded-2xl border border-white/5">
              Presiona "Añadir Color" para guardar colores en tu paleta activa.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2.5 max-h-[160px] overflow-y-auto p-1 scrollbar-thin">
              {activeSwatches.map((color, idx) => {
                const isSelected = currentColor.toLowerCase() === color.toLowerCase();
                return (
                  <button
                    key={`${color}-${idx}`}
                    onClick={() => onChangeColor(color)}
                    className={`relative w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl transition-all duration-150 active:scale-90 touch-manipulation cursor-pointer flex items-center justify-center ${
                      isSelected 
                        ? 'scale-110 ring-2 ring-[#C8A96A] ring-offset-2 ring-offset-[#0B1A13] shadow-[0_0_14px_rgba(200,169,106,0.7)] z-10' 
                        : 'hover:scale-105 border border-white/20 shadow-sm'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  >
                    {isSelected && (
                      <Check className="w-4 h-4 stroke-[3.5] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // RENDER COMPONENT: RETRO PRESET PALETTES LIST
  // -------------------------------------------------------------------------
  const renderRetroPalettes = () => {
    return (
      <div className="w-full bg-black/40 backdrop-blur-md rounded-3xl p-3.5 border border-white/10 flex flex-col gap-3 shadow-xl max-h-[380px] overflow-y-auto">
        <div className="flex items-center gap-1.5 px-1">
          <Sparkles className="w-4 h-4 text-[#C8A96A]" />
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
            Paletas Retro Clásicas
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {RETRO_PALETTES.map((preset) => (
            <div 
              key={preset.name}
              className="bg-black/50 rounded-2xl p-3 border border-white/10 flex flex-col gap-2 hover:border-[#C8A96A]/50 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <span>{preset.name}</span>
                  <span className="text-[10px] text-[#C8A96A] font-mono font-bold bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                    {preset.count} colores
                  </span>
                </span>

                <button
                  onClick={() => onLoadPalette?.(preset.name, preset.colors)}
                  className="min-h-[28px] px-3 rounded-lg bg-[#C8A96A] text-[#102419] font-black text-xs hover:bg-white active:scale-95 transition touch-manipulation cursor-pointer shadow-sm"
                >
                  Cargar Paleta
                </button>
              </div>

              {/* Palette swatches preview */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {preset.colors.map((c, i) => (
                  <button
                    key={`${preset.name}-${c}-${i}`}
                    onClick={() => onChangeColor(c)}
                    className="w-7 h-7 rounded-lg border border-white/20 active:scale-90 transition touch-manipulation cursor-pointer"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // RENDER COMPONENT: STATUS CAPSULE (CURRENT COLOR, SECONDARY, HEX)
  // -------------------------------------------------------------------------
  const renderStatusCapsule = () => {
    return (
      <div className="w-full bg-black/50 backdrop-blur-md px-3.5 py-2.5 rounded-3xl border border-white/10 flex items-center justify-between gap-2 shadow-lg">
        {/* Left: Active Color Chip with Secondary Swap */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <div 
              className="w-11 h-11 rounded-2xl border-2 border-white/80 shadow-md transition-transform shrink-0"
              style={{ backgroundColor: currentColor }}
            />
            {onSwapColors && (
              <button
                onClick={onSwapColors}
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-black shadow-md flex items-center justify-center transition active:scale-85 touch-manipulation cursor-pointer"
                style={{ backgroundColor: secondaryColor }}
                title="Alternar color primario y secundario"
              >
                <ArrowLeftRight className="w-2.5 h-2.5 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]" />
              </button>
            )}
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Color Seleccionado
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-sm font-extrabold text-white tracking-wider">
                {currentColor.toUpperCase()}
              </span>
              <button
                onClick={handleCopyHex}
                className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition active:scale-90"
                title="Copiar código HEX"
              >
                {copiedHex ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Quick Segmented Switcher for Modes */}
        <div className="flex items-center bg-black/60 p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setPickerMode('box')}
            className={`min-h-[34px] px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 touch-manipulation cursor-pointer ${
              pickerMode === 'box'
                ? 'bg-[#C8A96A] text-[#102419] shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Selector tradicional (Cuadro)"
          >
            <Grid className="w-4 h-4" />
            <span className="hidden min-[380px]:inline">Cuadro</span>
          </button>

          <button
            onClick={() => setPickerMode('presets')}
            className={`min-h-[34px] px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 touch-manipulation cursor-pointer ${
              pickerMode === 'presets'
                ? 'bg-[#C8A96A] text-[#102419] shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Paletas retro"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden min-[380px]:inline">Retro</span>
          </button>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // RENDER COMPONENT: OPACITY SLIDER
  // -------------------------------------------------------------------------
  const renderOpacitySlider = () => {
    if (!onChangeOpacity) return null;
    return (
      <div className="w-full bg-black/40 backdrop-blur-md rounded-2xl px-3.5 py-2.5 border border-white/10 flex items-center justify-between gap-3 shadow-md">
        <span className="text-xs font-bold text-slate-300 shrink-0">Opacidad</span>
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          onChange={(e) => onChangeOpacity(Number(e.target.value))}
          className="flex-1 accent-[#C8A96A] h-2.5 bg-slate-800 rounded-lg cursor-pointer"
        />
        <span className="font-mono text-xs font-extrabold text-[#C8A96A] shrink-0 w-11 text-right bg-black/50 px-1.5 py-0.5 rounded border border-white/10">
          {opacity}%
        </span>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // 1. LANDSCAPE VIEW: BALANCED TWO-COLUMN DESKTOP/MOBILE WORKSTATION
  // -------------------------------------------------------------------------
  if (isLandscape) {
    return (
      <div className="w-full h-full flex flex-col gap-3 select-none pb-1" id="mobile-color-picker-landscape">
        {/* Top: Status Header & Capsule */}
        {renderStatusCapsule()}

        {/* 2-Column Responsive Split */}
        <div className="flex-1 grid grid-cols-2 gap-3 min-h-0 overflow-hidden">
          {/* Left: Chromatic Wheel or Box */}
          <div className="flex flex-col justify-center items-center overflow-y-auto">
            {pickerMode !== 'presets' ? (
              renderChromaticSelector()
            ) : (
              renderRetroPalettes()
            )}
          </div>

          {/* Right: Spacious Swatches & Controls */}
          <div className="flex flex-col gap-2.5 overflow-y-auto pr-0.5">
            {pickerMode !== 'presets' && renderSwatchesSection()}
            {pickerMode === 'presets' && renderChromaticSelector()}
            {renderOpacitySlider()}
            {onClose && (
              <button
                onClick={onClose}
                className="w-full min-h-[42px] py-2 px-3 rounded-2xl bg-[#C8A96A] hover:bg-[#d6b778] active:scale-[0.98] text-[#102419] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg transition-all touch-manipulation cursor-pointer shrink-0 mt-1"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{translate('common.done', language) || 'Listo'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // 2. PORTRAIT VIEW: EXPANSIVE, PROMINENT VERTICAL STACK
  // -------------------------------------------------------------------------
  return (
    <div className="w-full flex flex-col gap-3.5 select-none pb-2" id="mobile-color-picker-portrait">
      {/* 1. Header: Color Status Capsule & Mode Switcher */}
      {renderStatusCapsule()}

      {/* 2. Main Chromatic Selector or Retro Palettes */}
      {pickerMode !== 'presets' ? (
        <>
          {renderChromaticSelector()}
          {renderSwatchesSection()}
        </>
      ) : (
        renderRetroPalettes()
      )}

      {/* 3. Opacity Slider */}
      {renderOpacitySlider()}

      {/* 4. Ready / Close Action Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="w-full min-h-[46px] py-2.5 px-4 rounded-2xl bg-[#C8A96A] hover:bg-[#d6b778] active:scale-[0.98] text-[#102419] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all touch-manipulation cursor-pointer mt-1"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{translate('common.done', language) || 'Listo para pintar'}</span>
        </button>
      )}
    </div>
  );
});

export default MobileColorPicker;
