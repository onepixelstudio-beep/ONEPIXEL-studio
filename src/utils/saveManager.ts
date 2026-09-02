import { PixelProject } from '../types';
import { saveDebug } from './saveDebug';
import { LocalPersistence } from './persistence/LocalPersistence';

/**
 * Determines if the current execution context is the top-level window.
 * Returns false if embedded in an iframe (including cross-origin subframes) or if window is undefined.
 */
export function isTopLevelWindow(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    // In cross-origin iframes, comparing window.self === window.top may throw or return false
    return window.self === window.top;
  } catch {
    return false;
  }
}

/**
 * Diagnostic logger specifically for physical file test assertions.
 */
export function logFileTest(operation: string, details: {
  picker_called?: boolean;
  handle_obtained?: boolean;
  selected_filename?: string | null;
}) {
  const isTopLevel = isTopLevelWindow();
  const isSecureContext = typeof window !== 'undefined' ? window.isSecureContext : false;
  const showSaveFilePicker = typeof window !== 'undefined' && typeof (window as any).showSaveFilePicker === 'function';
  const userActivationIsActive = typeof navigator !== 'undefined' && (navigator as any).userActivation
    ? (navigator as any).userActivation.isActive
    : false;

  console.log(`[FILE_TEST] operation: ${operation}`);
  console.log(`[FILE_TEST] isTopLevel: ${isTopLevel}`);
  console.log(`[FILE_TEST] isSecureContext: ${isSecureContext}`);
  console.log(`[FILE_TEST] showSaveFilePicker: ${showSaveFilePicker}`);
  console.log(`[FILE_TEST] userActivation.isActive: ${userActivationIsActive}`);
  console.log(`[FILE_TEST] picker_called: ${details.picker_called === true}`);
  console.log(`[FILE_TEST] handle_obtained: ${details.handle_obtained === true}`);
  console.log(`[FILE_TEST] selected_filename: ${details.selected_filename || 'null'}`);
}

/**
 * Checks if the File System Access API is genuinely usable in the current browser/environment.
 * Requires:
 * 1. window and window.showSaveFilePicker to be available as a function.
 * 2. The application to be running in a top-level window (not an iframe / cross-origin subframe).
 * Records exact diagnostic details on demand when called during save actions.
 */
export function isFileSystemAccessSupported(): boolean {
  if (typeof window === 'undefined') return false;

  const isTopWindow = isTopLevelWindow();
  const hasShowSaveFilePicker = typeof (window as any).showSaveFilePicker === 'function';
  const hasShowOpenFilePicker = typeof (window as any).showOpenFilePicker === 'function';
  const hasShowDirectoryPicker = typeof (window as any).showDirectoryPicker === 'function';

  const showSaveFilePickerType = typeof (window as any).showSaveFilePicker;
  const isSecureContext = window.isSecureContext;

  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
  const windowOrigin = window.location ? window.location.origin : 'unknown';

  const userActivation = (typeof navigator !== 'undefined' && (navigator as any).userActivation)
    ? {
        isActive: (navigator as any).userActivation.isActive,
        hasBeenActive: (navigator as any).userActivation.hasBeenActive
      }
    : 'UNAVAILABLE';

  // Usable ONLY when the API exists AND the window is the top-level window
  const isSupported = hasShowSaveFilePicker && isTopWindow;

  saveDebug('saveManager', '[DEBUG_SAVE] FILE_SYSTEM_API_DIAGNOSTIC', {
    isSupported,
    hasShowSaveFilePicker,
    isTopWindow,
    isIframe: !isTopWindow,
    isSecureContext,
    userAgent,
    windowOrigin,
    userActivation
  });

  return isSupported;
}

/**
 * Diagnostic logger for File System Operations
 */
function logFileOperation(stage: string, data: any) {
  const isTopWindow = typeof window !== 'undefined' ? (window.top === window.self) : false;
  const isSecure = typeof window !== 'undefined' ? window.isSecureContext : false;
  const userActivation = typeof navigator !== 'undefined' && (navigator as any).userActivation
    ? {
        isActive: (navigator as any).userActivation.isActive,
        hasBeenActive: (navigator as any).userActivation.hasBeenActive
      }
    : 'no_user_activation_api';

  saveDebug('saveManager', `[DEBUG_SAVE] ${stage}`, {
    ...data,
    diagnosticEnv: {
      isTopWindow,
      isIframe: !isTopWindow,
      isSecureContext: isSecure,
      userActivation,
      hasShowSaveFilePicker: typeof window !== 'undefined' && typeof (window as any).showSaveFilePicker === 'function',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    }
  });
}

/**
 * Saves an active project.
 * 1. If a valid fileHandle exists on the payload, it attempts to overwrite the file directly in disk.
 * 2. If no fileHandle exists (e.g. Firefox, Safari, iframe, or first save without handle):
 *    - If File System Access API is available (Chromium top-level): prompts native picker and gets handle.
 *    - If File System Access is unavailable:
 *       - If it's the FIRST save (hasDownloadedInitialFile is falsy): triggers the initial physical .onepixel download once.
 *       - If already downloaded previously: does NOT trigger repeated downloads. Confirms saved locally.
 * 
 * Returns an object containing the status:
 * - success: boolean
 * - savedViaHandle: boolean
 * - fileHandle: the file handle that was used (or null)
 * - actualName?: string
 * - hasDownloadedInitialFile?: boolean
 * - cancelled?: boolean
 * - error?: any
 */
export async function saveProject(
  projectPayload: PixelProject
): Promise<{ success: boolean; savedViaHandle: boolean; fileHandle: any | null; actualName?: string; hasDownloadedInitialFile?: boolean; cancelled?: boolean; error?: any }> {
  const fileFormat = (projectPayload.fileFormat || 'onepixel').toLowerCase().replace(/^\./, '');
  const fileName = projectPayload.name || 'Sin_Título';

  logFileOperation('SAVE_PROJECT_ENTER', {
    hasExistingHandle: !!projectPayload.fileHandle,
    existingHandleName: projectPayload.fileHandle?.name || null,
    hasDownloadedInitialFile: !!projectPayload.hasDownloadedInitialFile,
    projectName: fileName,
    fileFormat
  });

  // 1. Try to save directly using fileHandle if available
  if (projectPayload.fileHandle) {
    logFileTest('Guardar', {
      picker_called: false,
      handle_obtained: true,
      selected_filename: projectPayload.fileHandle.name || `${fileName}.${fileFormat}`
    });

    logFileOperation('EXISTING_HANDLE', {
      handleName: projectPayload.fileHandle.name,
      action: 'Intentando sobrescritura directa en disco'
    });

    try {
      const handle = projectPayload.fileHandle;
      if (typeof handle.createWritable !== 'function') {
        throw new Error('El fileHandle no soporta la función createWritable.');
      }

      // Check and request readwrite permission if needed
      if (typeof handle.queryPermission === 'function') {
        let permission = await handle.queryPermission({ mode: 'readwrite' });
        if (permission !== 'granted' && typeof handle.requestPermission === 'function') {
          permission = await handle.requestPermission({ mode: 'readwrite' });
        }
        if (permission !== 'granted') {
          logFileOperation('SAVE_ERROR', {
            handleName: handle.name,
            reason: 'Permiso denegado',
            action: 'Redirigiendo a saveProjectAs'
          });
          return await saveProjectAs(projectPayload, fileName, fileFormat, 'Guardar');
        }
      }

      logFileOperation('WRITING_FILE', {
        target: 'existing_handle',
        handleName: handle.name
      });

      const writable = await handle.createWritable();
      
      // Clear fileHandle property in the serialized file to avoid bloating or circularity
      const cleanPayload = { ...projectPayload, fileHandle: undefined, lastSaved: Date.now(), hasBeenSavedLocally: true, hasDownloadedInitialFile: true };
      await writable.write(JSON.stringify(cleanPayload, null, 2));
      await writable.close();

      // Persist locally as well to ensure recovery
      LocalPersistence.saveProject(cleanPayload);
      LocalPersistence.saveActiveSession(cleanPayload);

      logFileOperation('WRITE_SUCCESS', {
        handleName: handle.name || fileName,
        action: 'Sobrescritura completada sin selector ni descargas'
      });

      return {
        success: true,
        savedViaHandle: true,
        fileHandle: handle,
        actualName: fileName,
        hasDownloadedInitialFile: true
      };
    } catch (err: any) {
      logFileOperation('SAVE_ERROR', {
        stage: 'existing_handle_write',
        errorName: err.name,
        errorMessage: err.message,
        action: 'Reintentando mediante saveProjectAs'
      });
    }
  } else {
    logFileOperation('NO_EXISTING_HANDLE', {
      hasDownloadedInitialFile: !!projectPayload.hasDownloadedInitialFile,
      action: 'No existe handle en memoria'
    });
  }

  // 2. If no fileHandle exists:
  // Check if File System Access API is supported.
  const hasShowSave = isFileSystemAccessSupported();
  if (hasShowSave) {
    // In Chromium, prompt native picker to get a real handle
    return await saveProjectAs(projectPayload, fileName, fileFormat, 'Guardar');
  }

  // 3. In Firefox / Safari / iframe without File System Access:
  // If this project has NOT had its initial physical file downloaded yet, download it once.
  if (!projectPayload.hasDownloadedInitialFile) {
    logFileOperation('INITIAL_PHYSICAL_DOWNLOAD', {
      projectName: fileName,
      fileFormat,
      action: 'Generando descarga inicial única del archivo .onepixel'
    });
    const downloadResult = await saveProjectAs(projectPayload, fileName, fileFormat, 'Guardar');
    return {
      ...downloadResult,
      hasDownloadedInitialFile: downloadResult.success
    };
  }

  // 4. If initial physical file was already downloaded previously:
  // Persist locally without triggering duplicate downloads.
  const cleanPayload = {
    ...projectPayload,
    fileHandle: undefined,
    lastSaved: Date.now(),
    hasBeenSavedLocally: true,
    hasDownloadedInitialFile: true
  };
  LocalPersistence.saveProject(cleanPayload);
  LocalPersistence.saveActiveSession(cleanPayload);

  logFileOperation('SAVED_LOCALLY_NO_DUPLICATE_DOWNLOAD', {
    projectName: fileName,
    action: 'Proyecto guardado localmente; omitiendo descarga duplicada'
  });

  return {
    success: true,
    savedViaHandle: false,
    fileHandle: null,
    actualName: fileName,
    hasDownloadedInitialFile: true
  };
}

function getOnePixelTypeDescription(): string {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('pixel_art_preferences') : null;
    if (raw) {
      const prefs = JSON.parse(raw);
      const lang = prefs.language || (typeof navigator !== 'undefined' ? navigator.language : 'es');
      if (lang === 'es' || lang.startsWith('es')) return 'Proyecto OnePixel (*.onepixel)';
      if (lang === 'en' || lang.startsWith('en')) return 'OnePixel Project (*.onepixel)';
      if (lang === 'pt' || lang.startsWith('pt')) return 'Projeto OnePixel (*.onepixel)';
      if (lang === 'zh-CN' || lang.startsWith('zh')) return 'OnePixel 项目 (*.onepixel)';
      if (lang === 'ru' || lang.startsWith('ru')) return 'Проект OnePixel (*.onepixel)';
      if (lang === 'ja' || lang.startsWith('ja')) return 'OnePixel プロジェクト (*.onepixel)';
    }
  } catch {}
  return 'OnePixel Project (*.onepixel)';
}

/**
 * Performs a "Save As" (Guardar como) action.
 * If the File System Access API is supported, opens a native file picker to store the file and get a handle.
 * If not supported or if the picker is blocked by security policies (iframe), falls back to standard download.
 * 
 * Returns an object containing:
 * - success: boolean
 * - savedViaHandle: boolean
 * - fileHandle: updated file handle (or null)
 * - actualName?: string
 * - hasDownloadedInitialFile?: boolean
 * - error?: any
 * - cancelled?: boolean
 */
export async function saveProjectAs(
  projectPayload: PixelProject,
  chosenName: string,
  chosenFormat: string = 'onepixel',
  operationName: string = 'Guardar como'
): Promise<{ success: boolean; savedViaHandle: boolean; fileHandle: any | null; actualName?: string; hasDownloadedInitialFile?: boolean; error?: any; cancelled?: boolean }> {
  
  const cleanBaseName = (chosenName || 'Sin_Título').trim();
  const format = (chosenFormat || 'onepixel').toLowerCase().replace(/^\./, '');
  const sanitizedBaseName = cleanBaseName.replace(/[/\\?%*:|"<>]/g, '_');
  const suggestedFilename = `${sanitizedBaseName}.${format}`;

  const hasShowSave = isFileSystemAccessSupported();

  // 1. If File System Access API is supported, use showSaveFilePicker directly with strict error reporting
  if (hasShowSave) {
    try {
      const pickerTypes: any[] = [];
      if (format === 'onepixel') {
        pickerTypes.push({
          description: getOnePixelTypeDescription(),
          accept: {
            'application/x-onepixel': ['.onepixel'],
          },
        });
      } else if (format === 'json') {
        pickerTypes.push({
          description: 'Documento JSON (*.json)',
          accept: {
            'application/json': ['.json'],
          },
        });
      } else {
        pickerTypes.push({
          description: `Archivo ${format.toUpperCase()} (*.${format})`,
          accept: {
            'application/octet-stream': [`.${format}`],
          },
        });
      }

      const options = {
        suggestedName: suggestedFilename,
        types: pickerTypes,
      };

      logFileOperation('CALLING_SHOW_SAVE_FILE_PICKER', { options });
      logFileTest(operationName, {
        picker_called: true,
        handle_obtained: false,
        selected_filename: null
      });

      let selectedHandle: any = null;
      try {
        selectedHandle = await (window as any).showSaveFilePicker(options);
        logFileOperation('HANDLE_OBTAINED', {
          handleName: selectedHandle?.name
        });
        logFileTest(operationName, {
          picker_called: true,
          handle_obtained: true,
          selected_filename: selectedHandle?.name || suggestedFilename
        });
      } catch (pickerErr: any) {
        logFileTest(operationName, {
          picker_called: true,
          handle_obtained: false,
          selected_filename: null
        });

        if (pickerErr.name === 'AbortError') {
          logFileOperation('SAVE_CANCELLED', {
            action: 'Usuario canceló en el selector nativo'
          });
          return {
            success: false,
            savedViaHandle: false,
            fileHandle: null,
            cancelled: true
          };
        }
        
        logFileOperation('PICKER_ERROR', {
          errorName: pickerErr.name,
          errorMessage: pickerErr.message,
          errorStack: pickerErr.stack
        });

        // Strict error: return explicit failure, no silent blob fallback when API is supported
        return {
          success: false,
          savedViaHandle: false,
          fileHandle: null,
          error: pickerErr
        };
      }
      
      if (!selectedHandle || typeof selectedHandle.createWritable !== 'function') {
        throw new Error('El objeto fileHandle obtenido no soporta la creación de flujos de escritura (createWritable).');
      }

      const derivedName = selectedHandle.name 
        ? selectedHandle.name.replace(/\.[^/.]+$/, '') 
        : cleanBaseName;

      const updatedPayload = {
        ...projectPayload,
        name: derivedName,
        fileFormat: format,
        lastSaved: Date.now(),
        hasBeenSavedLocally: true,
        fileHandle: undefined
      };

      logFileOperation('WRITING_FILE', {
        target: 'newly_obtained_handle',
        handleName: selectedHandle.name
      });

      const writable = await selectedHandle.createWritable();
      await writable.write(JSON.stringify(updatedPayload, null, 2));
      await writable.close();

      LocalPersistence.saveProject(updatedPayload);
      LocalPersistence.saveActiveSession(updatedPayload);

      logFileOperation('WRITE_SUCCESS', {
        handleName: selectedHandle.name,
        derivedName
      });

      return {
        success: true,
        savedViaHandle: true,
        fileHandle: selectedHandle,
        actualName: derivedName,
        hasDownloadedInitialFile: true
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        logFileOperation('SAVE_CANCELLED', {
          action: 'Deteniendo por cancelación'
        });
        return {
          success: false,
          savedViaHandle: false,
          fileHandle: null,
          cancelled: true
        };
      }
      logFileOperation('SAVE_WRITE_ERROR', {
        cause: err.name,
        message: err.message
      });
      return {
        success: false,
        savedViaHandle: false,
        fileHandle: null,
        error: err
      };
    }
  }

  // 2. Fallback for environments without File System Access (Firefox / Safari / iframe): standard Blob download
  try {
    logFileOperation('FALLBACK_DOWNLOAD', {
      stage: 'triggerBlobDownload',
      suggestedFilename
    });
    const updatedPayload = {
      ...projectPayload,
      name: cleanBaseName,
      fileFormat: format,
      lastSaved: Date.now(),
      hasBeenSavedLocally: true,
      hasDownloadedInitialFile: true,
      fileHandle: undefined
    };
    const success = triggerBlobDownload(updatedPayload, cleanBaseName, format);
    if (success) {
      LocalPersistence.saveProject(updatedPayload);
      LocalPersistence.saveActiveSession(updatedPayload);
    }
    return {
      success,
      savedViaHandle: false,
      fileHandle: null,
      actualName: cleanBaseName,
      hasDownloadedInitialFile: success
    };
  } catch (err: any) {
    logFileOperation('SAVE_ERROR', {
      stage: 'fallback_download_error',
      error: err
    });
    return {
      success: false,
      savedViaHandle: false,
      fileHandle: null,
      error: err
    };
  }
}

/**
 * Triggers a standard file download using Blobs in the browser.
 */
function triggerBlobDownload(projectPayload: PixelProject, fileName: string, fileFormat: string): boolean {
  if (typeof Blob === 'undefined') {
    throw new Error('La API de navegador "Blob" no está disponible en este entorno.');
  }
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    throw new Error('La API de navegador "URL.createObjectURL" no está disponible en este entorno.');
  }

  // Clear fileHandle in the serialized output
  const cleanPayload = { ...projectPayload, fileHandle: undefined };
  const blob = new Blob([JSON.stringify(cleanPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", url);
  downloadAnchor.setAttribute("download", `${fileName.replace(/\s+/g, '_')}.${fileFormat}`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();

  // Clean up reference in the background
  setTimeout(() => {
    URL.revokeObjectURL(url);
    downloadAnchor.remove();
  }, 150);

  return true;
}
