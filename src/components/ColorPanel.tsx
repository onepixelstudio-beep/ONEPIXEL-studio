import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Palette, 
  Plus, 
  Save, 
  Pipette, 
  UploadCloud,
  Copy,
  Check,
  ArrowLeftRight,
  RotateCcw,
  Trash2,
  Sparkles,
  FlipHorizontal
} from 'lucide-react';
import { BRAND_COLORS } from '../branding/BrandTheme';
import { CanonicalPalette } from '../types';
import { hexToRgb, rgbToHex } from '../utils/colorUtils';
import { parseGpl } from '../utils/paletteParser';
import { translate } from '../i18n';
import { LanguageCode } from '../i18n/types';

export interface ColorPanelProps {
  currentColor: string;
  secondaryColor?: string;
  activeColorSlot?: 'primary' | 'secondary';
  onChangeColor: (color: string) => void;
  onChangeSecondaryColor?: (color: string) => void;
  onSwapColors?: () => void;
  onResetDefaultColors?: () => void;
  onChangeActiveColorSlot?: (slot: 'primary' | 'secondary') => void;
  opacity?: number;
  onChangeOpacity?: (opacity: number) => void;
  documentColors?: string[]; // Colors detected strictly on the active document canvas
  customPalette?: string[];
  onAddToCustomPalette?: (color: string) => void;
  onRemoveFromCustomPalette?: (color: string) => void;
  onInvertPalette?: () => void;
  onClearCustomPalette?: () => void;
  onSavePaletteToLibrary?: () => void;
  onOpenLibrary?: (tab?: string) => void;
  recentColors?: string[];
  onClearRecentColors?: () => void;
  onSaveRecentAsPalette?: () => void;
  language?: string;
  libraryPalettes?: CanonicalPalette[] | any[];
  onLoadPalette?: (colors: string[]) => void;
  showToast?: (msg: string, type?: string) => void;
  [key: string]: any;
}

// Default Presets
const PRESET_PALETTES = [
  {
    name: 'OnePixel Studio',
    colors: ['#0f3d34', '#102419', '#c8a96a', '#f7f6f1', '#e6f0e9', '#000000', '#ffffff', '#1a5245']
  },
  {
    name: 'PICO-8',
    colors: [
      '#000000', '#1d2b53', '#7e2553', '#008751', '#ab5236', '#5f574f', '#c2c3c7', '#fff1e8',
      '#ff004d', '#ffa300', '#ffec27', '#00e436', '#29adff', '#83769c', '#ff77a8', '#ffccaa'
    ]
  },
  {
    name: 'DawnBringer 16',
    colors: [
      '#140c1c', '#442434', '#30346d', '#4e4a4e', '#854c30', '#346524', '#d04648', '#757161',
      '#597dce', '#d27d2c', '#8595a1', '#6daa2c', '#d2aa99', '#6dc2ca', '#e6ce6a', '#f4f4f4'
    ]
  },
  {
    name: 'GameBoy Classic',
    colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f']
  },
  {
    name: 'Cyberpunk Neon',
    colors: ['#050505', '#2b0938', '#7a1c74', '#bf2376', '#f73859', '#232057', '#00aa90', '#00e5ff', '#ffff00', '#ff007f']
  }
];

function rgbToHsv(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
}

function hsvToRgb(h: number, s: number, v: number) {
  h /= 360; s /= 100; v /= 100;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r = 0, g = 0, b = 0;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

export const ColorPanel: React.FC<ColorPanelProps> = ({
  currentColor,
  secondaryColor = '#FFFFFF',
  activeColorSlot = 'primary',
  onChangeColor,
  onChangeSecondaryColor,
  onSwapColors,
  onResetDefaultColors,
  onChangeActiveColorSlot,
  opacity = 100,
  onChangeOpacity,
  documentColors = [],
  customPalette = [],
  onAddToCustomPalette,
  onRemoveFromCustomPalette,
  onInvertPalette,
  onClearCustomPalette,
  onSavePaletteToLibrary,
  onOpenLibrary,
  recentColors = [],
  onClearRecentColors,
  onSaveRecentAsPalette,
  language = 'es',
  libraryPalettes = [],
  onLoadPalette,
  showToast
}) => {
  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    return translate(`colorPanel.${key}`, language as LanguageCode, params);
  }, [language]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hexInput, setHexInput] = useState<string>(currentColor || '#000000');
  const [copiedHex, setCopiedHex] = useState(false);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);

  // Sync selectedPresetIndex when customPalette changes
  useEffect(() => {
    let matchedIndex = -1;
    if (selectedPresetIndex >= 0 && selectedPresetIndex < PRESET_PALETTES.length) {
      const presetColors = PRESET_PALETTES[selectedPresetIndex].colors;
      if (
        presetColors.length === customPalette.length &&
        presetColors.every((c, i) => c.toLowerCase() === (customPalette[i] || '').toLowerCase())
      ) {
        matchedIndex = selectedPresetIndex;
      }
    } else if (selectedPresetIndex >= PRESET_PALETTES.length && libraryPalettes) {
      const libIdx = selectedPresetIndex - PRESET_PALETTES.length;
      const libPalette = libraryPalettes[libIdx];
      if (libPalette && libPalette.colors) {
        if (
          libPalette.colors.length === customPalette.length &&
          libPalette.colors.every((c: string, i: number) => c.toLowerCase() === (customPalette[i] || '').toLowerCase())
        ) {
          matchedIndex = selectedPresetIndex;
        }
      }
    }

    if (matchedIndex === -1) {
      const foundIdx = PRESET_PALETTES.findIndex(p =>
        p.colors.length === customPalette.length &&
        p.colors.every((c, i) => c.toLowerCase() === (customPalette[i] || '').toLowerCase())
      );
      if (foundIdx !== -1) {
        setSelectedPresetIndex(foundIdx);
      } else {
        setSelectedPresetIndex(-1);
      }
    }
  }, [customPalette, libraryPalettes]);

  // Derive HSV from currentColor
  const rgb = hexToRgb(currentColor || '#000000');
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);

  useEffect(() => {
    if (currentColor) {
      setHexInput(currentColor.toUpperCase());
    }
  }, [currentColor]);

  const updateColorFromHsv = useCallback((h: number, s: number, v: number) => {
    const newRgb = hsvToRgb(h, s, v);
    const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setHexInput(hex.toUpperCase());
    onChangeColor(hex);
  }, [onChangeColor]);

  // Render 2D Saturation/Value Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Fill Hue color base
    const pureHueRgb = hsvToRgb(hsv.h, 100, 100);
    ctx.fillStyle = `rgb(${pureHueRgb.r}, ${pureHueRgb.g}, ${pureHueRgb.b})`;
    ctx.fillRect(0, 0, width, height);

    // Horizontal White Gradient (Saturation 0 -> 100)
    const whiteGrad = ctx.createLinearGradient(0, 0, width, 0);
    whiteGrad.addColorStop(0, 'rgba(255,255,255,1)');
    whiteGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = whiteGrad;
    ctx.fillRect(0, 0, width, height);

    // Vertical Black Gradient (Value 100 -> 0)
    const blackGrad = ctx.createLinearGradient(0, 0, 0, height);
    blackGrad.addColorStop(0, 'rgba(0,0,0,0)');
    blackGrad.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = blackGrad;
    ctx.fillRect(0, 0, width, height);
  }, [hsv.h]);

  // Canvas Mouse / Pointer Interaction
  const handleCanvasInteraction = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    let x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    let y = Math.max(0, Math.min(rect.height, clientY - rect.top));

    const s = Math.round((x / rect.width) * 100);
    const v = Math.round((1 - y / rect.height) * 100);

    updateColorFromHsv(hsv.h, s, v);
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    let cleanHex = val.trim();
    if (!cleanHex.startsWith('#')) cleanHex = '#' + cleanHex;
    if (/^#[0-9A-Fa-f]{6}$/.test(cleanHex)) {
      onChangeColor(cleanHex);
    }
  };

  const handleCopyHex = () => {
    navigator.clipboard.writeText(currentColor.toUpperCase()).then(() => {
      setCopiedHex(true);
      if (showToast) showToast(t('hexCopied'), 'info');
      setTimeout(() => setCopiedHex(false), 1500);
    });
  };

  const handlePickEyeDropper = async () => {
    if ('EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
          onChangeColor(result.sRGBHex);
        }
      } catch (err) {
        // Canceled
      }
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          const colors = parseGpl(content);
          if (colors && colors.length > 0) {
            if (onLoadPalette) onLoadPalette(colors);
            if (showToast) showToast(t('colorsImported', { count: colors.length }), 'success');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  // Consolidate document colors and recent colors into the official Document Swatches box
  const consolidatedDocColors = React.useMemo(() => {
    const set = new Set<string>();
    const list: string[] = [];
    (documentColors || []).forEach(col => {
      const norm = col.toLowerCase();
      if (!set.has(norm) && norm !== '#00000000' && norm !== 'transparent') {
        set.add(norm);
        list.push(col);
      }
    });
    (recentColors || []).forEach(col => {
      const norm = col.toLowerCase();
      if (!set.has(norm) && norm !== '#00000000' && norm !== 'transparent') {
        set.add(norm);
        list.push(col);
      }
    });
    return list;
  }, [documentColors, recentColors]);

  return (
    <div 
      className="flex flex-col gap-2 p-2 rounded-xl border text-xs select-none w-full shadow-lg h-full min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin"
      style={{
        backgroundColor: BRAND_COLORS.surfaceSecondary,
        borderColor: BRAND_COLORS.border,
        color: BRAND_COLORS.monoLight
      }}
    >
      {/* 1. CABECERA Y ACCIONES DE PALETA DE COLORES */}
      <div className="flex flex-col gap-1 bg-black/30 p-1.5 rounded-lg border shrink-0" style={{ borderColor: BRAND_COLORS.borderSubtle }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold font-mono text-[10px] uppercase text-[#C8A96A]">
            <Palette className="w-3.5 h-3.5" />
            <span>{t('title')}</span>
          </div>

          {/* 2. ACCIONES: Nueva Paleta, Guardar e Importar */}
          <div className="flex items-center gap-1">
            {onClearCustomPalette && (
              <button
                onClick={onClearCustomPalette}
                className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition cursor-pointer"
                title={t('newPalette')}
              >
                <Plus className="w-3 h-3" />
              </button>
            )}

            {onSavePaletteToLibrary && (
              <button
                onClick={onSavePaletteToLibrary}
                className="p-1 rounded bg-[#C8A96A]/20 hover:bg-[#C8A96A]/30 text-[#C8A96A] border border-[#C8A96A]/30 transition cursor-pointer"
                title={t('savePalette')}
              >
                <Save className="w-3 h-3" />
              </button>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition cursor-pointer"
              title={t('importPalette')}
            >
              <UploadCloud className="w-3 h-3" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImportFile} 
              accept=".gpl,.pal" 
              className="hidden" 
            />
          </div>
        </div>

        {/* 3. SELECTOR DE PALETA */}
        <select
          value={selectedPresetIndex}
          onChange={(e) => {
            const idx = Number(e.target.value);
            setSelectedPresetIndex(idx);
            if (idx >= 0 && PRESET_PALETTES[idx] && onLoadPalette) {
              onLoadPalette(PRESET_PALETTES[idx].colors);
            } else if (idx >= PRESET_PALETTES.length && libraryPalettes) {
              const libIdx = idx - PRESET_PALETTES.length;
              if (libraryPalettes[libIdx] && onLoadPalette) {
                onLoadPalette(libraryPalettes[libIdx].colors);
              }
            }
          }}
          className="w-full bg-black/60 border border-white/20 text-[10px] text-[#C8A96A] rounded px-1.5 py-0.5 focus:outline-none focus:border-[#C8A96A] font-mono cursor-pointer"
        >
          <option value={-1}>
            {t('customEdited')} ({customPalette.length} {t('colors')})
          </option>
          {PRESET_PALETTES.map((p, idx) => (
            <option key={p.name} value={idx}>
              {p.name} ({p.colors.length} {t('colors')})
            </option>
          ))}
          {libraryPalettes && libraryPalettes.map((p: any, idx: number) => (
            <option key={p.id || idx} value={PRESET_PALETTES.length + idx}>
              {p.name} ({p.colors?.length || 0})
            </option>
          ))}
        </select>
      </div>

      {/* 4. BLOQUE PRINCIPAL: CUADRO HSV 2D + BARRA VERTICAL DE TONO (HUE) UNIFICADOS */}
      <div className="flex gap-1 bg-[#030408] p-1 rounded-lg border relative shadow-inner shrink-0 items-stretch" style={{ borderColor: BRAND_COLORS.borderSubtle }}>
        {/* Cuadro HSV 2D (Maximizando el espacio del panel) */}
        <div className="flex-1 relative w-full h-[200px] rounded overflow-hidden border border-white/20 cursor-crosshair">
          <canvas
            ref={canvasRef}
            width={300}
            height={200}
            className="w-full h-full block touch-none"
            onMouseDown={(e) => {
              setIsDraggingCanvas(true);
              handleCanvasInteraction(e);
            }}
            onMouseMove={(e) => {
              if (isDraggingCanvas) handleCanvasInteraction(e);
            }}
            onMouseUp={() => setIsDraggingCanvas(false)}
            onMouseLeave={() => setIsDraggingCanvas(false)}
            onTouchStart={(e) => {
              setIsDraggingCanvas(true);
              handleCanvasInteraction(e);
            }}
            onTouchMove={(e) => {
              if (isDraggingCanvas) handleCanvasInteraction(e);
            }}
            onTouchEnd={() => setIsDraggingCanvas(false)}
          />

          {/* Cursor selector de objetivo (Doble anillo de alto contraste) */}
          <div
            className="absolute w-4 h-4 rounded-full border-2 border-white shadow-xl pointer-events-none -translate-x-1/2 -translate-y-1/2 ring-2 ring-black/90 transition-transform active:scale-125"
            style={{
              left: `${hsv.s}%`,
              top: `${100 - hsv.v}%`,
              backgroundColor: currentColor
            }}
          >
            <div className="w-1 h-1 rounded-full bg-white mx-auto mt-1 border border-black" />
          </div>
        </div>

        {/* Barra Vertical de Tono (Hue) pegada al selector HSV con exactamente la misma altura */}
        <div 
          className="w-5 h-[200px] rounded border border-white/20 relative cursor-pointer overflow-hidden shrink-0 touch-none shadow-md"
          style={{
            background: 'linear-gradient(to bottom, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
          }}
          onMouseDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const updateHue = (clientY: number) => {
              const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
              const h = Math.round((y / rect.height) * 360);
              updateColorFromHsv(h, hsv.s, hsv.v);
            };
            updateHue(e.clientY);
            const onMouseMove = (me: MouseEvent) => updateHue(me.clientY);
            const onMouseUp = () => {
              window.removeEventListener('mousemove', onMouseMove);
              window.removeEventListener('mouseup', onMouseUp);
            };
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
          }}
          onTouchStart={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const touch = e.touches[0];
            const y = Math.max(0, Math.min(rect.height, touch.clientY - rect.top));
            const h = Math.round((y / rect.height) * 360);
            updateColorFromHsv(h, hsv.s, hsv.v);
          }}
          onTouchMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const touch = e.touches[0];
            const y = Math.max(0, Math.min(rect.height, touch.clientY - rect.top));
            const h = Math.round((y / rect.height) * 360);
            updateColorFromHsv(h, hsv.s, hsv.v);
          }}
          title={t('hue')}
        >
          {/* Hue Indicator Slider Pin */}
          <div 
            className="absolute left-0 w-full h-1.5 border-y border-white bg-black/70 pointer-events-none -translate-y-1/2 shadow-lg ring-1 ring-black"
            style={{ top: `${(hsv.h / 360) * 100}%` }}
          />
        </div>
      </div>

      {/* 5. SLIDERS DE SATURACIÓN Y BRILLO (VALOR) */}
      <div className="flex flex-col gap-1 bg-black/30 p-1.5 rounded-lg border shrink-0" style={{ borderColor: BRAND_COLORS.borderSubtle }}>
        {/* Slider Saturación */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-bold text-gray-400 w-16 shrink-0">{t('saturation')}</span>
          <input
            type="range"
            min="0"
            max="100"
            value={hsv.s}
            onChange={(e) => updateColorFromHsv(hsv.h, Number(e.target.value), hsv.v)}
            className="w-full h-1.5 rounded appearance-none cursor-pointer border border-white/20 accent-[#C8A96A]"
            style={{
              background: `linear-gradient(to right, ${rgbToHex(hsvToRgb(hsv.h, 0, hsv.v).r, hsvToRgb(hsv.h, 0, hsv.v).g, hsvToRgb(hsv.h, 0, hsv.v).b)}, ${rgbToHex(hsvToRgb(hsv.h, 100, hsv.v).r, hsvToRgb(hsv.h, 100, hsv.v).g, hsvToRgb(hsv.h, 100, hsv.v).b)})`
            }}
          />
          <span className="text-[10px] font-mono font-bold text-[#C8A96A] w-7 text-right shrink-0">{hsv.s}%</span>
        </div>

        {/* Slider Brillo (Valor) */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-bold text-gray-400 w-16 shrink-0">{t('brightness')}</span>
          <input
            type="range"
            min="0"
            max="100"
            value={hsv.v}
            onChange={(e) => updateColorFromHsv(hsv.h, hsv.s, Number(e.target.value))}
            className="w-full h-1.5 rounded appearance-none cursor-pointer border border-white/20 accent-[#C8A96A]"
            style={{
              background: `linear-gradient(to right, #000000, ${rgbToHex(hsvToRgb(hsv.h, hsv.s, 100).r, hsvToRgb(hsv.h, hsv.s, 100).g, hsvToRgb(hsv.h, hsv.s, 100).b)})`
            }}
          />
          <span className="text-[10px] font-mono font-bold text-[#C8A96A] w-7 text-right shrink-0">{hsv.v}%</span>
        </div>

        {/* 6. BARRA ULTRA-COMPACTA: Muestra Doble (Photoshop/Aseprite) + Swap/Reset | HEX | Copiar | Pipeta | Picker */}
        <div className="flex items-center justify-between gap-1 border-t pt-1.5" style={{ borderColor: BRAND_COLORS.borderSubtle }}>
          {/* Grupo Muestra Doble (Primario / Secundario) + Swap + Restablecer B/N */}
          <div className="flex items-center gap-1 shrink-0">
            <div className="relative w-6 h-6 shrink-0" title={t('primarySecondary')}>
              {/* Secondary Color Swatch (Aseprite/Photoshop Back) */}
              <button
                onClick={() => {
                  if (onChangeActiveColorSlot) onChangeActiveColorSlot('secondary');
                }}
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded border shadow-md cursor-pointer transition ${
                  activeColorSlot === 'secondary' ? 'ring-1 ring-[#C8A96A] border-white z-10' : 'border-white/30 opacity-80 z-0'
                }`}
                style={{ backgroundColor: secondaryColor || '#FFFFFF' }}
                title={t('secondaryColor')}
              />
              {/* Primary Color Swatch (Aseprite/Photoshop Front) */}
              <button
                onClick={() => {
                  if (onChangeActiveColorSlot) onChangeActiveColorSlot('primary');
                }}
                className={`absolute top-0 left-0 w-4.5 h-4.5 rounded border shadow-md cursor-pointer transition ${
                  activeColorSlot === 'primary' ? 'ring-1 ring-[#C8A96A] border-white z-20' : 'border-white/30 opacity-80 z-10'
                }`}
                style={{ backgroundColor: currentColor || '#000000' }}
                title={t('primaryColor')}
              />
            </div>

            {/* Intercambiar Primario/Secundario (Swap) */}
            <button
              onClick={() => {
                if (onSwapColors) {
                  onSwapColors();
                } else {
                  const primary = currentColor;
                  const secondary = secondaryColor || '#FFFFFF';
                  onChangeColor(secondary);
                  if (onChangeSecondaryColor) onChangeSecondaryColor(primary);
                }
              }}
              className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-[#C8A96A] transition cursor-pointer"
              title={t('swapColors')}
            >
              <ArrowLeftRight className="w-3 h-3" />
            </button>

            {/* Restablecer Blanco / Negro (Photoshop style default D key) */}
            <button
              onClick={() => {
                if (onResetDefaultColors) {
                  onResetDefaultColors();
                } else {
                  onChangeColor('#000000');
                  if (onChangeSecondaryColor) onChangeSecondaryColor('#ffffff');
                }
              }}
              className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
              title={t('resetDefault')}
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Grupo HEX Input + Copiar */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono font-bold text-[#C8A96A]">HEX</span>
            <input
              type="text"
              value={hexInput}
              onChange={handleHexChange}
              className="w-16 px-1 py-0.5 rounded text-center text-[10px] bg-black/60 border border-white/20 font-mono tracking-wider focus:outline-none focus:border-[#C8A96A] text-slate-100 font-bold"
              maxLength={7}
            />
            <button
              onClick={handleCopyHex}
              className="p-1 rounded hover:bg-white/10 text-gray-300 hover:text-white transition cursor-pointer"
              title={t('copyHex')}
            >
              {copiedHex ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          {/* Grupo Pipeta y Picker Nativo */}
          <div className="flex items-center gap-1 shrink-0">
            {'EyeDropper' in window && (
              <button
                onClick={handlePickEyeDropper}
                className="p-1 rounded bg-white/5 hover:bg-[#C8A96A]/20 text-[#C8A96A] border border-[#C8A96A]/30 transition cursor-pointer"
                title={t('eyedropper')}
              >
                <Pipette className="w-3 h-3" />
              </button>
            )}

            <input
              type="color"
              value={currentColor.startsWith('#') && currentColor.length === 7 ? currentColor : '#000000'}
              onChange={(e) => onChangeColor(e.target.value)}
              className="w-5 h-5 p-0 border-0 rounded cursor-pointer bg-transparent"
              title={t('nativePicker')}
            />
          </div>
        </div>
      </div>

      {/* 6.5 PALETA PERSONALIZADA / ACTIVAS */}
      <div className="flex flex-col gap-1 bg-black/30 p-2 rounded-lg border shrink-0 w-full min-w-0 box-border overflow-hidden" style={{ borderColor: BRAND_COLORS.borderSubtle }}>
        <div className="flex flex-wrap items-center justify-between border-b pb-1 gap-1 min-w-0" style={{ borderColor: BRAND_COLORS.borderSubtle }}>
          <div className="flex items-center gap-1 font-mono font-bold text-[10px] text-slate-300 uppercase tracking-wider min-w-0">
            <Palette className="w-3 h-3 text-[#C8A96A] shrink-0" />
            <span className="truncate">{t('activePalette')}</span>
            <span className="text-[10px] font-mono text-[#C8A96A] shrink-0">
              ({customPalette.length})
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-auto">
            {/* Añadir color actual */}
            {onAddToCustomPalette && (
              <button
                onClick={() => onAddToCustomPalette(currentColor)}
                className="p-1 rounded bg-white/5 hover:bg-[#C8A96A]/20 text-[#C8A96A] border border-[#C8A96A]/30 transition cursor-pointer"
                title={t('addColor')}
              >
                <Plus className="w-3 h-3" />
              </button>
            )}

            {/* Invertir colores */}
            {onInvertPalette && (
              <button
                onClick={onInvertPalette}
                className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition cursor-pointer"
                title={t('invertPalette')}
              >
                <FlipHorizontal className="w-3 h-3" />
              </button>
            )}

            {/* Limpiar paleta / Nueva paleta */}
            {onClearCustomPalette && (
              <button
                onClick={() => {
                  onClearCustomPalette();
                  setSelectedPresetIndex(-1);
                }}
                className="p-1 rounded bg-white/5 hover:bg-red-500/20 text-gray-300 hover:text-red-400 transition cursor-pointer"
                title={t('clearPalette')}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {customPalette.length === 0 ? (
          <div className="py-2 text-center text-gray-500 italic text-[11px]">
            {t('emptyPalette')}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto overflow-x-hidden w-full p-1 bg-black/40 rounded border border-white/10 scrollbar-thin">
            {customPalette.map((col, idx) => (
              <div key={`${col}-${idx}`} className="relative group/swatch flex items-center justify-center shrink-0">
                <button
                  onClick={() => onChangeColor(col)}
                  className={`w-6 h-6 rounded border transition-all hover:scale-110 shadow-sm cursor-pointer ${
                    currentColor.toLowerCase() === col.toLowerCase() ? 'ring-2 ring-[#C8A96A] border-white z-10 scale-105' : 'border-white/20'
                  }`}
                  style={{ backgroundColor: col }}
                  title={col.toUpperCase()}
                />
                {onRemoveFromCustomPalette && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFromCustomPalette(col);
                    }}
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-600 text-white flex items-center justify-center text-[9px] font-bold opacity-0 group-hover/swatch:opacity-100 transition shadow cursor-pointer z-20"
                    title={t('removeSwatch')}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. MUESTRAS DEL DOCUMENTO (CONSOLIDADO) */}
      <div className="flex flex-col gap-1 bg-black/30 p-2 rounded-lg border shrink-0" style={{ borderColor: BRAND_COLORS.borderSubtle }}>
        <div className="flex items-center justify-between border-b pb-1 gap-1" style={{ borderColor: BRAND_COLORS.borderSubtle }}>
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider truncate">
              {t('documentSwatches')}
            </span>
            <span className="text-[10px] font-mono text-[#C8A96A] shrink-0">
              ({consolidatedDocColors.length})
            </span>
          </div>

          {onClearRecentColors && recentColors && recentColors.length > 0 && (
            <button
              onClick={onClearRecentColors}
              className="p-1 rounded bg-white/5 hover:bg-red-500/20 text-gray-300 hover:text-red-400 transition cursor-pointer shrink-0"
              title={t('clearHistory')}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>

        {consolidatedDocColors.length === 0 ? (
          <div className="py-2 text-center text-gray-500 italic text-[11px]">
            {t('noColorsDetected')}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1 max-h-28 overflow-y-auto p-1 bg-black/40 rounded border border-white/10 scrollbar-thin">
            {consolidatedDocColors.map((col, idx) => (
              <button
                key={`${col}-${idx}`}
                onClick={() => onChangeColor(col)}
                className={`w-6 h-6 rounded border transition-all hover:scale-110 shadow-sm cursor-pointer ${
                  currentColor.toLowerCase() === col.toLowerCase() ? 'ring-2 ring-[#C8A96A] border-white z-10 scale-105' : 'border-white/20'
                }`}
                style={{ backgroundColor: col }}
                title={col.toUpperCase()}
              />
            ))}
          </div>
        )}
      </div>

      {/* 8. BOTÓN "GUARDAR MUESTRAS COMO PALETA" */}
      <div className="mt-auto pt-0.5 shrink-0">
        <button
          onClick={() => {
            if (onSaveRecentAsPalette) {
              onSaveRecentAsPalette();
            } else if (onSavePaletteToLibrary) {
              onSavePaletteToLibrary();
            }
            if (showToast) {
              showToast(t('swatchesSaved'), 'success');
            }
          }}
          disabled={consolidatedDocColors.length === 0}
          className="w-full py-1.5 px-2 rounded-lg bg-[#C8A96A]/20 hover:bg-[#C8A96A]/30 text-[#C8A96A] border border-[#C8A96A]/40 font-mono font-bold text-[11px] flex items-center justify-center gap-1.5 transition shadow cursor-pointer active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Save className="w-3.5 h-3.5 text-[#C8A96A]" />
          <span>{t('saveSwatchesAsPalette')}</span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(ColorPanel);
