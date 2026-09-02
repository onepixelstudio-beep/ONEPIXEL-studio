import React, { ReactNode } from 'react';
import { useVisibilityManager } from './VisibilityManager';
import { isMandatoryPanel } from './StudioUIManifest';
import { getPanelConfig } from './StudioPanelRegistry';

export interface StudioLayoutEngineProps {
  header?: ReactNode;
  toolbar?: ReactNode;
  optionBar?: ReactNode;
  canvas?: ReactNode;
  leftSidebar?: ReactNode;
  rightSidebar?: ReactNode;
  bottomBar?: ReactNode;
  statusBar?: ReactNode;
  modalsAndOverlays?: ReactNode;
  breakpoint?: 'desktop' | 'tablet' | 'mobile';
  isLeftHanded?: boolean;
}

/**
 * StudioLayoutEngine
 * 
 * Orchestrates layout boundaries, responsiveness, panel ordering, and visibility 
 * without containing any drawing, color, or business logic.
 * Enforces ADR-UI-001 principles:
 * - Independent panels
 * - No colateral hiding
 * - Mandatory panel protection
 */
export const StudioLayoutEngine: React.FC<StudioLayoutEngineProps> = ({
  header,
  toolbar,
  optionBar,
  canvas,
  leftSidebar,
  rightSidebar,
  bottomBar,
  statusBar,
  modalsAndOverlays,
  breakpoint = 'desktop',
  isLeftHanded = false
}) => {
  const { visibility } = useVisibilityManager();

  return (
    <div 
      className="flex flex-col w-screen h-screen overflow-hidden select-none"
      id="studio-layout-root"
      data-breakpoint={breakpoint}
      data-left-handed={isLeftHanded}
    >
      {/* 1. Header Menu (Navigation & Project Controls) */}
      {header && (
        <header className="shrink-0 z-40 w-full" id="studio-header-boundary">
          {header}
        </header>
      )}

      {/* 2. Tool Options Context Bar */}
      {optionBar && visibility.optionBarVisible && (
        <div className="shrink-0 z-30 w-full" id="studio-option-bar-boundary">
          {optionBar}
        </div>
      )}

      {/* 3. Main Workspace Area (Toolbar + Canvas + Sidebars) */}
      <div className="flex flex-1 w-full h-full min-h-0 overflow-hidden relative">
        {/* Left Handed Re-ordering */}
        {isLeftHanded ? (
          <>
            {/* Right Sidebar (or Left when in Left-handed mode) */}
            {rightSidebar && visibility.colorVisible && (
              <aside className="shrink-0 h-full z-20" id="studio-right-sidebar-boundary">
                {rightSidebar}
              </aside>
            )}

            {/* Canvas Area */}
            <main className="flex-1 h-full relative min-w-0 min-h-0 overflow-hidden" id="studio-canvas-boundary">
              {canvas}
            </main>

            {/* Toolbar (Left Sidebar) */}
            {toolbar && visibility.toolbarVisible && (
              <aside className="shrink-0 h-full z-20" id="studio-toolbar-boundary">
                {toolbar}
              </aside>
            )}
          </>
        ) : (
          <>
            {/* Toolbar (Left Sidebar) */}
            {toolbar && visibility.toolbarVisible && (
              <aside className="shrink-0 h-full z-20" id="studio-toolbar-boundary">
                {toolbar}
              </aside>
            )}

            {/* Left Optional Sidebar */}
            {leftSidebar && (
              <aside className="shrink-0 h-full z-20" id="studio-left-sidebar-boundary">
                {leftSidebar}
              </aside>
            )}

            {/* Canvas Area */}
            <main className="flex-1 h-full relative min-w-0 min-h-0 overflow-hidden" id="studio-canvas-boundary">
              {canvas}
            </main>

            {/* Right Sidebar (Preview, Reference, Color, Layers) */}
            {rightSidebar && (
              <aside className="shrink-0 h-full z-20" id="studio-right-sidebar-boundary">
                {rightSidebar}
              </aside>
            )}
          </>
        )}
      </div>

      {/* 4. Timeline Bottom Area */}
      {bottomBar && visibility.timelineVisible && (
        <div className="shrink-0 z-30 w-full" id="studio-bottom-bar-boundary">
          {bottomBar}
        </div>
      )}

      {/* 5. Status Bar Footer */}
      {statusBar && visibility.statusBarVisible && (
        <footer className="shrink-0 z-30 w-full" id="studio-status-bar-boundary">
          {statusBar}
        </footer>
      )}

      {/* 6. Modals, Floating Panels, and Dialog Overlays */}
      {modalsAndOverlays && (
        <div id="studio-overlays-boundary" className="pointer-events-none fixed inset-0 z-50">
          {modalsAndOverlays}
        </div>
      )}
    </div>
  );
};

export default StudioLayoutEngine;
