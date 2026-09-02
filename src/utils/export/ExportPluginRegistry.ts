import { ExportPlugin } from './ExportTypes';
import { PngPlugin, JpegPlugin, WebpPlugin, BmpPlugin, TiffPlugin, TgaPlugin, IcoPlugin } from './plugins/ImagePlugins';
import { GplPlugin, PalPlugin, ActPlugin, AcoPlugin } from './plugins/PalettePlugins';
import { GifPlugin, ApngPlugin, SpriteSheetSimplePlugin } from './plugins/AnimationPlugins';
import { SpriteSheetJsonPlugin, SpriteSheetXmlPlugin, PngSequenceZipPlugin } from './plugins/GamePlugins';

/**
 * Registry responsible for storing, organizing, and retrieving modular ExportPlugins.
 * Promotes the Open/Closed Principle (OCP) by avoiding hardcoded switch-case structures in UI.
 */
export class ExportPluginRegistry {
  private plugins = new Map<string, ExportPlugin>();

  /**
   * Registers a new plugin in the system.
   */
  public register(plugin: ExportPlugin): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`[ExportPluginRegistry] Overwriting plugin with ID: "${plugin.id}"`);
    }
    this.plugins.set(plugin.id, plugin);
  }

  /**
   * Registers multiple plugins at once to automate bulk setup.
   */
  public registerAll(plugins: ExportPlugin[]): void {
    plugins.forEach((p) => this.register(p));
  }

  /**
   * Retrieves a plugin by its unique ID.
   */
  public get(id: string): ExportPlugin | undefined {
    return this.plugins.get(id);
  }

  /**
   * Unregisters a plugin. Useful for cleanup or dynamically loaded extensions.
   */
  public unregister(id: string): boolean {
    return this.plugins.delete(id);
  }

  /**
   * Returns a list of all registered plugins.
   */
  public getAll(): ExportPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Filters registered plugins by their functional category.
   */
  public getByCategory(category: 'image' | 'animation' | 'game' | 'palette'): ExportPlugin[] {
    return this.getAll().filter((p) => p.category === category);
  }

  /**
   * Clears all registered plugins.
   */
  public clear(): void {
    this.plugins.clear();
  }
}

// Global default singleton registry instance
export const exportPluginRegistry = new ExportPluginRegistry();

// Auto-register all migrated modular plugins
exportPluginRegistry.register(PngPlugin);
exportPluginRegistry.register(JpegPlugin);
exportPluginRegistry.register(WebpPlugin);
exportPluginRegistry.register(BmpPlugin);
exportPluginRegistry.register(TiffPlugin);
exportPluginRegistry.register(TgaPlugin);
exportPluginRegistry.register(IcoPlugin);

exportPluginRegistry.register(GplPlugin);
exportPluginRegistry.register(PalPlugin);
exportPluginRegistry.register(ActPlugin);
exportPluginRegistry.register(AcoPlugin);

exportPluginRegistry.register(GifPlugin);
exportPluginRegistry.register(ApngPlugin);
exportPluginRegistry.register(SpriteSheetSimplePlugin);

exportPluginRegistry.register(SpriteSheetJsonPlugin);
exportPluginRegistry.register(SpriteSheetXmlPlugin);
exportPluginRegistry.register(PngSequenceZipPlugin);

