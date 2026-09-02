import { animationEventBus } from '../animation/EventBus';

export interface Extension {
  id: string;
  name: string;
  version: string;
  author?: string;
  initialize: (context: ExtensionContext) => void | Promise<void>;
  cleanup?: () => void;
}

export interface ExtensionContext {
  registerMenuItem: (menuId: string, item: MenuItemExtension) => void;
  registerSidebarPanel: (panel: SidebarPanelExtension) => void;
  registerHelpCategory: (category: string, title: string) => void;
  registerPresetCategory: (category: string, title: string) => void;
  getEventBus: () => typeof animationEventBus;
}

export interface MenuItemExtension {
  id: string;
  label: string;
  action: () => void;
  shortcut?: string;
  icon?: string;
}

export interface SidebarPanelExtension {
  id: string;
  title: string;
  renderComponent: () => any; // Component renderer hook
  icon?: string;
}

export class ExtensionPoints {
  private static instance: ExtensionPoints | null = null;
  private extensions: Map<string, Extension> = new Map();
  private menuItems: Map<string, MenuItemExtension[]> = new Map();
  private sidebarPanels: SidebarPanelExtension[] = [];
  private helpCategories: Map<string, string> = new Map();
  private presetCategories: Map<string, string> = new Map();

  private constructor() {}

  public static getInstance(): ExtensionPoints {
    if (!ExtensionPoints.instance) {
      ExtensionPoints.instance = new ExtensionPoints();
    }
    return ExtensionPoints.instance;
  }

  /**
   * Installs and initializes an extension dynamically.
   */
  public registerExtension(extension: Extension): void {
    if (this.extensions.has(extension.id)) {
      console.warn(`Extension with ID ${extension.id} is already registered. Initializing again.`);
    }

    this.extensions.set(extension.id, extension);

    const context: ExtensionContext = {
      registerMenuItem: (menuId, item) => {
        if (!this.menuItems.has(menuId)) {
          this.menuItems.set(menuId, []);
        }
        this.menuItems.get(menuId)!.push(item);
        animationEventBus.emit('EXTENSION_MENU_ITEM_REGISTERED', { menuId, itemId: item.id });
      },
      registerSidebarPanel: (panel) => {
        this.sidebarPanels.push(panel);
        animationEventBus.emit('EXTENSION_SIDEBAR_PANEL_REGISTERED', { id: panel.id });
      },
      registerHelpCategory: (category, title) => {
        this.helpCategories.set(category, title);
        animationEventBus.emit('EXTENSION_HELP_CATEGORY_REGISTERED', { category, title });
      },
      registerPresetCategory: (category, title) => {
        this.presetCategories.set(category, title);
        animationEventBus.emit('EXTENSION_PRESET_CATEGORY_REGISTERED', { category, title });
      },
      getEventBus: () => animationEventBus
    };

    try {
      extension.initialize(context);
      animationEventBus.emit('EXTENSION_INITIALIZED', { id: extension.id });
    } catch (e) {
      console.error(`Failed to initialize extension ${extension.id}:`, e);
    }
  }

  /**
   * Retrieves registered extensions.
   */
  public getExtensions(): Extension[] {
    return Array.from(this.extensions.values());
  }

  /**
   * Retrieves extension menu items for a specific menu.
   */
  public getMenuItems(menuId: string): MenuItemExtension[] {
    return this.menuItems.get(menuId) || [];
  }

  /**
   * Retrieves extension sidebar panels.
   */
  public getSidebarPanels(): SidebarPanelExtension[] {
    return [...this.sidebarPanels];
  }

  /**
   * Uninstalls an extension and triggers its cleanup callback.
   */
  public unregisterExtension(id: string): void {
    const extension = this.extensions.get(id);
    if (extension) {
      if (extension.cleanup) {
        try {
          extension.cleanup();
        } catch (e) {
          console.error(`Error during cleanup of extension ${id}:`, e);
        }
      }
      this.extensions.delete(id);
      
      // Clean up registered menu items for this extension
      this.menuItems.forEach((items, key) => {
        this.menuItems.set(key, items.filter(item => !item.id.startsWith(id)));
      });

      this.sidebarPanels = this.sidebarPanels.filter(p => !p.id.startsWith(id));

      animationEventBus.emit('EXTENSION_UNREGISTERED', { id });
    }
  }
}

export const extensionPoints = ExtensionPoints.getInstance();

// DEFINED FUTURE PLUGINS HOOKS
// These serve as explicit entry integration schemas for subsequent modules:

/**
 * 1. Preferencias Extension Interface Hook
 */
export interface PreferencesExtension {
  id: string;
  registerSetting: (schema: any) => void;
  getSetting: (id: string) => any;
  setSetting: (id: string, value: any) => void;
}

/**
 * 2. Manual de Usuario Extension Interface Hook
 */
export interface UserManualExtension {
  id: string;
  registerPage: (pageId: string, title: string, markdown: string) => void;
  openManual: (pageId?: string) => void;
}

/**
 * 3. Sistema de Atajos Extension Interface Hook
 */
export interface HotkeysExtension {
  id: string;
  registerHotkey: (actionId: string, keyCombination: string) => void;
  triggerHotkey: (keyCombination: string) => void;
}

/**
 * 4. Plantillas y Presets Extension Interface Hook
 */
export interface PresetsExtension {
  id: string;
  registerPresetPattern: (name: string, grid: boolean[][]) => void;
  registerPresetPalette: (name: string, colors: string[]) => void;
}

/**
 * 5. Gestor de Proyectos Extension Interface Hook
 */
export interface ProjectManagerExtension {
  id: string;
  createNewProject: (width: number, height: number, name: string) => void;
  importExternalFormat: (file: File) => Promise<any>;
}

/**
 * 6. Historial de Exportaciones Extension Interface Hook
 */
export interface ExportHistoryExtension {
  id: string;
  logExport: (filename: string, format: string, scale: number) => void;
  getHistory: () => any[];
}

/**
 * 7. Donaciones Extension Interface Hook
 */
export interface DonationsExtension {
  id: string;
  openDonationModal: () => void;
  isSupporter: () => boolean;
}
