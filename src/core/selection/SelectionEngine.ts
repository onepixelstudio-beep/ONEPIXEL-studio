import { BoundingBox, ISelectionMask, SelectionMask } from './SelectionMask';

export type SelectionMode = 'replace' | 'add' | 'subtract' | 'intersect';

export interface SelectionChangeEvent {
  type: 'change' | 'clear' | 'invert';
  bounds: BoundingBox | null;
  isEmpty: boolean;
  timestamp: number;
}

export type SelectionListener = (event: SelectionChangeEvent) => void;

export interface ISelectionEngine {
  readonly width: number;
  readonly height: number;
  readonly mask: ISelectionMask;

  /** Operaciones Básicas */
  clear(): void;
  selectAll(): void;
  invert(): void;

  /** Operaciones Booleanas entre Máscaras/Regiones */
  union(otherMask: ISelectionMask): void;
  subtract(otherMask: ISelectionMask): void;
  intersect(otherMask: ISelectionMask): void;
  
  /** Operaciones por Formas Geométricas */
  selectRect(x: number, y: number, w: number, h: number, mode?: SelectionMode): void;
  selectEllipse(cx: number, cy: number, rx: number, ry: number, mode?: SelectionMode): void;
  selectPath(points: Array<{ x: number; y: number }>, mode?: SelectionMode): void;

  /** Selección por rango / coincidencia cromática */
  selectColorRange(colorMatchFn: (x: number, y: number) => boolean, mode?: SelectionMode): void;

  /** Modificadores de Máscara (Expansión, Contracción, Suavizado/Feather) */
  expand(pixels: number): void;
  contract(pixels: number): void;
  feather(radius: number): void;

  /** Copia el estado desde otro motor o máscara sin asignaciones de memoria */
  copyFrom(other: ISelectionEngine | ISelectionMask): void;

  /** Traslada espacialmente la selección por (dx, dy) sin asignaciones de memoria */
  translate(dx: number, dy: number): void;

  /** Consultas Rápida O(1) */
  contains(x: number, y: number): boolean;
  getAlphaAt(x: number, y: number): number;
  getBounds(): BoundingBox | null;
  getStatistics(): { selectedPixels: number; coveragePercentage: number };

  /** Sistema de Suscripción Decoupled (Sin React) */
  subscribe(listener: SelectionListener): () => void;
  unsubscribe(listener: SelectionListener): void;
  
  /** Clona el estado actual del motor */
  clone(): ISelectionEngine;
}

export class SelectionEngine implements ISelectionEngine {
  public readonly width: number;
  public readonly height: number;
  public readonly mask: ISelectionMask;
  private tempMask: SelectionMask | null = null;
  private readonly listeners: Set<SelectionListener> = new Set();

  constructor(width: number, height: number, existingMask?: ISelectionMask) {
    const safeW = Math.max(1, Math.floor(Number.isFinite(width) ? width : 1));
    const safeH = Math.max(1, Math.floor(Number.isFinite(height) ? height : 1));
    this.width = safeW;
    this.height = safeH;
    this.mask = existingMask ? existingMask.clone() : new SelectionMask(this.width, this.height);
  }

  private getTempMask(): SelectionMask {
    if (!this.tempMask || this.tempMask.width !== this.width || this.tempMask.height !== this.height) {
      this.tempMask = new SelectionMask(this.width, this.height);
    } else {
      this.tempMask.clear();
    }
    return this.tempMask;
  }

  public subscribe(listener: SelectionListener): () => void {
    if (typeof listener === 'function') {
      this.listeners.add(listener);
    }
    return () => this.unsubscribe(listener);
  }

  public unsubscribe(listener: SelectionListener): void {
    this.listeners.delete(listener);
  }

  private notify(type: 'change' | 'clear' | 'invert'): void {
    const event: SelectionChangeEvent = {
      type,
      bounds: this.mask.getBounds(),
      isEmpty: this.mask.isEmpty(),
      timestamp: Date.now(),
    };
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('Error en listener de SelectionEngine:', err);
      }
    });
  }

  public clear(): void {
    this.mask.clear();
    this.notify('clear');
  }

  public selectAll(): void {
    this.mask.fill(255);
    this.notify('change');
  }

  public invert(): void {
    const buf = this.mask.getRawBuffer();
    const len = buf.length;
    for (let i = 0; i < len; i++) {
      buf[i] = 255 - buf[i];
    }
    (this.mask as SelectionMask)['invalidateCache']?.();
    this.notify('invert');
  }

  public union(otherMask: ISelectionMask): void {
    if (!otherMask) return;
    const buf1 = this.mask.getRawBuffer();
    const buf2 = otherMask.getRawBuffer ? otherMask.getRawBuffer() : otherMask.getBuffer();
    const len = Math.min(buf1.length, buf2.length);

    for (let i = 0; i < len; i++) {
      const v2 = buf2[i];
      if (v2 > 0) {
        if (v2 > buf1[i]) {
          buf1[i] = v2;
        }
      }
    }
    (this.mask as SelectionMask)['invalidateCache']?.();
    this.notify('change');
  }

  public subtract(otherMask: ISelectionMask): void {
    if (!otherMask) return;
    const buf1 = this.mask.getRawBuffer();
    const buf2 = otherMask.getRawBuffer ? otherMask.getRawBuffer() : otherMask.getBuffer();
    const len = Math.min(buf1.length, buf2.length);

    for (let i = 0; i < len; i++) {
      const v2 = buf2[i];
      if (v2 > 0) {
        const diff = buf1[i] - v2;
        buf1[i] = diff > 0 ? diff : 0;
      }
    }
    (this.mask as SelectionMask)['invalidateCache']?.();
    this.notify('change');
  }

  public intersect(otherMask: ISelectionMask): void {
    if (!otherMask) return;
    const buf1 = this.mask.getRawBuffer();
    const buf2 = otherMask.getRawBuffer ? otherMask.getRawBuffer() : otherMask.getBuffer();
    const minLen = Math.min(buf1.length, buf2.length);

    for (let i = 0; i < minLen; i++) {
      buf1[i] = Math.min(buf1[i], buf2[i]);
    }
    for (let i = minLen; i < buf1.length; i++) {
      buf1[i] = 0;
    }
    (this.mask as SelectionMask)['invalidateCache']?.();
    this.notify('change');
  }

  public selectRect(x: number, y: number, w: number, h: number, mode: SelectionMode = 'replace'): void {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h)) {
      if (mode === 'replace') this.clear();
      return;
    }

    const temp = this.getTempMask();
    const rx = Math.max(0, Math.floor(x));
    const ry = Math.max(0, Math.floor(y));
    const rw = Math.min(this.width - rx, Math.floor(w));
    const rh = Math.min(this.height - ry, Math.floor(h));

    if (rw > 0 && rh > 0) {
      const tempBuf = temp.getRawBuffer();
      for (let py = ry; py < ry + rh; py++) {
        const rowOffset = py * this.width;
        tempBuf.fill(255, rowOffset + rx, rowOffset + rx + rw);
      }
      temp['invalidateCache']?.();
    }

    this.applyMode(temp, mode);
  }

  public selectEllipse(cx: number, cy: number, rx: number, ry: number, mode: SelectionMode = 'replace'): void {
    if (!Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(rx) || !Number.isFinite(ry) || rx <= 0 || ry <= 0) {
      if (mode === 'replace') this.clear();
      return;
    }

    const temp = this.getTempMask();
    const minX = Math.max(0, Math.floor(cx - rx));
    const maxX = Math.min(this.width - 1, Math.ceil(cx + rx));
    const minY = Math.max(0, Math.floor(cy - ry));
    const maxY = Math.min(this.height - 1, Math.ceil(cy + ry));

    const tempBuf = temp.getRawBuffer();
    const invRxSq = 1 / (rx * rx);
    const invRySq = 1 / (ry * ry);

    for (let y = minY; y <= maxY; y++) {
      const dy = (y + 0.5 - cy);
      const dySqTerm = dy * dy * invRySq;
      if (dySqTerm > 1.0) continue;

      const rowOffset = y * this.width;
      for (let x = minX; x <= maxX; x++) {
        const dx = (x + 0.5 - cx);
        if (dx * dx * invRxSq + dySqTerm <= 1.0) {
          tempBuf[rowOffset + x] = 255;
        }
      }
    }
    temp['invalidateCache']?.();

    this.applyMode(temp, mode);
  }

  public selectPath(points: Array<{ x: number; y: number }>, mode: SelectionMode = 'replace'): void {
    if (!Array.isArray(points) || points.length < 3) {
      if (mode === 'replace') this.clear();
      return;
    }

    const validPoints = points.filter(p => p && Number.isFinite(p.x) && Number.isFinite(p.y));
    if (validPoints.length < 3) {
      if (mode === 'replace') this.clear();
      return;
    }

    const temp = this.getTempMask();
    let minX = this.width, maxX = 0, minY = this.height, maxY = 0;
    validPoints.forEach(p => {
      if (p.x < minX) minX = Math.floor(p.x);
      if (p.x > maxX) maxX = Math.ceil(p.x);
      if (p.y < minY) minY = Math.floor(p.y);
      if (p.y > maxY) maxY = Math.ceil(p.y);
    });

    minX = Math.max(0, minX);
    maxX = Math.min(this.width - 1, maxX);
    minY = Math.max(0, minY);
    maxY = Math.min(this.height - 1, maxY);

    const tempBuf = temp.getRawBuffer();
    for (let y = minY; y <= maxY; y++) {
      const rowOffset = y * this.width;
      for (let x = minX; x <= maxX; x++) {
        if (this.isPointInPolygon(x + 0.5, y + 0.5, validPoints)) {
          tempBuf[rowOffset + x] = 255;
        }
      }
    }
    temp['invalidateCache']?.();

    this.applyMode(temp, mode);
  }

  public selectColorRange(colorMatchFn: (x: number, y: number) => boolean, mode: SelectionMode = 'replace'): void {
    if (typeof colorMatchFn !== 'function') {
      if (mode === 'replace') this.clear();
      return;
    }

    const temp = this.getTempMask();
    const tempBuf = temp.getRawBuffer();

    for (let y = 0; y < this.height; y++) {
      const rowOffset = y * this.width;
      for (let x = 0; x < this.width; x++) {
        if (colorMatchFn(x, y)) {
          tempBuf[rowOffset + x] = 255;
        }
      }
    }
    temp['invalidateCache']?.();

    this.applyMode(temp, mode);
  }

  public expand(pixels: number): void {
    const px = Math.max(1, Math.floor(Number.isFinite(pixels) ? pixels : 1));
    if (this.mask.isEmpty()) return;

    const source = this.mask.getBuffer();
    const targetBuf = this.mask.getRawBuffer();

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (source[y * this.width + x] > 0) continue;
        let found = false;
        for (let dy = -px; dy <= px && !found; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= this.height) continue;
          for (let dx = -px; dx <= px && !found; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= this.width) continue;
            if (source[ny * this.width + nx] > 0) {
              found = true;
            }
          }
        }
        if (found) {
          targetBuf[y * this.width + x] = 255;
        }
      }
    }

    (this.mask as SelectionMask)['invalidateCache']?.();
    this.notify('change');
  }

  public contract(pixels: number): void {
    const px = Math.max(1, Math.floor(Number.isFinite(pixels) ? pixels : 1));
    if (this.mask.isEmpty()) return;

    const source = this.mask.getBuffer();
    const targetBuf = this.mask.getRawBuffer();

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (source[y * this.width + x] === 0) continue;
        let edge = false;
        for (let dy = -px; dy <= px && !edge; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= this.height) { edge = true; break; }
          for (let dx = -px; dx <= px && !edge; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= this.width) { edge = true; break; }
            if (source[ny * this.width + nx] === 0) {
              edge = true;
            }
          }
        }
        if (edge) {
          targetBuf[y * this.width + x] = 0;
        }
      }
    }

    (this.mask as SelectionMask)['invalidateCache']?.();
    this.notify('change');
  }

  public feather(radius: number): void {
    const r = Math.max(1, Math.floor(Number.isFinite(radius) ? radius : 1));
    if (this.mask.isEmpty()) return;

    const src = this.mask.getBuffer();
    const targetBuf = this.mask.getRawBuffer();

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let sum = 0;
        let count = 0;
        for (let dy = -r; dy <= r; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= this.height) continue;
          for (let dx = -r; dx <= r; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= this.width) continue;
            sum += src[ny * this.width + nx];
            count++;
          }
        }
        targetBuf[y * this.width + x] = Math.round(sum / count);
      }
    }

    (this.mask as SelectionMask)['invalidateCache']?.();
    this.notify('change');
  }

  public copyFrom(other: ISelectionEngine | ISelectionMask): void {
    if (!other) return;
    if ('mask' in other) {
      this.mask.copyFrom(other.mask);
    } else {
      this.mask.copyFrom(other);
    }
    this.notify('change');
  }

  public translate(dx: number, dy: number): void {
    this.mask.translate(dx, dy);
    this.notify('change');
  }

  private applyMode(otherMask: ISelectionMask, mode: SelectionMode): void {
    switch (mode) {
      case 'replace':
        this.mask.clear();
        this.union(otherMask);
        break;
      case 'add':
        this.union(otherMask);
        break;
      case 'subtract':
        this.subtract(otherMask);
        break;
      case 'intersect':
        this.intersect(otherMask);
        break;
      default:
        this.mask.clear();
        this.union(otherMask);
        break;
    }
  }

  private isPointInPolygon(x: number, y: number, polygon: Array<{ x: number; y: number }>): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  public contains(x: number, y: number): boolean {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
    return this.mask.getValue(x, y) > 0;
  }

  public getAlphaAt(x: number, y: number): number {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return 0;
    return this.mask.getValue(x, y);
  }

  public getBounds(): BoundingBox | null {
    return this.mask.getBounds();
  }

  public getStatistics(): { selectedPixels: number; coveragePercentage: number } {
    let count = 0;
    const buf = this.mask.getRawBuffer();
    const total = buf.length;
    for (let i = 0; i < total; i++) {
      if (buf[i] > 0) count++;
    }
    return {
      selectedPixels: count,
      coveragePercentage: total > 0 ? (count / total) * 100 : 0,
    };
  }

  public clone(): ISelectionEngine {
    return new SelectionEngine(this.width, this.height, this.mask);
  }
}
