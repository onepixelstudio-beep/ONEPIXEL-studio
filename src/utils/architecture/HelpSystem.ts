import { animationEventBus } from '../animation/EventBus';

export interface HelpPage {
  id: string;
  title: string;
  category: 'manual' | 'tools' | 'pixelart' | 'animation' | 'shortcuts' | 'tips' | string;
  tags: string[];
  content: string; // Markdown supported
  order?: number;
  lastUpdated?: number;
}

export class HelpSystem {
  private static instance: HelpSystem | null = null;
  private pages: Map<string, HelpPage> = new Map();

  private constructor() {
    this.registerDefaultPages();
  }

  public static getInstance(): HelpSystem {
    if (!HelpSystem.instance) {
      HelpSystem.instance = new HelpSystem();
    }
    return HelpSystem.instance;
  }

  /**
   * Registers a new help page dynamically.
   */
  public registerPage(page: HelpPage): void {
    if (this.pages.has(page.id)) {
      console.warn(`Help page with ID ${page.id} already exists. Overwriting.`);
    }
    this.pages.set(page.id, {
      ...page,
      lastUpdated: page.lastUpdated || Date.now()
    });
    animationEventBus.emit('HELP_PAGE_REGISTERED', { id: page.id, title: page.title });
  }

  /**
   * Retrieves a help page by ID.
   */
  public getPage(id: string): HelpPage | null {
    return this.pages.get(id) || null;
  }

  /**
   * Retrieves all help pages.
   */
  public getPages(): HelpPage[] {
    return Array.from(this.pages.values()).sort((a, b) => {
      const orderA = a.order ?? 1000;
      const orderB = b.order ?? 1000;
      if (orderA !== orderB) return orderA - orderB;
      return a.title.localeCompare(b.title);
    });
  }

  /**
   * Retrieves all help pages of a specific category.
   */
  public getPagesByCategory(category: string): HelpPage[] {
    return this.getPages().filter(page => page.category === category);
  }

  /**
   * Searches pages by keyword in title, content, or tags.
   */
  public search(query: string): HelpPage[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.getPages();

    return this.getPages().filter(page => {
      const matchTitle = page.title.toLowerCase().includes(q);
      const matchContent = page.content.toLowerCase().includes(q);
      const matchTags = page.tags.some(t => t.toLowerCase().includes(q));
      return matchTitle || matchContent || matchTags;
    });
  }

  /**
   * Clears the registered help pages.
   */
  public clear(): void {
    this.pages.clear();
  }

  /**
   * Pre-loads default help pages to ensure immediate documentation availability.
   */
  private registerDefaultPages(): void {
    this.registerPage({
      id: 'welcome',
      title: 'Bienvenido a OnePixel Studio',
      category: 'manual',
      tags: ['inicio', 'introduccion', 'bienvenido'],
      order: 1,
      content: `# Bienvenido a OnePixel Studio v1.0\n\nEl editor definitivo de Pixel Art y Animación profesional.\n\nEste manual te guiará a través de todas las funcionalidades clave del software. Utiliza la barra de búsqueda o navega por las categorías laterales para conocer más.`
    });

    this.registerPage({
      id: 'shortcuts-guide',
      title: 'Atajos de Teclado Rápidos',
      category: 'shortcuts',
      tags: ['teclado', 'atajos', 'rapidos'],
      order: 2,
      content: `# Atajos de Teclado del Editor\n\nAcelera tu flujo de trabajo con las siguientes combinaciones de teclas:\n\n- **[P]** / **[Pen]** - Pincel\n- **[E]** / **[Eraser]** - Borrador\n- **[G]** / **[Bucket]** - Bote de Pintura\n- **[M]** / **[Selection]** - Selección Rectangular\n- **[Ctrl + Z]** - Deshacer\n- **[Ctrl + Y]** - Rehacer`
    });
  }
}

export const helpSystem = HelpSystem.getInstance();
