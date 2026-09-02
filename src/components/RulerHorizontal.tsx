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

    // Extract dynamic theme tokens from computed CSS variables
    const computed = window.getComputedStyle(canvas);
    const bg = computed.getPropertyValue('--ruler-bg').trim() || rulerBackground;
    const border = computed.getPropertyValue('--ruler-border').trim() || rulerBorder;
    const text = computed.getPropertyValue('--ruler-text').trim() || rulerTextColor;
    const tickColor = computed.getPropertyValue('--ruler-tick').trim() || border;
    const indicatorColor = computed.getPropertyValue('--ruler-indicator').trim() || computed.getPropertyValue('--theme-accent').trim() || '#C8A96A';

    // Clear background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, dWidth, height);

    // Draw bottom border
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height - 0.5);
    ctx.lineTo(dWidth, height - 0.5);
    ctx.stroke();

    // Calculate Tick spacing based on zoom
    const step = calculateRulerStep(zoom);

    // We start drawing ticks. What is the visible range in canvas coordinate?
    const startCanvasX = Math.floor((-panX) / zoom);
    const endCanvasX = Math.ceil((dWidth - panX) / zoom);

    // Align start canvas X to the step
    const alignedStart = Math.floor(startCanvasX / step) * step;

    ctx.fillStyle = text;
    ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let cx = alignedStart; cx <= endCanvasX; cx += step) {
      // Calculate screen X
      const sx = panX + cx * zoom;

      // Ensure we don't draw out of ruler bounds on the left
      if (sx < -10 || sx > dWidth + 10) continue;

      // Major tick (with text label)
      const majorHeight = 10;
      ctx.strokeStyle = tickColor;
      ctx.beginPath();
      ctx.moveTo(sx, height - 1);
      ctx.lineTo(sx, height - 1 - majorHeight);
      ctx.stroke();

      ctx.fillText(cx.toString(), sx, 2);

      // Minor tick halfway between steps
      const nextSx = panX + (cx + step / 2) * zoom;
      if (nextSx >= 0 && nextSx <= dWidth) {
        const minorHeight = 5;
        ctx.beginPath();
        ctx.moveTo(nextSx, height - 1);
        ctx.lineTo(nextSx, height - 1 - minorHeight);
        ctx.stroke();
      }
    }

    // Draw active cursor position indicator on the ruler (Discreet 1px line, Requirement 6)
    if (cursorX !== null) {
      const sx = panX + cursorX * zoom;
      if (sx >= 0 && sx <= dWidth) {
        ctx.strokeStyle = indicatorColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx + 0.5, 0);
        ctx.lineTo(sx + 0.5, height);
        ctx.stroke();
      }
    }
  }, [zoom, panX, width, cursorX, height, rulerBackground, rulerTextColor, rulerBorder, theme, themeColor]);

  // Handle clicking on the ruler to add a guide (Requirement 2 / Photoshop style drag-to-create)
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
      id="ruler-horizontal-canvas"
    />
  );
};
