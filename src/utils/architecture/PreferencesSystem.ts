import { animationEventBus } from '../animation/EventBus';

export type PreferenceType = 'boolean' | 'string' | 'number' | 'select';

export interface PreferenceOption {
  value: string | number;
  label: string;
}

export interface PreferenceSchema<T = any> {
  id: string;
  name: string;
  description?: string;
  category: string; // e.g. "canvas", "timeline", "export", "ui"
  type: PreferenceType;
  defaultValue: T;
  options?: PreferenceOption[]; // Required for type = 'select'
  validate?: (value: T) => boolean;
}

export class PreferencesSystem {
  private static instance: PreferencesSystem | null = null;
  private schemas: Map<string, PreferenceSchema> = new Map();
  private values: Map<string, any> = new Map();
  private listeners: Map<string, Set<(value: any) => void>> = new Map();
  private readonly STORAGE_KEY = 'onepixel_editor_preferences';

  private constructor() {
    this.registerDefaultPreferences();
    this.loadFromStorage();
  }

  private registerDefaultPreferences(): void {
    // Apariencia
    this.registerPreference({
      id: 'appearance.theme',
      name: 'Tema Visual',
      description: 'Estilo de color general para la interfaz (Estándar, Oscuro o Claro).',
      category: 'appearance',
      type: 'select',
      defaultValue: 'standard',
      options: [
        { value: 'standard', label: 'Estándar (OnePixel)' },
        { value: 'dark', label: 'Oscuro Profundo' },
        { value: 'light', label: 'Claro' }
      ]
    });
    this.registerPreference({
      id: 'appearance.themeColor',
      name: 'Color de interfaz',
      description: 'Personaliza la paleta y apariencia general de toda la interfaz de OnePixel Studio.',
      category: 'appearance',
      type: 'select',
      defaultValue: 'gold',
      options: [
        { value: 'gold', label: 'Dorado' },
        { value: 'slate', label: 'Plata' },
        { value: 'rose', label: 'Rosa Silvestre' },
        { value: 'charcoal', label: 'Gris Carbón' }
      ]
    });

    // Interfaz
    this.registerPreference({
      id: 'ui.interfaceSize',
      name: 'Tamaño de la Interfaz',
      description: 'Escala los elementos de la interfaz para adaptarse a tu pantalla.',
      category: 'ui',
      type: 'select',
      defaultValue: 'md',
      options: [
        { value: 'sm', label: 'Pequeño' },
        { value: 'md', label: 'Mediano' },
        { value: 'lg', label: 'Grande' },
        { value: 'xl', label: 'Extra Grande' }
      ]
    });
    this.registerPreference({
      id: 'ui.largeButtons',
      name: 'Botones Grandes',
      description: 'Muestra botones de herramientas más grandes para pantallas táctiles.',
      category: 'ui',
      type: 'boolean',
      defaultValue: false
    });
    this.registerPreference({
      id: 'ui.leftHandedMode',
      name: 'Modo Zurdo',
      description: 'Invierte la posición de la barra de herramientas y paletas.',
      category: 'ui',
      type: 'boolean',
      defaultValue: false
    });

    // Lienzo
    this.registerPreference({
      id: 'canvas.showGrid',
      name: 'Mostrar Cuadrícula',
      description: 'Dibuja líneas guía individuales entre cada píxel.',
      category: 'canvas',
      type: 'boolean',
      defaultValue: true
    });
    this.registerPreference({
      id: 'canvas.rulersVisible',
      name: 'Mostrar Reglas',
      description: 'Muestra las reglas de píxeles en los bordes del lienzo.',
      category: 'canvas',
      type: 'boolean',
      defaultValue: true
    });
    this.registerPreference({
      id: 'canvas.showGuides',
      name: 'Mostrar Guías',
      description: 'Muestra las líneas guía sobre el lienzo.',
      category: 'canvas',
      type: 'boolean',
      defaultValue: true
    });
    this.registerPreference({
      id: 'canvas.snappingEnabled',
      name: 'Ajustar a la Cuadrícula',
      description: 'Alinea herramientas de dibujo y guías a los bordes de los píxeles.',
      category: 'canvas',
      type: 'boolean',
      defaultValue: true
    });

    // Herramientas
    this.registerPreference({
      id: 'tools.brushSize',
      name: 'Tamaño del Pincel',
      description: 'Ancho de la herramienta de dibujo en píxeles.',
      category: 'tools',
      type: 'number',
      defaultValue: 1,
      validate: (val) => val >= 1 && val <= 64
    });
    this.registerPreference({
      id: 'tools.pixelPerfect',
      name: 'Píxel Perfecto',
      description: 'Corrige las curvas y trazos rápidos para evitar píxeles dobles en diagonal.',
      category: 'tools',
      type: 'boolean',
      defaultValue: false
    });

    // Cuadrículas
    this.registerPreference({
      id: 'grid.size',
      name: 'Tamaño de la Cuadrícula',
      description: 'Paso de la cuadrícula en píxeles.',
      category: 'grid',
      type: 'select',
      defaultValue: 1,
      options: [
        { value: 1, label: '1 px (Píxel a Píxel)' },
        { value: 2, label: '2 px' },
        { value: 4, label: '4 px' },
        { value: 8, label: '8 px (Estándar)' },
        { value: 16, label: '16 px (Tilemap)' },
        { value: 32, label: '32 px' },
        { value: 64, label: '64 px' }
      ]
    });
    this.registerPreference({
      id: 'grid.color',
      name: 'Color de la Cuadrícula',
      description: 'Color de las líneas de la cuadrícula.',
      category: 'grid',
      type: 'string',
      defaultValue: '#ffffff'
    });
    this.registerPreference({
      id: 'grid.opacity',
      name: 'Opacidad de la Cuadrícula',
      description: 'Porcentaje de transparencia de las líneas de la cuadrícula.',
      category: 'grid',
      type: 'number',
      defaultValue: 30,
      validate: (val) => val >= 0 && val <= 100
    });

    // Simetría
    this.registerPreference({
      id: 'symmetry.enabled',
      name: 'Activar Simetría',
      description: 'Habilita el dibujo reflejado en el lienzo.',
      category: 'symmetry',
      type: 'boolean',
      defaultValue: false
    });
    this.registerPreference({
      id: 'symmetry.axis',
      name: 'Eje de Simetría',
      description: 'Configura el eje de reflejo activo para el dibujo.',
      category: 'symmetry',
      type: 'select',
      defaultValue: 'horizontal',
      options: [
        { value: 'horizontal', label: 'Eje Horizontal (X)' },
        { value: 'vertical', label: 'Eje Vertical (Y)' },
        { value: 'both', label: 'Ejes Cruzados (X e Y)' },
        { value: 'radial', label: 'Simetría Radial' }
      ]
    });
    this.registerPreference({
      id: 'symmetry.axisColor',
      name: 'Color de Guías de Simetría',
      description: 'Color de las líneas que marcan los ejes de simetría.',
      category: 'symmetry',
      type: 'string',
      defaultValue: '#C8A96A'
    });

    // Onion Skin
    this.registerPreference({
      id: 'onionSkin.enabled',
      name: 'Habilitar Onion Skin',
      description: 'Muestra fotogramas contiguos en transparencia.',
      category: 'onionSkin',
      type: 'boolean',
      defaultValue: true
    });
    this.registerPreference({
      id: 'onionSkin.framesBefore',
      name: 'Fotogramas Anteriores',
      description: 'Número de fotogramas anteriores a mostrar en papel cebolla.',
      category: 'onionSkin',
      type: 'select',
      defaultValue: 2,
      options: [
        { label: '0 cuadros', value: 0 },
        { label: '1 cuadro', value: 1 },
        { label: '2 cuadros', value: 2 },
        { label: '3 cuadros', value: 3 },
        { label: '4 cuadros', value: 4 },
        { label: '5 cuadros', value: 5 }
      ]
    });
    this.registerPreference({
      id: 'onionSkin.framesAfter',
      name: 'Fotogramas Posteriores',
      description: 'Número de fotogramas posteriores a mostrar en papel cebolla.',
      category: 'onionSkin',
      type: 'select',
      defaultValue: 1,
      options: [
        { label: '0 cuadros', value: 0 },
        { label: '1 cuadro', value: 1 },
        { label: '2 cuadros', value: 2 },
        { label: '3 cuadros', value: 3 },
        { label: '4 cuadros', value: 4 },
        { label: '5 cuadros', value: 5 }
      ]
    });
    this.registerPreference({
      id: 'onionSkin.opacityBefore',
      name: 'Opacidad Anteriores (%)',
      description: 'Porcentaje de opacidad inicial para fotogramas anteriores.',
      category: 'onionSkin',
      type: 'number',
      defaultValue: 50
    });
    this.registerPreference({
      id: 'onionSkin.opacityAfter',
      name: 'Opacidad Posteriores (%)',
      description: 'Porcentaje de opacidad inicial para fotogramas posteriores.',
      category: 'onionSkin',
      type: 'number',
      defaultValue: 25
    });
    this.registerPreference({
      id: 'onionSkin.colorBefore',
      name: 'Color Fotogramas Anteriores',
      description: 'Tono de color asignado a los fotogramas anteriores.',
      category: 'onionSkin',
      type: 'string',
      defaultValue: '#ff0000'
    });
    this.registerPreference({
      id: 'onionSkin.colorAfter',
      name: 'Color Fotogramas Posteriores',
      description: 'Tono de color asignado a los fotogramas posteriores.',
      category: 'onionSkin',
      type: 'string',
      defaultValue: '#00ff00'
    });
    this.registerPreference({
      id: 'onionSkin.tintMode',
      name: 'Modo Tintado Sólido',
      description: 'Aplica tinte de color a las siluetas en lugar de colores originales.',
      category: 'onionSkin',
      type: 'boolean',
      defaultValue: true
    });
    this.registerPreference({
      id: 'onionSkin.before',
      name: 'Fotogramas Anteriores (Alias)',
      description: 'Alias para compatibilidad previa.',
      category: 'onionSkin',
      type: 'number',
      defaultValue: 2
    });
    this.registerPreference({
      id: 'onionSkin.after',
      name: 'Fotogramas Posteriores (Alias)',
      description: 'Alias para compatibilidad previa.',
      category: 'onionSkin',
      type: 'number',
      defaultValue: 1
    });

    // Animación
    this.registerPreference({
      id: 'animation.fpsDefault',
      name: 'FPS por Defecto',
      description: 'Velocidad de reproducción predeterminada en fotogramas por segundo.',
      category: 'animation',
      type: 'number',
      defaultValue: 12,
      validate: (val) => typeof val === 'number' && val >= 1 && val <= 60
    });
    this.registerPreference({
      id: 'animation.loop',
      name: 'Reproducción en Bucle',
      description: 'Reproducir continuamente la animación en la línea de tiempo.',
      category: 'animation',
      type: 'boolean',
      defaultValue: true
    });

    // Guardado
    this.registerPreference({
      id: 'saving.autoSaveEnabled',
      name: 'Autoguardado Activo',
      description: 'Guarda automáticamente copias temporales del proyecto activo.',
      category: 'saving',
      type: 'boolean',
      defaultValue: true
    });
    this.registerPreference({
      id: 'saving.autoSaveIntervalMinutes',
      name: 'Intervalo de Autoguardado',
      description: 'Minutos entre cada autoguardado automático.',
      category: 'saving',
      type: 'number',
      defaultValue: 5,
      validate: (val) => typeof val === 'number' && val >= 1 && val <= 60
    });

    // Rendimiento
    this.registerPreference({
      id: 'performance.maxUndoLevels',
      name: 'Niveles de Deshacer',
      description: 'Número máximo de estados que se guardan en el historial (10 a 200).',
      category: 'performance',
      type: 'number',
      defaultValue: 50,
      validate: (val) => typeof val === 'number' && val >= 10 && val <= 200
    });

    // Accesibilidad
    this.registerPreference({
      id: 'accessibility.highContrast',
      name: 'Alto Contraste',
      description: 'Incrementa la legibilidad del texto con bordes y contrastes puros.',
      category: 'accessibility',
      type: 'boolean',
      defaultValue: false
    });
    this.registerPreference({
      id: 'accessibility.colorBlindness',
      name: 'Modo Daltonismo',
      description: 'Simula o compensa espectros visuales alternativos en tiempo real.',
      category: 'accessibility',
      type: 'select',
      defaultValue: 'none',
      options: [
        { value: 'none', label: 'Ninguno' },
        { value: 'protanopia', label: 'Protanopía' },
        { value: 'deuteranopia', label: 'Deuteranopía' },
        { value: 'tritanopia', label: 'Tritanopía' }
      ]
    });

    // Idioma
    this.registerPreference({
      id: 'language.current',
      name: 'Idioma',
      description: 'Idioma general del sistema para OnePixel Studio.',
      category: 'language',
      type: 'select',
      defaultValue: 'es',
      options: [
        { value: 'es', label: 'Español' },
        { value: 'en', label: 'English' },
        { value: 'pt', label: 'Português' },
        { value: 'zh-CN', label: '简体中文 (Chinese)' },
        { value: 'ru', label: 'Русский (Russian)' },
        { value: 'ja', label: '日本語 (Japanese)' }
      ]
    });

    // Exportación
    this.registerPreference({
      id: 'export.defaultFormat',
      name: 'Formato Predeterminado',
      description: 'Formato de imagen por defecto seleccionado en el diálogo de exportación.',
      category: 'export',
      type: 'select',
      defaultValue: 'png',
      options: [
        { value: 'png', label: 'Imagen PNG' },
        { value: 'gif', label: 'Animación GIF' },
        { value: 'apng', label: 'PNG Animado (APNG)' },
        { value: 'spritesheet', label: 'Sprite Sheet' }
      ]
    });
  }

  public static getInstance(): PreferencesSystem {
    if (!PreferencesSystem.instance) {
      PreferencesSystem.instance = new PreferencesSystem();
    }
    return PreferencesSystem.instance;
  }

  /**
   * Registers a new preference schema dynamic.
   */
  public registerPreference(schema: PreferenceSchema): void {
    this.schemas.set(schema.id, schema);
    
    // If no value is currently stored, set the default
    if (!this.values.has(schema.id)) {
      this.values.set(schema.id, schema.defaultValue);
    } else {
      // Validate existing value
      const existing = this.values.get(schema.id);
      if (schema.validate && !schema.validate(existing)) {
        this.values.set(schema.id, schema.defaultValue);
      }
    }
  }

  /**
   * Retrieves the current value of a preference.
   */
  public get<T = any>(id: string): T {
    const schema = this.schemas.get(id);
    if (!schema) {
      // Fallback if accessed before registration
      return this.values.get(id);
    }
    return this.values.has(id) ? this.values.get(id) : schema.defaultValue;
  }

  /**
   * Sets the value of a preference, validates it, persists, and notifies subscribers.
   */
  public set<T = any>(id: string, value: T): boolean {
    const schema = this.schemas.get(id);
    if (schema) {
      // Validate
      if (schema.validate && !schema.validate(value)) {
        console.warn(`Validation failed for preference ${id} with value:`, value);
        return false;
      }
      
      // Select option safety
      if (schema.type === 'select' && schema.options) {
        let testVal: any = value;
        if (typeof schema.options[0]?.value === 'number' && typeof value === 'string') {
          testVal = Number(value);
        }
        const optionExists = schema.options.some(opt => opt.value === testVal || String(opt.value) === String(value));
        if (!optionExists) {
          console.warn(`Value ${value} is not a valid option for preference ${id}.`);
          return false;
        }
        value = testVal;
      }
    }

    const oldValue = this.values.get(id);
    if (oldValue === value) return true; // No change

    this.values.set(id, value);
    this.saveToStorage();
    
    // Notify subscribers
    const idListeners = this.listeners.get(id);
    if (idListeners) {
      idListeners.forEach(callback => {
        try {
          callback(value);
        } catch (e) {
          console.error(`Error notifying listener for preference ${id}:`, e);
        }
      });
    }

    animationEventBus.emit('PREFERENCE_CHANGED', { id, value, oldValue });
    return true;
  }

  /**
   * Subscribes to changes of a specific preference. Returns unsubscribe function.
   */
  public subscribe<T = any>(id: string, callback: (value: T) => void): () => void {
    if (!this.listeners.has(id)) {
      this.listeners.set(id, new Set());
    }
    this.listeners.get(id)!.add(callback);

    // Call immediately with the current value
    callback(this.get(id));

    return () => {
      const idListeners = this.listeners.get(id);
      if (idListeners) {
        idListeners.delete(callback);
        if (idListeners.size === 0) {
          this.listeners.delete(id);
        }
      }
    };
  }

  /**
   * Returns all schemas.
   */
  public getSchemas(): PreferenceSchema[] {
    return Array.from(this.schemas.values());
  }

  /**
   * Returns schemas grouped by category.
   */
  public getSchemasByCategory(category: string): PreferenceSchema[] {
    return this.getSchemas().filter(schema => schema.category === category);
  }

  /**
   * Resets all preferences to their default values.
   */
  public resetToDefaults(): void {
    this.schemas.forEach(schema => {
      this.set(schema.id, schema.defaultValue);
    });
  }

  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      let parsedStorage: Record<string, any> = {};
      if (data) {
        try {
          parsedStorage = JSON.parse(data);
          Object.entries(parsedStorage).forEach(([key, val]) => {
            this.values.set(key, val);
          });
        } catch (e) {}
      }

      // Synchronize theme fallback if not explicitly stored in main preferences storage
      if (!parsedStorage['appearance.theme']) {
        const theme = localStorage.getItem('onepixel_theme');
        if (theme && (theme === 'standard' || theme === 'dark' || theme === 'light')) {
          this.values.set('appearance.theme', theme);
        }
      }

      // Synchronize interfaceColor fallback if not explicitly stored in main preferences storage
      if (!parsedStorage['appearance.themeColor']) {
        const legacy = localStorage.getItem('onepixel_preferences');
        if (legacy) {
          try {
            const parsedLegacy = JSON.parse(legacy);
            if (parsedLegacy.interfaceColor) {
              this.values.set('appearance.themeColor', parsedLegacy.interfaceColor);
            }
            if (parsedLegacy.theme && !parsedStorage['appearance.theme']) {
              this.values.set('appearance.theme', parsedLegacy.theme);
            }
          } catch (e) {}
        }
      }
    } catch (e) {
      console.warn('Failed to load preferences from localStorage. Using memory defaults.', e);
    }
  }

  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const obj: Record<string, any> = {};
      this.values.forEach((val, key) => {
        obj[key] = val;
      });
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(obj));

      // Keep legacy keys updated for full bidirectional sync across components
      const currentTheme = this.values.get('appearance.theme');
      if (currentTheme) {
        localStorage.setItem('onepixel_theme', String(currentTheme));
      }
    } catch (e) {
      console.warn('Failed to save preferences to localStorage.', e);
    }
  }
}

export const preferencesSystem = PreferencesSystem.getInstance();
