export type CursorType =
  | 'default'
  | 'crosshair'
  | 'move'
  | 'pointer'
  | 'grab'
  | 'grabbing'
  | 'nwse-resize'
  | 'nesw-resize'
  | 'ns-resize'
  | 'ew-resize'
  | 'not-allowed'
  | 'zoom-in'
  | 'zoom-out';

export class CursorManager {
  private static instance: CursorManager | null = null;
  private currentCursor: string = 'default';
  private element: HTMLElement | null = null;
  private listeners: Set<(cursor: string) => void> = new Set();

  public static getInstance(): CursorManager {
    if (!CursorManager.instance) {
      CursorManager.instance = new CursorManager();
    }
    return CursorManager.instance;
  }

  public setElement(el: HTMLElement | null): void {
    this.element = el;
    if (this.element) {
      this.element.style.cursor = this.currentCursor;
    }
  }

  public setCursor(cursor: string): void {
    if (this.currentCursor === cursor) return;
    this.currentCursor = cursor;
    if (this.element) {
      this.element.style.cursor = cursor;
    }
    this.listeners.forEach((fn) => {
      try {
        fn(cursor);
      } catch (err) {
        // Degrade gracefully
      }
    });
  }

  public getCursor(): string {
    return this.currentCursor;
  }

  public subscribe(listener: (cursor: string) => void): () => void {
    if (typeof listener === 'function') {
      this.listeners.add(listener);
    }
    return () => this.listeners.delete(listener);
  }

  public reset(): void {
    this.setCursor('default');
  }
}
