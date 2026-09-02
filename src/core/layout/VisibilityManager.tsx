import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface PanelVisibilityState {
  previewVisible: boolean;
  colorVisible: boolean;
  paletteVisible: boolean;
  layersVisible: boolean;
  timelineVisible: boolean;
  toolbarVisible: boolean;
  toolsVisible: boolean;
  optionBarVisible: boolean;
  statusBarVisible: boolean;
}

export interface VisibilityManagerContextType {
  visibility: PanelVisibilityState;
  togglePanel: (panel: keyof PanelVisibilityState) => void;
  setPanelVisible: (panel: keyof PanelVisibilityState, visible: boolean) => void;
  showAllPanels: () => void;
  resetDefaultLayout: () => void;
}

const DEFAULT_VISIBILITY: PanelVisibilityState = {
  previewVisible: true,
  colorVisible: true,
  paletteVisible: true,
  layersVisible: true,
  timelineVisible: true,
  toolbarVisible: true,
  toolsVisible: true,
  optionBarVisible: true,
  statusBarVisible: true,
};

const VisibilityManagerContext = createContext<VisibilityManagerContextType | null>(null);

export const VisibilityManagerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [visibility, setVisibility] = useState<PanelVisibilityState>(DEFAULT_VISIBILITY);

  const togglePanel = useCallback((panel: keyof PanelVisibilityState) => {
    setVisibility((prev) => ({
      ...prev,
      [panel]: !prev[panel],
    }));
  }, []);

  const setPanelVisible = useCallback((panel: keyof PanelVisibilityState, visible: boolean) => {
    setVisibility((prev) => ({
      ...prev,
      [panel]: visible,
    }));
  }, []);

  const showAllPanels = useCallback(() => {
    setVisibility(DEFAULT_VISIBILITY);
  }, []);

  const resetDefaultLayout = useCallback(() => {
    setVisibility(DEFAULT_VISIBILITY);
  }, []);

  return (
    <VisibilityManagerContext.Provider
      value={{
        visibility,
        togglePanel,
        setPanelVisible,
        showAllPanels,
        resetDefaultLayout,
      }}
    >
      {children}
    </VisibilityManagerContext.Provider>
  );
};

export function useVisibilityManager(): VisibilityManagerContextType {
  const context = useContext(VisibilityManagerContext);
  if (!context) {
    return {
      visibility: DEFAULT_VISIBILITY,
      togglePanel: () => {},
      setPanelVisible: () => {},
      showAllPanels: () => {},
      resetDefaultLayout: () => {},
    };
  }
  return context;
}
