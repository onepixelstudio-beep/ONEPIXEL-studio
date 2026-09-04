import React, { useRef, useEffect } from 'react';
import { GUIDES_RULERS_THEME, calculateRulerStep } from '../utils/guideUtils';
import { translate, LanguageCode } from '../i18n';

interface RulerVerticalProps {
  zoom: number;
  panY: number;
  height: number; // canvas height in pixels
  cursorY: number | null; // in canvas coordinate
  width?: number; // default 24
  onStartDragNewGuide?: (e: React.MouseEvent) => void;
  rulerBackground?: string;
  rulerTextColor?: string;
  rulerBorder?: string;
  theme?: string;
  themeColor?: string;
  language?: LanguageCode;
}

export const RulerVertical: React.FC<RulerVerticalProps> = ({
  zoom,
  panY,
  height,
  cursorY,
  width = 24,
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

    // Get screen height of container
    const rect = canvas.parentElement?.getBoundingClientRect();
    const dHeight = rect?.height || canvas.clientHeight || 600;

    // Set internal resolution with High DPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = dHeight * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${dHeight}px`;

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
    ctx.fillRect(0, 0, width, dHeight);

    // 2. Crisp 1px right border
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width - 0.5, 0);
    ctx.lineTo(width - 0.5, dHeight);
    ctx.stroke();

    // 3. Calculate adaptive scale step
    const step = calculateRulerStep(zoom);

    // Visible range in canvas coordinates
    const startCanvasY = Math.floor((-panY) / zoom);
    const endCanvasY = Math.ceil((dHeight - panY) / zoom);
    const alignedStart = Math.floor(startCanvasY / step) * step;

    // Font setup for crisp numerical labels in a single line
    ctx.font = '8px "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    // 4. Draw ticks & labels
    for (let cy = alignedStart; cy <= endCanvasY; cy += step) {
      const sy = panY + cy * zoom;
      if (sy < -30 || sy > dHeight + 30) continue;

      const lineY = Math.round(sy) + 0.5;
      const isOrigin = cy === 0;
      const isBound = cy === height;

      // Major tick (6px width from right edge)
      const majorWidth = isOrigin || isBound ? 7 : 5.5;
      ctx.strokeStyle = isOrigin || isBound ? accentGold : tickColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(width - 1, lineY);
      ctx.lineTo(width - 1 - majorWidth, lineY);
      ctx.stroke();

      // Number text in a single horizontal line, right-aligned next to tick
      ctx.fillStyle = isOrigin || isBound ? '#E5C378' : text;
      ctx.fillText(cy.toString(), width - 8, Math.round(sy));

      // Minor tick halfway between steps
      const nextSy = panY + (cy + step / 2) * zoom;
      if (nextSy >= 0 && nextSy <= dHeight) {
        const minorLineY = Math.round(nextSy) + 0.5;
        ctx.strokeStyle = '#325442';
        ctx.beginPath();
        ctx.moveTo(width - 1, minorLineY);
        ctx.lineTo(width - 1 - 3.5, minorLineY);
        ctx.stroke();
      }

      // Micro subdivision ticks if zoom spacing allows
      const pixelSpacing = step * zoom;
      if (pixelSpacing >= 60) {
        const subStep = step / 5;
        for (let s = 1; s <= 4; s++) {
          if (s === 2 || s === 3) continue;
          const subSy = panY + (cy + s * subStep) * zoom;
          if (subSy >= 0 && subSy <= dHeight) {
            const subLineY = Math.round(subSy) + 0.5;
            ctx.strokeStyle = '#1D3B2C';
            ctx.beginPath();
            ctx.moveTo(width - 1, subLineY);
            ctx.lineTo(width - 1 - 2, subLineY);
            ctx.stroke();
          }
        }
      }
    }

    // 5. Canvas fallback cursor indicator
    if (cursorY !== null) {
      const sy = panY + cursorY * zoom;
      if (sy >= 0 && sy <= dHeight) {
        const curY = Math.round(sy) + 0.5;
        ctx.strokeStyle = indicatorColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, curY);
        ctx.lineTo(width - 1, curY);
        ctx.stroke();

        ctx.fillStyle = indicatorColor;
        ctx.beginPath();
        ctx.moveTo(width - 1, curY - 2.5);
        ctx.lineTo(width - 1, curY + 2.5);
        ctx.lineTo(width - 4.5, curY);
        ctx.closePath();
        ctx.fill();
      }
    }
  }, [zoom, panY, height, cursorY, width, rulerBackground, rulerTextColor, rulerBorder, theme, themeColor]);

  // Handle clicking on the vertical ruler to add a guide (Photoshop / Illustrator style drag-to-create)
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
        id="ruler-vertical-canvas"
      />

      {/* Fluid Real-time Floating Marker (Krita / Illustrator style) */}
      <div
        id="ruler-indicator-v"
        className="absolute left-0 right-0 pointer-events-none z-20 transition-opacity duration-75"
        style={{
          top: 0,
          transform: 'translateY(-100px)',
          opacity: 0,
          willChange: 'transform'
        }}
      >
        {/* Needle Line */}
        <div className="h-[1px] w-full bg-[#C8A96A] shadow-[0_0_4px_rgba(200,169,106,0.6)]" />
        {/* Rightward triangle pointer pip at canvas edge */}
        <div 
          className="absolute right-0 -top-[2.5px] w-0 h-0 border-t-[3px] border-b-[3px] border-l-[4px] border-t-transparent border-b-transparent border-l-[#E5C378]" 
        />
      </div>
    </div>
  );
};
