/**
 * Base custom error for OnePixel export operations.
 */
export class ExportError extends Error {
  public readonly code: string;
  public readonly timestamp: number;

  constructor(message: string, code = 'EXPORT_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.timestamp = Date.now();
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when composition, rendering or blending fails in CoreRenderProcessor.
 */
export class RenderError extends ExportError {
  constructor(message: string, details?: string) {
    super(details ? `${message} (${details})` : message, 'RENDER_ERROR');
  }
}

/**
 * Thrown when format-specific serialization, compression or encoding fails in an ExportPlugin.
 */
export class EncodeError extends ExportError {
  constructor(message: string, details?: string) {
    super(details ? `${message} (${details})` : message, 'ENCODE_ERROR');
  }
}

/**
 * Thrown when local saving or writing to disk fails in FileSaveService.
 */
export class SaveError extends ExportError {
  constructor(message: string, details?: string) {
    super(details ? `${message} (${details})` : message, 'SAVE_ERROR');
  }
}

/**
 * Thrown when the export pipeline is cancelled midway via AbortSignal.
 */
export class CancelError extends ExportError {
  constructor(message: string = 'Export process was aborted by the user.') {
    super(message, 'CANCEL_ERROR');
  }
}
