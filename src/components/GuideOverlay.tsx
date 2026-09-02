import React, { useState } from 'react';
import { Guide } from '../types';
import { GUIDES_RULERS_THEME } from '../utils/guideUtils';
import { translate, LanguageCode } from '../i18n';

interface GuideOverlayProps {
  guides: Guide[];
  guidesVisible: boolean;
  guidesLocked: boolean;
  zoom: number;
  panX: number;
  panY: number;
  canvasWidth: number;
  canvasHeight: number;
  activeDragId: string | null;
  onStartDragGuide: (id: string, e: React.MouseEvent) => void;
  onRemoveGuide: (id: string) => void;
  activeSnapLines?: { x: number | null; y: number | null };
  language?: LanguageCode;
}

export const GuideOverlay: React.FC<GuideOverlayProps> = ({
  guides,
  guidesVisible,
  guidesLocked,
  zoom,
  panX,
  panY,
  canvasWidth,
  canvasHeight,
  activeDragId,
  onStartDragGuide,
  onRemoveGuide,
  activeSnapLines,
  language = 'es',
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (!guidesVisible && !activeSnapLines?.x && !activeSnapLines?.y) return null;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-15"
      style={{ background: 'transparent' }}
      id="guide-overlay-svg"
    >
      {/* Subtle snap help lines (Requirement 4 / Discreet dashed lines) */}
      {activeSnapLines?.x !== null && (
        <line
          x1={panX + activeSnapLines.x * zoom}
          y1={0}
          x2={panX + activeSnapLines.x * zoom}
          y2="100%"
          stroke="#C8A96A" // Brand Gold accent
          strokeWidth={1}
          strokeOpacity={0.8}
          strokeDasharray="2 2"
          className="pointer-events-none"
        />
      )}
      {activeSnapLines?.y !== null && (
        <line
          x1={0}
          y1={panY + activeSnapLines.y * zoom}
          x2="100%"
          y2={panY + activeSnapLines.y * zoom}
          stroke="#C8A96A" // Brand Gold accent
          strokeWidth={1}
          strokeOpacity={0.6}
          strokeDasharray="2 2"
          className="pointer-events-none"
        />
      )}

      {/* Actual guide lines */}
      {guidesVisible && guides.map((g) => {
        const isLocked = guidesLocked || g.locked;
        
        // Locked guides have absolutely NO hover state or cursor transitions (Requirement 5)
        const isHovered = hoveredId === g.id && !isLocked;
        const isDragging = activeDragId === g.id;
        
        // If snapped to this guide's position, we illuminate it!
        const isSnapped = (g.type === 'vertical' && activeSnapLines?.x === g.position) ||
                          (g.type === 'horizontal' && activeSnapLines?.y === g.position);

        const color = isHovered || isDragging || isSnapped
          ? GUIDES_RULERS_THEME.guideHighlightColor
          : g.isProjectLevel
            ? GUIDES_RULERS_THEME.guideProjectColor
            : g.color || GUIDES_RULERS_THEME.guideSessionColor;

        if (g.type === 'vertical') {
          const sx = panX + g.position * zoom;

          return (
            <g key={g.id} className="pointer-events-auto">
              {/* Invisible thick line for easy hovering and dragging */}
              <line
                x1={sx}
                y1={0}
                x2={sx}
                y2="100%"
                stroke="transparent"
                strokeWidth={10}
                className={isLocked ? 'cursor-default' : 'cursor-col-resize'}
                onMouseDown={(e) => onStartDragGuide(g.id, e)}
                onMouseEnter={() => !isLocked && setHoveredId(g.id)}
                onMouseLeave={() => setHoveredId(null)}
                onDoubleClick={() => !isLocked && onRemoveGuide(g.id)}
              >
                <title>{isLocked ? translate('guides.guideLocked', language as any) : translate('guides.guideTooltip', language as any)}</title>
              </line>
              {/* Actual thin guide line with smooth 100ms hover transition (Requirement 10) */}
              <line
                x1={sx}
                y1={0}
                x2={sx}
                y2="100%"
                stroke={color}
                strokeWidth={isHovered || isDragging || isSnapped ? 2 : 1}
                strokeDasharray={g.isProjectLevel ? undefined : '4 4'}
                className="transition-all duration-100 ease-out"
                style={{ opacity: isHovered || isDragging || isSnapped ? 1.0 : 0.6 }}
              />
            </g>
          );
        } else {
          const sy = panY + g.position * zoom;

          return (
            <g key={g.id} className="pointer-events-auto">
              {/* Invisible thick line for easy hovering and dragging */}
              <line
                x1={0}
                y1={sy}
                x2="100%"
                y2={sy}
                stroke="transparent"
                strokeWidth={10}
                className={isLocked ? 'cursor-default' : 'cursor-row-resize'}
                onMouseDown={(e) => onStartDragGuide(g.id, e)}
                onMouseEnter={() => !isLocked && setHoveredId(g.id)}
                onMouseLeave={() => setHoveredId(null)}
                onDoubleClick={() => !isLocked && onRemoveGuide(g.id)}
              >
                <title>{isLocked ? translate('guides.guideLocked', language as any) : translate('guides.guideTooltip', language as any)}</title>
              </line>
              {/* Actual thin guide line with smooth 100ms hover transition (Requirement 10) */}
              <line
                x1={0}
                y1={sy}
                x2="100%"
                y2={sy}
                stroke={color}
                strokeWidth={isHovered || isDragging || isSnapped ? 2 : 1}
                strokeDasharray={g.isProjectLevel ? undefined : '4 4'}
                className="transition-all duration-100 ease-out"
                style={{ opacity: isHovered || isDragging || isSnapped ? 1.0 : 0.6 }}
              />
            </g>
          );
        }
      })}
    </svg>
  );
};
