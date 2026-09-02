import { animationEventBus } from '../animation/EventBus';

export type DialogType = 'alert' | 'confirm' | 'prompt' | 'custom';

export interface DialogRequest {
  id: string;
  type: DialogType;
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  customComponent?: any;
  options?: Record<string, any>;
}

export class WindowSystem {
  private static instance: WindowSystem | null = null;
  private activeDialogs: DialogRequest[] = [];
  private listeners: Set<(dialogs: DialogRequest[]) => void> = new Set();

  private constructor() {}

  public static getInstance(): WindowSystem {
    if (!WindowSystem.instance) {
      WindowSystem.instance = new WindowSystem();
    }
    return WindowSystem.instance;
  }

  /**
   * Subscribes to changes in active dialogs.
   */
  public subscribe(callback: (dialogs: DialogRequest[]) => void): () => void {
    this.listeners.add(callback);
    callback([...this.activeDialogs]);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify(): void {
    this.listeners.forEach(cb => cb([...this.activeDialogs]));
    animationEventBus.emit('DIALOGS_UPDATED', { count: this.activeDialogs.length });
  }

  /**
   * Displays an alert modal. Returns a promise that resolves when accepted.
   */
  public alert(title: string, message: string, confirmText = 'Aceptar'): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const id = `dialog-alert-${Date.now()}-${Math.random()}`;
      const request: DialogRequest = {
        id,
        type: 'alert',
        title,
        message,
        confirmText,
        resolve: () => {
          this.close(id);
          resolve();
        },
        reject: () => {
          this.close(id);
          resolve(); // Alerts just resolve on cancel/dismiss
        }
      };
      this.activeDialogs.push(request);
      this.notify();
    });
  }

  /**
   * Displays a confirmation dialog. Returns a promise resolving to boolean.
   */
  public confirm(title: string, message: string, confirmText = 'Confirmar', cancelText = 'Cancelar'): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const id = `dialog-confirm-${Date.now()}-${Math.random()}`;
      const request: DialogRequest = {
        id,
        type: 'confirm',
        title,
        message,
        confirmText,
        cancelText,
        resolve: () => {
          this.close(id);
          resolve(true);
        },
        reject: () => {
          this.close(id);
          resolve(false);
        }
      };
      this.activeDialogs.push(request);
      this.notify();
    });
  }

  /**
   * Displays an interactive text input prompt. Returns a promise resolving to the string value, or null if cancelled.
   */
  public prompt(
    title: string,
    message: string,
    defaultValue = '',
    placeholder = '',
    confirmText = 'Aceptar',
    cancelText = 'Cancelar'
  ): Promise<string | null> {
    return new Promise<string | null>((resolve) => {
      const id = `dialog-prompt-${Date.now()}-${Math.random()}`;
      const request: DialogRequest = {
        id,
        type: 'prompt',
        title,
        message,
        placeholder,
        defaultValue,
        confirmText,
        cancelText,
        resolve: (value) => {
          this.close(id);
          resolve(value);
        },
        reject: () => {
          this.close(id);
          resolve(null);
        }
      };
      this.activeDialogs.push(request);
      this.notify();
    });
  }

  /**
   * Closes and cleans up a specific dialog.
   */
  public close(id: string): void {
    this.activeDialogs = this.activeDialogs.filter(d => d.id !== id);
    this.notify();
  }

  /**
   * Returns all active dialog requests.
   */
  public getActiveDialogs(): DialogRequest[] {
    return [...this.activeDialogs];
  }
}

export const windowSystem = WindowSystem.getInstance();
