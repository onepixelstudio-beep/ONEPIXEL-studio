/**
 * NativeFileBridge.ts
 * 
 * Lightweight, zero-dependency optional compatibility bridge for native application containers
 * (such as Tauri on Android, Windows, Linux, macOS) or custom native WebViews.
 * 
 * ARCHITECTURAL PRINCIPLES:
 * 1. Absolutely NO imports from @tauri-apps/* or any Tauri package in this repository.
 * 2. Completely inactive and silent in standard desktop/mobile web browsers.
 * 3. Safely detects runtime globals (window.__TAURI__, window.__TAURI_FILE_BRIDGE__).
 * 4. Provides a unified saveFile and promptSavePath abstraction.
 * 5. Returns serializable URI strings so project references can be stored without object serialization issues.
 */

export interface NativeSaveFileOptions {
  filename: string;
  extension?: string;
  mimeType: string;
  data: Uint8Array | string;
  existingUri?: string | null;
  title?: string;
  defaultPath?: string;
}

export interface NativeSaveResult {
  success: boolean;
  cancelled: boolean;
  uri?: string;
  error?: any;
}

export interface NativePromptOptions {
  defaultPath?: string;
  filename?: string;
  extension?: string;
  title?: string;
}

export class NativeFileBridge {
  /**
   * Checks whether a native file bridge environment is available in the current runtime.
   * Returns false in standard web browsers.
   */
  public static isAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as any;

    // 1. Explicit custom bridge injection
    if (win.__TAURI_FILE_BRIDGE__ || win.__ONEPIXEL_NATIVE_BRIDGE__) {
      return true;
    }

    // 2. Standard Tauri container runtime (withGlobalTauri: true in tauri.conf)
    if (win.__TAURI__ && (win.__TAURI__.dialog || win.__TAURI__.fs || win.__TAURI__.core || win.__TAURI__.invoke)) {
      return true;
    }

    return false;
  }

  /**
   * Prompts the native OS Save File dialog to choose a file path/URI.
   * Returns null if the user cancels or if the dialog is unavailable.
   */
  public static async promptSavePath(options: NativePromptOptions): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    const win = window as any;

    const ext = (options.extension || 'onepixel').replace(/^\./, '').toLowerCase();
    const cleanFilename = (options.filename || 'Sin_Título').trim().replace(/[/\\?%*:|"<>]/g, '_');
    const suggestedName = `${cleanFilename}.${ext}`;
    const defaultPath = options.defaultPath || suggestedName;

    // 1. Check custom bridge implementation
    if (win.__TAURI_FILE_BRIDGE__ && typeof win.__TAURI_FILE_BRIDGE__.promptSavePath === 'function') {
      try {
        const res = await win.__TAURI_FILE_BRIDGE__.promptSavePath({
          ...options,
          defaultPath,
          filename: cleanFilename,
          extension: ext
        });
        return res || null;
      } catch (e) {
        console.warn('[NativeFileBridge] Error in __TAURI_FILE_BRIDGE__.promptSavePath:', e);
      }
    }

    // 2. Check Tauri dialog (v1 / v2)
    const tauriDialog = win.__TAURI__?.dialog;
    if (tauriDialog) {
      const filters = this.buildFilters(ext);
      const dialogOpts: any = {
        defaultPath,
        filters,
        title: options.title || (ext === 'onepixel' ? 'Guardar Proyecto OnePixel' : `Exportar ${ext.toUpperCase()}`)
      };

      try {
        if (typeof tauriDialog.save === 'function') {
          const pathResult = await tauriDialog.save(dialogOpts);
          return pathResult || null;
        }
        if (typeof tauriDialog.saveFile === 'function') {
          const pathResult = await tauriDialog.saveFile(dialogOpts);
          return pathResult || null;
        }
      } catch (err: any) {
        if (err.name === 'AbortError' || String(err).includes('cancelled') || String(err).includes('cancel')) {
          return null;
        }
        console.error('[NativeFileBridge] Error prompting Tauri save dialog:', err);
        throw err;
      }
    }

    return null;
  }

  /**
   * Physically saves binary or text data to disk using the native container.
   * - If existingUri is provided, directly overwrites the file without prompting.
   * - If existingUri is null or undefined, prompts the native save dialog first.
   */
  public static async saveFile(options: NativeSaveFileOptions): Promise<NativeSaveResult> {
    if (typeof window === 'undefined') {
      return { success: false, cancelled: false, error: new Error('Window is undefined') };
    }
    const win = window as any;

    // 1. Resolve or prompt for target path/URI
    let targetUri = options.existingUri;
    if (!targetUri) {
      try {
        const selectedUri = await this.promptSavePath({
          filename: options.filename,
          extension: options.extension,
          defaultPath: options.defaultPath,
          title: options.title
        });

        if (!selectedUri) {
          return { success: false, cancelled: true };
        }
        targetUri = selectedUri;
      } catch (err) {
        return { success: false, cancelled: false, error: err };
      }
    }

    // 2. Prepare binary buffer and text representations
    let uint8Data: Uint8Array;
    let textData: string | undefined;

    if (typeof options.data === 'string') {
      textData = options.data;
      uint8Data = new TextEncoder().encode(options.data);
    } else if (options.data instanceof Uint8Array) {
      uint8Data = options.data;
    } else {
      uint8Data = new Uint8Array(options.data);
    }

    // 3. Attempt write through custom bridge if present
    if (win.__TAURI_FILE_BRIDGE__) {
      if (typeof win.__TAURI_FILE_BRIDGE__.saveFile === 'function') {
        try {
          const res = await win.__TAURI_FILE_BRIDGE__.saveFile({
            ...options,
            existingUri: targetUri,
            data: uint8Data
          });
          return {
            success: !!res.success,
            cancelled: !!res.cancelled,
            uri: res.uri || targetUri,
            error: res.error
          };
        } catch (e) {
          console.warn('[NativeFileBridge] Error in __TAURI_FILE_BRIDGE__.saveFile, falling back:', e);
        }
      }
      if (typeof win.__TAURI_FILE_BRIDGE__.writeFile === 'function') {
        try {
          await win.__TAURI_FILE_BRIDGE__.writeFile(targetUri, uint8Data);
          return { success: true, cancelled: false, uri: targetUri };
        } catch (e) {
          return { success: false, cancelled: false, uri: targetUri, error: e };
        }
      }
    }

    // 4. Attempt write through Tauri fs API (v2 or v1)
    const tauriFs = win.__TAURI__?.fs;
    if (tauriFs) {
      try {
        // Tauri v2 plugin-fs: writeFile(path, Uint8Array | number[])
        if (typeof tauriFs.writeFile === 'function') {
          await tauriFs.writeFile(targetUri, uint8Data);
          return { success: true, cancelled: false, uri: targetUri };
        }

        // Tauri v1 fs: writeBinaryFile(path, contents)
        if (typeof tauriFs.writeBinaryFile === 'function') {
          await tauriFs.writeBinaryFile(targetUri, uint8Data);
          return { success: true, cancelled: false, uri: targetUri };
        }

        // If file is text (JSON, onepixel project, etc.) and writeTextFile is available:
        if (typeof tauriFs.writeTextFile === 'function') {
          if (!textData) {
            textData = new TextDecoder('utf-8').decode(uint8Data);
          }
          await tauriFs.writeTextFile(targetUri, textData);
          return { success: true, cancelled: false, uri: targetUri };
        }
      } catch (err: any) {
        console.error('[NativeFileBridge] Error writing file via Tauri fs:', err);
        return { success: false, cancelled: false, uri: targetUri, error: err };
      }
    }

    // 5. Attempt Tauri IPC invocation if core/invoke is available
    if (win.__TAURI__?.core && typeof win.__TAURI__.core.invoke === 'function') {
      try {
        await win.__TAURI__.core.invoke('plugin:fs|write_file', {
          path: targetUri,
          data: Array.from(uint8Data)
        });
        return { success: true, cancelled: false, uri: targetUri };
      } catch (invokeErr) {
        console.warn('[NativeFileBridge] Tauri core invoke failed:', invokeErr);
      }
    }

    return {
      success: false,
      cancelled: false,
      uri: targetUri,
      error: new Error('No compatible native file write method found on runtime bridge.')
    };
  }

  /**
   * Helper to construct dialog file filters based on file extension.
   */
  private static buildFilters(ext: string): Array<{ name: string; extensions: string[] }> {
    const filters: Array<{ name: string; extensions: string[] }> = [];
    if (ext === 'onepixel') {
      filters.push({ name: 'Proyecto OnePixel (*.onepixel)', extensions: ['onepixel'] });
    } else if (ext === 'json') {
      filters.push({ name: 'Documento JSON (*.json)', extensions: ['json'] });
    } else if (ext === 'png') {
      filters.push({ name: 'Imagen PNG (*.png)', extensions: ['png'] });
    } else if (ext === 'gif') {
      filters.push({ name: 'Imagen GIF (*.gif)', extensions: ['gif'] });
    } else if (ext === 'webp') {
      filters.push({ name: 'Imagen WebP (*.webp)', extensions: ['webp'] });
    } else if (ext === 'apng') {
      filters.push({ name: 'Imagen APNG (*.apng)', extensions: ['apng', 'png'] });
    } else if (ext === 'zip') {
      filters.push({ name: 'Archivo ZIP (*.zip)', extensions: ['zip'] });
    } else {
      filters.push({ name: `Archivo ${ext.toUpperCase()} (*.${ext})`, extensions: [ext] });
    }
    filters.push({ name: 'Todos los archivos (*.*)', extensions: ['*'] });
    return filters;
  }
}
