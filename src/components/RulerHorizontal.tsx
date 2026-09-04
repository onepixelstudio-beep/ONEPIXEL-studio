import React, { useRef, useEffect } from 'react';
import { GUIDES_RULERS_THEME, calculateRulerStep } from '../utils/guideUtils';
import { translate, LanguageCode } from '../i18n';

interface RulerHorizontalProps {
  zoom: number;
  panX: number;
  width: number; // canvas width in pixels
  cursorX: number | null; // in canvas coordinate
  height?: number; // default 24
  onStartDragNewGuide?: (e: React.MouseEvent) => void;
  rulerBackground?: string;
  rulerTextColor?: string;
  rulerBorder?: string;
  theme?: string;
  themeColor?: string;
  language?: LanguageCode;
}

export const RulerHorizontal: React.FC<RulerHorizontalProps> = ({
  zoom,
  panX,
  width,
  cursorX,
  height = 24,
  onStartDragNewGuide,
  rulerBackground = GUIDES_RULERS_THEME.rulerBackground,
  rulerTextColor = GUIDES_RULERS_THEME.rulerTextColor,
  rulerBorder = GUIDES_RULERS_THEME.rulerBorder,
  theme,
  themeColor,
  language = 'es',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get screen width of container
    const rect = canvas.parentElement?.getBoundingClientRect();
    const dWidth = rect?.width || canvas.clientWidth || 800;
    
    // Set internal resolution with High DPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dWidth * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${dWidth}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);

    // Extract dynamic theme tokens
    const computed = window.getComputedStyle(canvas);
    const bg = '#0C1813'; // Clean, flat, dark obsidian background (Krita / Illustrator style)
    const border = '#1A382A'; // Crisp 1px boundary
    const text = '#8EAFA0'; // Ultra-legible muted mint font
    const tickColor = '#608472';
    const accentGold = '#C8A96A';
    const indicatorColor = computed.getPropertyValue('--ruler-indicator').trim() || '#C8A96A';

    // 1. Clean, flat, unified dark obsidian background across the entire ruler
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, dWidth, height);

    // 2. Crisp 1px bottom border
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height - 0.5);
    ctx.lineTo(dWidth, height - 0.5);
    ctx.stroke();

    // 3. Calculate adaptive scale step
    const step = calculateRulerStep(zoom);

    // Visible range in canvas coordinates
    const startCanvasX = Math.floor((-panX) / zoom);
    const endCanvasX = Math.ceil((dWidth - panX) / zoom);
    const alignedStart = Math.floor(startCanvasX / step) * step;

    // Font setup for crisp numerical labels in a single line
    ctx.font = '8.5px "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // 4. Draw ticks & labels
    for (let cx = alignedStart; cx <= endCanvasX; cx += step) {
      const sx = panX + cx * zoom;
      if (sx < -30 || sx > dWidth + 30) continue;

      const lineX = Math.round(sx) + 0.5;
      const isOrigin = cx === 0;
      const isBound = cx === width;

      // Major tick (6px height)
      const majorHeight = isOrigin || isBound ? 7 : 5.5;
      ctx.strokeStyle = isOrigin || isBound ? accentGold : tickColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lineX, height - 1);
      ctx.lineTo(lineX, height - 1 - majorHeight);
      ctx.stroke();

      // Number text in a single horizontal line
      ctx.fillStyle = isOrigin || isBound ? '#E5C378' : text;
      ctx.fillText(cx.toString(), Math.round(sx), 3);

      // Minor tick halfway between steps
      const nextSx = panX + (cx + step / 2) * zoom;
      if (nextSx >= 0 && nextSx <= dWidth) {
        const minorLineX = Math.round(nextSx) + 0.5;
        ctx.strokeStyle = '#325442';
        ctx.beginPath();
        ctx.moveTo(minorLineX, height - 1);
        ctx.lineTo(minorLineX, height - 1 - 3.5);
        ctx.stroke();
      }

      // Micro subdivision ticks if zoom spacing allows
      const pixelSpacing = step * zoom;
      if (pixelSpacing >= 60) {
        const subStep = step / 5;
        for (let s = 1; s <= 4; s++) {
          if (s === 2 || s === 3) continue;
          const subSx = panX + (cx + s * subStep) * zoom;
          if (subSx >= 0 && subSx <= dWidth) {
            const subLineX = Math.round(subSx) + 0.5;
            ctx.strokeStyle = '#1D3B2C';
            ctx.beginPath();
            ctx.moveTo(subLineX, height - 1);
            ctx.lineTo(subLineX, height - 1 - 2);
            ctx.stroke();
          }
        }
      }
    }

    // 5. Canvas fallback cursor indicator
    if (cursorX !== null) {
      const sx = panX + cursorX * zoom;
      if (sx >= 0 && sx <= dWidth) {
        const curX = Math.round(sx) + 0.5;
        ctx.strokeStyle = indicatorColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(curX, 0);
        ctx.lineTo(curX, height - 1);
        ctx.stroke();

        ctx.fillStyle = indicatorColor;
        ctx.beginPath();
        ctx.moveTo(curX - 2.5, height - 1);
        ctx.lineTo(curX + 2.5, height - 1);
        ctx.lineTo(curX, height - 4.5);
        ctx.closePath();
        ctx.fill();
      }
    }
  }, [zoom, panX, width, cursorX, height, rulerBackground, rulerTextColor, rulerBorder, theme, themeColor]);

  // Handle clicking on the ruler to add a guide (Photoshop / Illustrator style drag-to-create)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !onStartDragNewGuide) return;
    onStartDragNewGuide(e);
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        className="block cursor-crosshair select-none w-full h-full"
        title={translate('guides.rulerTooltip', language as any)}
        id="ruler-horizontal-canvas"
      />

      {/* Fluid Real-time Floating Marker (Krita / Illustrator style) */}
      <div
        id="ruler-indicator-h"
        className="absolute top-0 bottom-0 pointer-events-none z-20 transition-opacity duration-75"
        style={{
          left: 0,
          transform: 'translateX(-100px)',
          opacity: 0,
          willChange: 'transform'
        }}
      >
        {/* Needle Line */}
        <div className="w-[1px] h-full bg-[#C8A96A] shadow-[0_0_4px_rgba(200,169,106,0.6)]" />
        {/* Downward triangle pointer pip at canvas edge */}
        <div 
          className="absolute bottom-0 -left-[2.5px] w-0 h-0 border-l-[3px] border-r-[3px] border-t-[4px] border-l-transparent border-r-transparent border-t-[#E5C378]" 
        />
      </div>
    </div>
  );
};
