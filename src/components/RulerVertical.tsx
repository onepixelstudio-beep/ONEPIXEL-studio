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

    // Extract dynamic theme tokens from computed CSS variables
    const computed = window.getComputedStyle(canvas);
    const bg = computed.getPropertyValue('--ruler-bg').trim() || rulerBackground;
    const border = computed.getPropertyValue('--ruler-border').trim() || rulerBorder;
    const text = computed.getPropertyValue('--ruler-text').trim() || rulerTextColor;
    const tickColor = computed.getPropertyValue('--ruler-tick').trim() || border;
    const indicatorColor = computed.getPropertyValue('--ruler-indicator').trim() || computed.getPropertyValue('--theme-accent').trim() || '#C8A96A';

    // Clear background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, dHeight);

    // Draw right border
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width - 0.5, 0);
    ctx.lineTo(width - 0.5, dHeight);
    ctx.stroke();

    // Calculate Tick spacing based on zoom
    const step = calculateRulerStep(zoom);

    // We start drawing ticks. What is the visible range in canvas coordinate?
    const startCanvasY = Math.floor((-panY) / zoom);
    const endCanvasY = Math.ceil((dHeight - panY) / zoom);

    // Align start canvas Y to the step
    const alignedStart = Math.floor(startCanvasY / step) * step;

    ctx.fillStyle = text;
    ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let cy = alignedStart; cy <= endCanvasY; cy += step) {
      // Calculate screen Y
      const sy = panY + cy * zoom;

      // Ensure we don't draw out of ruler bounds
      if (sy < -10 || sy > dHeight + 10) continue;

      // Major tick (with text label)
      const majorWidth = 10;
      ctx.strokeStyle = tickColor;
      ctx.beginPath();
      ctx.moveTo(width - 1, sy);
      ctx.lineTo(width - 1 - majorWidth, sy);
      ctx.stroke();

      ctx.fillText(cy.toString(), width - 3, sy);

      // Minor tick halfway between steps
      const nextSy = panY + (cy + step / 2) * zoom;
      if (nextSy >= 0 && nextSy <= dHeight) {
        const minorWidth = 5;
        ctx.beginPath();
        ctx.moveTo(width - 1, nextSy);
        ctx.lineTo(width - 1 - minorWidth, nextSy);
        ctx.stroke();
      }
    }

    // Draw active cursor position indicator on the vertical ruler (Discreet 1px line, Requirement 6)
    if (cursorY !== null) {
      const sy = panY + cursorY * zoom;
      if (sy >= 0 && sy <= dHeight) {
        ctx.strokeStyle = indicatorColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, sy + 0.5);
        ctx.lineTo(width, sy + 0.5);
        ctx.stroke();
      }
    }
  }, [zoom, panY, height, cursorY, width, rulerBackground, rulerTextColor, rulerBorder, theme, themeColor]);

  // Handle clicking on the vertical ruler to add a guide (Requirement 2 / Photoshop style drag-to-create)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !onStartDragNewGuide) return;
    onStartDragNewGuide(e);
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      className="block cursor-crosshair select-none"
      title={translate('guides.rulerTooltip', language as any)}
      id="ruler-vertical-canvas"
    />
  );
};
