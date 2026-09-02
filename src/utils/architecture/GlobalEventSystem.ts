import { animationEventBus } from '../animation/EventBus';
import { actionSystem } from './ActionSystem';

export interface ShortcutBinding {
  id: string;
  key: string; // e.g. "z", "s", "p", "Delete"
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  category: string;
  action: () => void;
  preventDefault?: boolean;
}

export class GlobalEventSystem {
  private static instance: GlobalEventSystem | null = null;
  private shortcuts: Map<string, ShortcutBinding> = new Map();
  private defaults: Map<string, Omit<ShortcutBinding, 'action'>> = new Map();
  private isListening = false;
  private readonly SHORTCUTS_STORAGE_KEY = 'onepixel_custom_shortcuts_v1';

  private constructor() {
    this.registerDefaultShortcuts();
    this.setupListeners();
  }

  public static getInstance(): GlobalEventSystem {
    if (!GlobalEventSystem.instance) {
      GlobalEventSystem.instance = new GlobalEventSystem();
    }
    return GlobalEventSystem.instance;
  }

  /**
   * Registers default mappings for reference and factory restore.
   */
  private registerDefaultShortcuts(): void {
    const list: Omit<ShortcutBinding, 'action'>[] = [
      { id: 'tool.pen', key: 'p', description: 'Pincel', category: 'Herramientas' },
      { id: 'tool.eraser', key: 'e', description: 'Borrador', category: 'Herramientas' },
      { id: 'tool.line', key: 'l', description: 'Línea', category: 'Herramientas' },
      { id: 'tool.rectangle', key: 'r', description: 'Rectángulo', category: 'Herramientas' },
      { id: 'tool.ellipse', key: 'u', description: 'Elipse', category: 'Herramientas' },
      { id: 'tool.bucket', key: 'g', description: 'Bote de Pintura', category: 'Herramientas' },
      { id: 'tool.picker', key: 'i', description: 'Gotero de Color', category: 'Herramientas' },
      { id: 'tool.rect_select', key: 'm', description: 'Selección Rectangular', category: 'Herramientas' },
      
      { id: 'edit.undo', key: 'z', ctrl: true, description: 'Deshacer Acción', category: 'Edición' },
      { id: 'edit.redo', key: 'y', ctrl: true, description: 'Rehacer Acción', category: 'Edición' },
      { id: 'edit.select_all', key: 'a', ctrl: true, description: 'Seleccionar Todo', category: 'Edición' },
      { id: 'edit.deselect', key: 'd', ctrl: true, description: 'Deseleccionar', category: 'Edición' },
      { id: 'edit.delete', key: 'Delete', description: 'Borrar Selección', category: 'Edición' },

      { id: 'project.save', key: 's', ctrl: true, description: 'Guardar Proyecto', category: 'Proyecto' },
      { id: 'project.save_as', key: 's', ctrl: true, shift: true, description: 'Guardar Como', category: 'Proyecto' },
      { id: 'project.export', key: 'e', ctrl: true, description: 'Exportar Proyecto', category: 'Proyecto' },

      { id: 'view.zoom_in', key: '+', description: 'Acercar Zoom', category: 'Vista' },
      { id: 'view.zoom_out', key: '-', description: 'Alejar Zoom', category: 'Vista' },
      { id: 'view.center', key: 'c', description: 'Centrar Vista', category: 'Vista' },
      { id: 'view.zen_mode', key: 'Tab', description: 'Alternar Modo Zen', category: 'Vista' },

      { id: 'animation.play', key: ' ', description: 'Reproducir / Pausar Animación', category: 'Animación' },
      { id: 'animation.add_frame', key: 'f', alt: true, description: 'Añadir Nuevo Cuadro', category: 'Animación' },
      { id: 'animation.delete_frame', key: 'd', alt: true, description: 'Eliminar Cuadro Actual', category: 'Animación' },
      { id: 'animation.next', key: 'ArrowRight', description: 'Siguiente Cuadro', category: 'Animación' },
      { id: 'animation.prev', key: 'ArrowLeft', description: 'Cuadro Anterior', category: 'Animación' },

      { id: 'help.open', key: 'F1', description: 'Abrir Centro de Ayuda', category: 'Ayuda' }
    ];

    list.forEach(item => {
      this.defaults.set(item.id, item);
      
      // Register standard mapping calling ActionSystem
      this.shortcuts.set(item.id, {
        ...item,
        action: () => {
          actionSystem.execute(item.id);
        }
      });
    });

    this.loadCustomShortcuts();
  }

  /**
   * Registers a keyboard shortcut dynamically.
   */
  public registerShortcut(binding: ShortcutBinding): void {
    this.shortcuts.set(binding.id, binding);
    animationEventBus.emit('SHORTCUT_REGISTERED', { id: binding.id, key: binding.key });
  }

  /**
   * Unregisters a keyboard shortcut.
   */
  public unregisterShortcut(id: string): void {
    if (this.shortcuts.has(id)) {
      this.shortcuts.delete(id);
      animationEventBus.emit('SHORTCUT_UNREGISTERED', { id });
    }
  }

  /**
   * Retrieves all registered shortcuts.
   */
  public getShortcuts(): ShortcutBinding[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Modifies an existing shortcut's key combination and modifiers.
   * Performs real-time conflict checking.
   */
  public updateShortcut(
    id: string,
    key: string,
    modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean }
  ): { success: boolean; conflictWith?: string } {
    const shortcut = this.shortcuts.get(id);
    if (!shortcut) return { success: false };

    // Check conflict
    const conflict = this.checkConflict(key, !!modifiers.ctrl, !!modifiers.shift, !!modifiers.alt, id);
    if (conflict) {
      return { success: false, conflictWith: conflict.description };
    }

    const updated: ShortcutBinding = {
      ...shortcut,
      key,
      ctrl: modifiers.ctrl,
      shift: modifiers.shift,
      alt: modifiers.alt,
    };

    this.shortcuts.set(id, updated);
    this.saveCustomShortcuts();
    animationEventBus.emit('SHORTCUT_UPDATED', { id, key, ...modifiers });
    return { success: true };
  }

  /**
   * Detects if another shortcut already uses the same trigger.
   */
  public checkConflict(
    key: string,
    ctrl: boolean,
    shift: boolean,
    alt: boolean,
    excludeId?: string
  ): ShortcutBinding | null {
    const cleanKey = key.toLowerCase();
    for (const binding of this.shortcuts.values()) {
      if (excludeId && binding.id === excludeId) continue;

      const keyMatches = binding.key.toLowerCase() === cleanKey;
      const ctrlMatches = !!binding.ctrl === ctrl;
      const shiftMatches = !!binding.shift === shift;
      const altMatches = !!binding.alt === alt;

      if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
        return binding;
      }
    }
    return null;
  }

  /**
   * Resets all shortcuts to original defaults.
   */
  public restoreDefaults(): void {
    this.defaults.forEach((def, id) => {
      const current = this.shortcuts.get(id);
      if (current) {
        this.shortcuts.set(id, {
          ...current,
          key: def.key,
          ctrl: def.ctrl,
          shift: def.shift,
          alt: def.alt
        });
      }
    });
    this.saveCustomShortcuts();
    animationEventBus.emit('SHORTCUTS_RESET', {});
  }

  /**
   * Returns a JSON string of custom layouts.
   */
  public exportConfig(): string {
    const list: Record<string, { key: string; ctrl?: boolean; shift?: boolean; alt?: boolean }> = {};
    this.shortcuts.forEach((val, key) => {
      list[key] = {
        key: val.key,
        ctrl: val.ctrl,
        shift: val.shift,
        alt: val.alt
      };
    });
    return JSON.stringify(list, null, 2);
  }

  /**
   * Imports a JSON layout configuration.
   */
  public importConfig(json: string): boolean {
    try {
      const parsed = JSON.parse(json);
      if (typeof parsed !== 'object' || parsed === null) return false;

      Object.entries(parsed).forEach(([id, val]: [string, any]) => {
        const current = this.shortcuts.get(id);
        if (current && val && typeof val.key === 'string') {
          this.shortcuts.set(id, {
            ...current,
            key: val.key,
            ctrl: !!val.ctrl,
            shift: !!val.shift,
            alt: !!val.alt
          });
        }
      });

      this.saveCustomShortcuts();
      animationEventBus.emit('SHORTCUTS_IMPORTED', {});
      return true;
    } catch (e) {
      console.error('Failed to import hotkey config', e);
      return false;
    }
  }

  private loadCustomShortcuts(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const data = localStorage.getItem(this.SHORTCUTS_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        Object.entries(parsed).forEach(([id, val]: [string, any]) => {
          const current = this.shortcuts.get(id);
          if (current) {
            this.shortcuts.set(id, {
              ...current,
              key: val.key,
              ctrl: val.ctrl,
              shift: val.shift,
              alt: val.alt
            });
          }
        });
      }
    } catch (e) {
      console.warn('Failed to load custom shortcuts', e);
    }
  }

  private saveCustomShortcuts(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const list: Record<string, any> = {};
      this.shortcuts.forEach((val, key) => {
        list[key] = {
          key: val.key,
          ctrl: val.ctrl,
          shift: val.shift,
          alt: val.alt
        };
      });
      localStorage.setItem(this.SHORTCUTS_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save custom shortcuts', e);
    }
  }

  /**
   * Checks if an element is a text input to avoid firing hotkeys when typing.
   */
  private isTextInput(element: HTMLElement | null): boolean {
    if (!element) return false;
    const tagName = element.tagName.toLowerCase();
    if (tagName === 'input') {
      const inputType = (element as HTMLInputElement).type.toLowerCase();
      // Only treat text-like inputs as text fields
      return ['text', 'password', 'number', 'email', 'search', 'url'].includes(inputType);
    }
    return tagName === 'textarea' || element.isContentEditable;
  }

  private setupListeners(): void {
    if (this.isListening) return;
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('wheel', this.handleWheel, { passive: false });

    this.isListening = true;
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    const activeElement = document.activeElement as HTMLElement;
    if (this.isTextInput(activeElement)) {
      // Allow key events to behave normally when typing in text fields
      return;
    }

    const key = event.key.toLowerCase();
    const isCtrl = event.ctrlKey || event.metaKey; // Handles macOS Cmd / Windows Ctrl unifies
    const isShift = event.shiftKey;
    const isAlt = event.altKey;

    for (const binding of this.shortcuts.values()) {
      // Match exact modifier combination
      const keyMatches = binding.key.toLowerCase() === key || binding.key === event.key;
      const ctrlMatches = !!binding.ctrl === isCtrl;
      const shiftMatches = !!binding.shift === isShift;
      const altMatches = !!binding.alt === isAlt;

      if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
        if (binding.preventDefault !== false) {
          event.preventDefault();
        }
        try {
          binding.action();
        } catch (error) {
          console.error(`Error executing shortcut action ${binding.id}:`, error);
        }
        break;
      }
    }
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    // Notify general listeners if needed for interactive tools (like release Space for pan)
    animationEventBus.emit('GLOBAL_KEY_UP', { key: event.key });
  };

  private handleWheel = (event: WheelEvent): void => {
    // Zoom and pan triggers via wheel can be monitored here globally
    if (event.ctrlKey) {
      event.preventDefault(); // Prevent native browser zoom
      animationEventBus.emit('GLOBAL_ZOOM_WHEEL', { deltaY: event.deltaY, clientX: event.clientX, clientY: event.clientY });
    } else if (event.shiftKey) {
      animationEventBus.emit('GLOBAL_PAN_WHEEL', { deltaX: event.deltaY, deltaY: 0 });
    }
  };

  /**
   * Destroys listeners and clears resources.
   */
  public dispose(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleKeyDown);
      window.removeEventListener('keyup', this.handleKeyUp);
      window.removeEventListener('wheel', this.handleWheel);
    }
    this.shortcuts.clear();
    this.isListening = false;
  }
}

export const globalEventSystem = GlobalEventSystem.getInstance();
