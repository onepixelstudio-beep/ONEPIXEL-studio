export interface PanelManifestEntry {
  id: string;
  name: string;
  required: boolean;
  category: 'primary' | 'secondary' | 'overlay' | 'navigation';
  description: string;
}

export const MANDATORY_PANEL_IDS = [
  'header-menu',
  'toolbar',
  'option-bar',
  'preview-reference',
  'color-panel',
  'layer-manager',
  'timeline'
] as const;

export type MandatoryPanelId = typeof MANDATORY_PANEL_IDS[number];

export const STUDIO_UI_MANIFEST: Record<MandatoryPanelId, PanelManifestEntry> = {
  'header-menu': {
    id: 'header-menu',
    name: 'Header Menu',
    required: true,
    category: 'navigation',
    description: 'Menú principal de navegación, archivo, edición, vista y exportación.'
  },
  'toolbar': {
    id: 'toolbar',
    name: 'Barra de Herramientas',
    required: true,
    category: 'primary',
    description: 'Herramientas de dibujo, selección, transformación y pintura.'
  },
  'option-bar': {
    id: 'option-bar',
    name: 'Barra de Opciones de Herramienta',
    required: true,
    category: 'primary',
    description: 'Ajustes contextuales de la herramienta activa (tamaño, tolerancia, modo).'
  },
  'preview-reference': {
    id: 'preview-reference',
    name: 'Vista Previa',
    required: true,
    category: 'primary',
    description: 'Miniatura en tiempo real del lienzo de trabajo.'
  },
  'color-panel': {
    id: 'color-panel',
    name: 'Panel de Color y Paletas',
    required: true,
    category: 'primary',
    description: 'Selector de color activo (Primario/Secundario), comparador, sliders RGB/HSL/HSV y paletas.'
  },
  'layer-manager': {
    id: 'layer-manager',
    name: 'Gestor de Capas',
    required: true,
    category: 'primary',
    description: 'Gestión de capas del proyecto, visibilidad, opacidad y ordenamiento.'
  },
  'timeline': {
    id: 'timeline',
    name: 'Línea de Tiempo de Animación',
    required: true,
    category: 'secondary',
    description: 'Controles de fotogramas, reproducción y papel cebolla.'
  }
};

export function isMandatoryPanel(panelId: string): boolean {
  return MANDATORY_PANEL_IDS.includes(panelId as MandatoryPanelId);
}
