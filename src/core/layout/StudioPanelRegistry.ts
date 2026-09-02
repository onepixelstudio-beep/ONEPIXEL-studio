import { STUDIO_UI_MANIFEST, MandatoryPanelId } from './StudioUIManifest';

export type Breakpoint = 'desktop' | 'tablet' | 'mobile';

export interface PanelConfig {
  id: string;
  name: string;
  required: boolean;
  movable: boolean;
  collapsible: boolean;
  dockable: boolean;
  defaultPosition: 'left' | 'right' | 'top' | 'bottom' | 'center' | 'floating';
  minWidth?: number;
  minHeight?: number;
  recommendedWidth?: number;
  responsiveRepresentation: {
    desktop: 'docked' | 'floating';
    tablet: 'docked' | 'accordion' | 'floating';
    mobile: 'tab' | 'drawer' | 'bottom-sheet' | 'accordion';
  };
}

export const STUDIO_PANEL_REGISTRY: Record<string, PanelConfig> = {
  'header-menu': {
    id: 'header-menu',
    name: STUDIO_UI_MANIFEST['header-menu'].name,
    required: true,
    movable: false,
    collapsible: false,
    dockable: true,
    defaultPosition: 'top',
    minHeight: 40,
    responsiveRepresentation: {
      desktop: 'docked',
      tablet: 'docked',
      mobile: 'accordion'
    }
  },
  'toolbar': {
    id: 'toolbar',
    name: STUDIO_UI_MANIFEST['toolbar'].name,
    required: true,
    movable: false,
    collapsible: true,
    dockable: true,
    defaultPosition: 'left',
    minWidth: 48,
    recommendedWidth: 56,
    responsiveRepresentation: {
      desktop: 'docked',
      tablet: 'docked',
      mobile: 'drawer'
    }
  },
  'option-bar': {
    id: 'option-bar',
    name: STUDIO_UI_MANIFEST['option-bar'].name,
    required: true,
    movable: false,
    collapsible: false,
    dockable: true,
    defaultPosition: 'top',
    minHeight: 36,
    responsiveRepresentation: {
      desktop: 'docked',
      tablet: 'docked',
      mobile: 'accordion'
    }
  },
  'preview-reference': {
    id: 'preview-reference',
    name: STUDIO_UI_MANIFEST['preview-reference'].name,
    required: true,
    movable: true,
    collapsible: true,
    dockable: true,
    defaultPosition: 'right',
    minWidth: 200,
    recommendedWidth: 260,
    responsiveRepresentation: {
      desktop: 'docked',
      tablet: 'accordion',
      mobile: 'tab'
    }
  },
  'color-panel': {
    id: 'color-panel',
    name: STUDIO_UI_MANIFEST['color-panel'].name,
    required: true,
    movable: true,
    collapsible: true,
    dockable: true,
    defaultPosition: 'right',
    minWidth: 220,
    recommendedWidth: 280,
    responsiveRepresentation: {
      desktop: 'docked',
      tablet: 'accordion',
      mobile: 'bottom-sheet'
    }
  },
  'layer-manager': {
    id: 'layer-manager',
    name: STUDIO_UI_MANIFEST['layer-manager'].name,
    required: true,
    movable: true,
    collapsible: true,
    dockable: true,
    defaultPosition: 'right',
    minWidth: 220,
    recommendedWidth: 280,
    responsiveRepresentation: {
      desktop: 'docked',
      tablet: 'accordion',
      mobile: 'bottom-sheet'
    }
  },
  'timeline': {
    id: 'timeline',
    name: STUDIO_UI_MANIFEST['timeline'].name,
    required: true,
    movable: true,
    collapsible: true,
    dockable: true,
    defaultPosition: 'bottom',
    minHeight: 120,
    responsiveRepresentation: {
      desktop: 'docked',
      tablet: 'accordion',
      mobile: 'bottom-sheet'
    }
  }
};

export function getPanelConfig(panelId: string): PanelConfig | undefined {
  return STUDIO_PANEL_REGISTRY[panelId];
}
