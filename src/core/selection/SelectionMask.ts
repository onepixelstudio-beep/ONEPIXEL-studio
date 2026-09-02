export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ISelectionMask {
  readonly width: number;
  readonly height: number;
  
  /** Valor de selección entre 0 (no seleccionado) y 255 (totalmente seleccionado) */
  getValue(x: number, y: number): number;
  setValue(x: number, y: number, value: number): void;
  
  /** Indica si la máscara posee al menos un píxel con valor > 0 */
  isEmpty(): boolean;
  
  /** Bounding box mínima que envuelve todos los píxeles seleccionados (O(1) si está en caché) */
  getBounds(): BoundingBox | null;
  
  /** Obtiene copia del buffer crudo de 8-bits */
  getBuffer(): Uint8Array;

  /** Obtiene referencia directa al buffer de 8-bits (para operaciones internas sin alocación) */
  getRawBuffer(): Uint8Array;
  
  /** Clona la máscara completa */
  clone(): ISelectionMask;
  
  /** Copia el contenido de otra máscara sin instanciar un nuevo buffer */
  copyFrom(other: ISelectionMask): void;

  /** Limpia la máscara asignando 0 a todos los píxeles */
  clear(): void;

  /** Llena toda la máscara con el valor alpha especificado (0-255) */
  fill(value: number): void;

  /** Traslada espacialmente la máscara por un desplazamiento (dx, dy) sin asignaciones de memoria */
  translate(dx: number, dy: number): void;
}

export class SelectionMask implements ISelectionMask {
  public readonly width: number;
  public readonly height: number;
  private readonly buffer: Uint8Array;
  private cachedBounds: BoundingBox | null | undefined = undefined;
  private cachedIsEmpty: boolean | undefined = undefined;

  constructor(width: number, height: number, existingBuffer?: Uint8Array) {
    const safeW = Math.max(1, Math.floor(Number.isFinite(width) ? width : 1));
    const safeH = Math.max(1, Math.floor(Number.isFinite(height) ? height : 1));

    this.width = safeW;
    this.height = safeH;
    const size = this.width * this.height;

    if (existingBuffer) {
      if (existingBuffer.length !== size) {
        throw new Error(`Tamaño de buffer (${existingBuffer.length}) no coincide con dimensiones ${this.width}x${this.height}`);
      }
      this.buffer = new Uint8Array(existingBuffer);
    } else {
      this.buffer = new Uint8Array(size);
    }
  }

  public getValue(x: number, y: number): number {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return 0;
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix < 0 || ix >= this.width || iy < 0 || iy >= this.height) {
      return 0;
    }
    return this.buffer[iy * this.width + ix];
  }

  public setValue(x: number, y: number, value: number): void {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(value)) return;
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix < 0 || ix >= this.width || iy < 0 || iy >= this.height) {
      return;
    }
    const clampedValue = Math.max(0, Math.min(255, Math.floor(value)));
    const index = iy * this.width + ix;

    if (this.buffer[index] !== clampedValue) {
      this.buffer[index] = clampedValue;
      this.invalidateCache();
    }
  }

  public isEmpty(): boolean {
    if (this.cachedIsEmpty !== undefined) {
      return this.cachedIsEmpty;
    }

    for (let i = 0; i < this.buffer.length; i++) {
      if (this.buffer[i] > 0) {
        this.cachedIsEmpty = false;
        return false;
      }
    }

    this.cachedIsEmpty = true;
    this.cachedBounds = null;
    return true;
  }

  public getBounds(): BoundingBox | null {
    if (this.cachedBounds !== undefined) {
      return this.cachedBounds;
    }

    if (this.isEmpty()) {
      this.cachedBounds = null;
      return null;
    }

    let minX = this.width;
    let minY = this.height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < this.height; y++) {
      const rowOffset = y * this.width;
      for (let x = 0; x < this.width; x++) {
        if (this.buffer[rowOffset + x] > 0) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX < minX || maxY < minY) {
      this.cachedBounds = null;
      return null;
    }

    this.cachedBounds = {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    };

    return this.cachedBounds;
  }

  public getBuffer(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  public getRawBuffer(): Uint8Array {
    return this.buffer;
  }

  public clone(): ISelectionMask {
    const copy = new SelectionMask(this.width, this.height, this.buffer);
    copy.cachedBounds = this.cachedBounds ? { ...this.cachedBounds } : this.cachedBounds;
    copy.cachedIsEmpty = this.cachedIsEmpty;
    return copy;
  }

  public copyFrom(other: ISelectionMask): void {
    if (!other) return;
    if (other.width !== this.width || other.height !== this.height) {
      return;
    }
    const otherBuf = other.getRawBuffer ? other.getRawBuffer() : other.getBuffer();
    this.buffer.set(otherBuf);
    this.invalidateCache();
  }

  public clear(): void {
    this.buffer.fill(0);
    this.cachedBounds = null;
    this.cachedIsEmpty = true;
  }

  public fill(value: number): void {
    const safeVal = Number.isFinite(value) ? value : 0;
    const clampedValue = Math.max(0, Math.min(255, Math.floor(safeVal)));
    this.buffer.fill(clampedValue);
    this.invalidateCache();
  }

  private static tempBuffer: Uint8Array | null = null;

  public translate(dx: number, dy: number): void {
    const shiftX = Math.round(Number.isFinite(dx) ? dx : 0);
    const shiftY = Math.round(Number.isFinite(dy) ? dy : 0);
    if (shiftX === 0 && shiftY === 0) return;
    if (this.isEmpty()) return;

    const size = this.width * this.height;
    if (!SelectionMask.tempBuffer || SelectionMask.tempBuffer.length !== size) {
      SelectionMask.tempBuffer = new Uint8Array(size);
    } else {
      SelectionMask.tempBuffer.fill(0);
    }

    const temp = SelectionMask.tempBuffer;
    const w = this.width;
    const h = this.height;

    for (let y = 0; y < h; y++) {
      const ny = y + shiftY;
      if (ny < 0 || ny >= h) continue;
      const srcRow = y * w;
      const dstRow = ny * w;
      for (let x = 0; x < w; x++) {
        const val = this.buffer[srcRow + x];
        if (val > 0) {
          const nx = x + shiftX;
          if (nx >= 0 && nx < w) {
            temp[dstRow + nx] = val;
          }
        }
      }
    }

    this.buffer.set(temp);
    this.invalidateCache();
  }

  private invalidateCache(): void {
    this.cachedBounds = undefined;
    this.cachedIsEmpty = undefined;
  }
}
