import { EncodedFile } from './ExportTypes';
import { SaveError, CancelError } from './ExportErrors';
import { isFileSystemAccessSupported, logFileTest } from '../saveManager';

/**
 * Service responsible for managing local persistence and browser downloads.
 * Unifies saving actions into a single point of truth to avoid duplicate code
 * and bypass environment constraints cleanly.
 */
export class FileSaveService {
  /**
   * Prompts the native OS Save File Picker directly on user gesture.
   * Returns the FileSystemFileHandle if successful, throws CancelError if user cancels,
   * or returns null if the environment restricts the API (e.g. iframe sandbox).
   */
  public static async promptSaveHandle(filename: string, extension: string, mimeType?: string): Promise<any | null> {
    if (!isFileSystemAccessSupported()) {
      return null;
    }
    const ext = extension.toLowerCase().replace(/^\./, '');
    let safeMime = 'application/octet-stream';
    let description = `Archivo ${ext.toUpperCase()} (*.${ext})`;

    if (ext === 'png') {
      safeMime = 'image/png';
      description = 'Imagen PNG (*.png)';
    } else if (ext === 'apng') {
      safeMime = 'image/png';
      description = 'Imagen APNG Animada (*.apng, *.png)';
    } else if (ext === 'gif') {
      safeMime = 'image/gif';
      description = 'Imagen GIF Animada (*.gif)';
    } else if (ext === 'webp') {
      safeMime = 'image/webp';
      description = 'Imagen WebP (*.webp)';
    } else if (ext === 'jpg' || ext === 'jpeg') {
      safeMime = 'image/jpeg';
      description = 'Imagen JPEG (*.jpg, *.jpeg)';
    } else if (ext === 'bmp') {
      safeMime = 'image/bmp';
      description = 'Imagen Bitmap (*.bmp)';
    } else if (ext === 'ico') {
      safeMime = 'image/x-icon';
      description = 'Icono Windows (*.ico)';
    } else if (ext === 'tiff' || ext === 'tif') {
      safeMime = 'image/tiff';
      description = 'Imagen TIFF (*.tiff, *.tif)';
    } else if (ext === 'svg') {
      safeMime = 'image/svg+xml';
      description = 'Vector SVG (*.svg)';
    } else if (ext === 'json') {
      safeMime = 'application/json';
      description = 'Documento JSON (*.json)';
    } else if (ext === 'xml') {
      safeMime = 'application/xml';
      description = 'Documento XML (*.xml)';
    } else if (ext === 'mp4') {
      safeMime = 'video/mp4';
      description = 'Video MP4 (*.mp4)';
    } else if (ext === 'webm') {
      safeMime = 'video/webm';
      description = 'Video WebM (*.webm)';
    } else if (ext === 'zip') {
      safeMime = 'application/zip';
      description = 'Archivo Comprimido ZIP (*.zip)';
    } else if (ext === 'txt') {
      safeMime = 'text/plain';
      description = 'Documento de Texto (*.txt)';
    } else {
      safeMime = 'application/octet-stream';
      description = `Archivo ${ext.toUpperCase()} (*.${ext})`;
    }

    const sanitizedBase = filename.replace(/[/\\?%*:|"<>]/g, '_');
    const finalFilename = `${sanitizedBase}.${ext}`;
    const acceptTypes: Record<string, string[]> = {};
    if (ext === 'jpg' || ext === 'jpeg') {
      acceptTypes['image/jpeg'] = ['.jpg', '.jpeg'];
    } else if (ext === 'tiff' || ext === 'tif') {
      acceptTypes['image/tiff'] = ['.tiff', '.tif'];
    } else if (ext === 'apng') {
      acceptTypes['image/png'] = ['.apng', '.png'];
    } else {
      acceptTypes[safeMime] = [`.${ext}`];
    }

    const options = {
      suggestedName: finalFilename,
      types: [
        {
          description,
          accept: acceptTypes,
        }
      ]
    };

    const isTopWindow = typeof window !== 'undefined' ? (window.top === window.self) : false;
    const isSecure = typeof window !== 'undefined' ? window.isSecureContext : false;
    const hasPicker = typeof window !== 'undefined' && typeof (window as any).showSaveFilePicker === 'function';
    const userActivation = typeof navigator !== 'undefined' && (navigator as any).userActivation
      ? {
          isActive: (navigator as any).userActivation.isActive,
          hasBeenActive: (navigator as any).userActivation.hasBeenActive
        }
      : 'no_user_activation_api';

    console.log(`%c[FileSaveService promptSaveHandle]`, 'background: #1e1b4b; color: #818cf8; font-weight: bold; padding: 2px 6px; border-radius: 4px;', {
      options,
      diagnosticEnv: {
        isTopWindow,
        isIframe: !isTopWindow,
        isSecureContext: isSecure,
        userActivation,
        hasShowSaveFilePicker: hasPicker,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
      }
    });

    if (!isTopWindow) {
      logFileTest('Exportar', {
        picker_called: false,
        handle_obtained: false,
        selected_filename: null
      });
      console.warn('[FileSaveService.promptSaveHandle] Ejecutando dentro de un iframe/sandbox. El selector nativo requiere ventana de nivel superior.');
      throw new SaveError(
        'El selector nativo de destino no está permitido dentro de un marco secundario (iframe). Abre OnePixel Studio en una pestaña/ventana independiente de Edge o Chrome para seleccionar la carpeta y nombre de archivo directamente.'
      );
    }

    if (!hasPicker) {
      // Browser does not support File System Access API (e.g. Safari / Firefox on top level)
      logFileTest('Exportar', {
        picker_called: false,
        handle_obtained: false,
        selected_filename: null
      });
      return null;
    }

    logFileTest('Exportar', {
      picker_called: true,
      handle_obtained: false,
      selected_filename: null
    });

    try {
      const handle = await (window as any).showSaveFilePicker(options);
      console.log(`%c[FileSaveService promptSaveHandle] ÉXITO`, 'background: #102419; color: #22c55e; font-weight: bold; padding: 2px 6px; border-radius: 4px;', {
        handleName: handle?.name
      });
      logFileTest('Exportar', {
        picker_called: true,
        handle_obtained: true,
        selected_filename: handle?.name || finalFilename
      });
      return handle;
    } catch (pickerErr: any) {
      logFileTest('Exportar', {
        picker_called: true,
        handle_obtained: false,
        selected_filename: null
      });

      if (pickerErr.name === 'AbortError') {
        console.log('[FileSaveService.promptSaveHandle] Exportación cancelada por el usuario (AbortError).');
        throw new CancelError('Exportación cancelada por el usuario.');
      }
      console.error(`%c[FileSaveService promptSaveHandle] ERROR`, 'background: #450a0a; color: #f87171; font-weight: bold; padding: 2px 6px; border-radius: 4px;', {
        name: pickerErr.name,
        message: pickerErr.message,
        stack: pickerErr.stack,
        isIframe: !isTopWindow,
        isSecureContext: isSecure,
        userActivation
      });

      if (pickerErr.name === 'SecurityError') {
        throw new SaveError(
          'El selector nativo fue bloqueado por seguridad del entorno (iframe/sandbox). Abre OnePixel Studio en una ventana independiente.'
        );
      }

      throw pickerErr;
    }
  }

  /**
   * Saves the provided EncodedFile to the user's local disk via native location picker or standard browser downloads.
   * If preSelectedHandle is provided, writes directly to it.
   */
  public static async save(file: EncodedFile, preSelectedHandle?: any): Promise<void> {
    const { filename, extension, data, mimeType } = file;
    const finalFilename = `${filename}.${extension}`;

    let blob: Blob;
    try {
      // 1. Resolve raw data into a Blob
      if (data instanceof Blob) {
        blob = data;
      } else if (typeof data === 'string') {
        // Base64 encoding or raw text format
        if (data.startsWith('data:')) {
          blob = this.dataUrlToBlob(data);
        } else {
          blob = new Blob([data], { type: mimeType });
        }
      } else {
        // Uint8Array or ArrayBuffer
        blob = new Blob([data], { type: mimeType });
      }
    } catch (err: any) {
      throw new SaveError(`Error resolviendo los datos a Blob para guardar: ${err.message}`);
    }

    // 2. Use preSelectedHandle or attempt File System Access API
    let handle = preSelectedHandle;
    if (!handle && isFileSystemAccessSupported()) {
      try {
        handle = await this.promptSaveHandle(filename, extension, mimeType);
      } catch (err: any) {
        if (err instanceof CancelError || err.name === 'AbortError') {
          throw new CancelError('Guardado cancelado por el usuario.');
        }
      }
    }

    if (handle && typeof handle.createWritable === 'function') {
      try {
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (writeErr: any) {
        console.warn('[FileSaveService] Error escribiendo en el handle obtenido, intentando fallback:', writeErr);
      }
    }

    // 3. Fallback: Trigger standard browser download
    if (typeof document === 'undefined' || typeof window === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) {
      // Running in server-side or worker environment where DOM is not present
      return;
    }

    let url: string;
    try {
      url = URL.createObjectURL(blob);
    } catch (err: any) {
      throw new SaveError(`Error creando el ObjectURL: ${err.message}`);
    }

    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = finalFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      throw new SaveError(`Fallo al interactuar con el DOM para descargar el archivo: ${err.message}`);
    } finally {
      // Force immediate release of browser memory allocating the Blob URL
      try {
        setTimeout(() => URL.revokeObjectURL(url), 100);
      } catch (e) {
        // Safe fallback
      }
    }
  }

  /**
   * Helper utility to safely convert a base64 DataURL string into a raw Blob.
   */
  private static dataUrlToBlob(dataUrl: string): Blob {
    try {
      const parts = dataUrl.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      const base64 = parts[1];
      const binaryStr = atob(base64);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      return new Blob([bytes], { type: mime });
    } catch (err: any) {
      throw new SaveError(`DataURL inválido: ${err.message}`);
    }
  }
}
