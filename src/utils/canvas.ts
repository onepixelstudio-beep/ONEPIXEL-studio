import { SymmetrySettings } from '../types';
import { matchColorsWithTolerance } from './colorUtils';
import { AssetTransformationService } from './resources/AssetTransformationService';

export function createEmptyPixels(width: number, height: number): string[] {
  return Array(width * height).fill('');
}

// Bresenham's Line Algorithm
export function getLinePoints(x0: number, y0: number, x1: number, y1: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let x = x0;
  let y = y0;

  while (true) {
    points.push({ x, y });
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
  return points;
}

// Rectangle outline or filled
export function getRectanglePoints(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  fill: boolean
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);

  if (fill) {
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        points.push({ x, y });
      }
    }
  } else {
    // Top and bottom borders
    for (let x = minX; x <= maxX; x++) {
      points.push({ x, y: minY });
      points.push({ x, y: maxY });
    }
    // Left and right borders
    for (let y = minY + 1; y < maxY; y++) {
      points.push({ x: minX, y });
      points.push({ x: maxX, y });
    }
  }
  return points;
}

// Ellipse outline or filled (Bresenham-like midpoint ellipse drawing)
export function getEllipsePoints(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  fill: boolean
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);

  const rx = Math.floor((maxX - minX) / 2);
  const ry = Math.floor((maxY - minY) / 2);
  const xc = minX + rx;
  const yc = minY + ry;

  if (rx <= 0 || ry <= 0) {
    // Fall back to line or rect
    return getRectanglePoints(x0, y0, x1, y1, fill);
  }

  if (fill) {
    for (let y = minY; y <= maxY; y++) {
      const dy = y - yc;
      // Solve for dx: (dx/rx)^2 + (dy/ry)^2 <= 1  => dx = rx * sqrt(1 - (dy/ry)^2)
      const ratio = dy / ry;
      const term = 1 - ratio * ratio;
      if (term >= 0) {
        const dxLimit = Math.round(rx * Math.sqrt(term));
        for (let x = xc - dxLimit; x <= xc + dxLimit; x++) {
          points.push({ x, y });
        }
      }
    }
  } else {
    // Border points
    let x = 0;
    let y = ry;

    // Region 1
    let d1 = ry * ry - rx * rx * ry + 0.25 * rx * rx;
    let dx = 2 * ry * ry * x;
    let dy = 2 * rx * rx * y;

    const addSymmetric = (cx: number, cy: number, px: number, py: number) => {
      points.push({ x: cx + px, y: cy + py });
      points.push({ x: cx - px, y: cy + py });
      points.push({ x: cx + px, y: cy - py });
      points.push({ x: cx - px, y: cy - py });
    };

    while (dx < dy) {
      addSymmetric(xc, yc, x, y);
      if (d1 < 0) {
        x++;
        dx = dx + 2 * ry * ry;
        d1 = d1 + dx + ry * ry;
      } else {
        x++;
        y--;
        dx = dx + 2 * ry * ry;
        dy = dy - 2 * rx * rx;
        d1 = d1 + dx - dy + ry * ry;
      }
    }

    // Region 2
    let d2 =
      ry * ry * ((x + 0.5) * (x + 0.5)) +
      rx * rx * ((y - 1) * (y - 1)) -
      rx * rx * ry * ry;

    while (y >= 0) {
      addSymmetric(xc, yc, x, y);
      if (d2 > 0) {
        y--;
        dy = dy - 2 * rx * rx;
        d2 = d2 - dy + rx * rx;
      } else {
        y--;
        x++;
        dx = dx + 2 * ry * ry;
        dy = dy - 2 * rx * rx;
        d2 = d2 + dx - dy + rx * rx;
      }
    }
  }

  // Filter out bounds
  return points.filter((p) => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY);
}

// Flood Fill (Bucket Tool) using BFS
export function floodFill(
  pixels: string[],
  startX: number,
  startY: number,
  width: number,
  height: number,
  fillColor: string
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const targetColor = pixels[startY * width + startX];

  if (targetColor === fillColor) return [];

  const visited = new Set<string>();
  const queue: [number, number][] = [[startX, startY]];
  visited.add(`${startX},${startY}`);

  while (queue.length > 0) {
    const [cx, cy] = queue.shift()!;
    points.push({ x: cx, y: cy });

    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const key = `${nx},${ny}`;
        if (!visited.has(key)) {
          const color = pixels[ny * width + nx];
          if (color === targetColor) {
            visited.add(key);
            queue.push([nx, ny]);
          }
        }
      }
    }
  }
  return points;
}

export function getBucketFillPoints(
  pixels: string[],
  startX: number,
  startY: number,
  width: number,
  height: number,
  fillColor: string,
  settings: {
    contiguous: boolean;
    tiling: boolean;
    symmetry: SymmetrySettings;
    mask?: boolean[];
    tolerance?: number;
  }
): { x: number; y: number }[] {
  // Get all symmetric start points
  const symStarts = getSymmetricPoints(startX, startY, width, height, settings.symmetry);
  
  // Unique start points within bounds (or wrapped if tiling is active)
  const uniqueStarts: { x: number; y: number }[] = [];
  const startSeen = new Uint8Array(width * height);
  
  for (const p of symStarts) {
    let sx = p.x;
    let sy = p.y;
    if (settings.tiling) {
      sx = ((sx % width) + width) % width;
      sy = ((sy % height) + height) % height;
    } else if (sx < 0 || sx >= width || sy < 0 || sy >= height) {
      continue;
    }
    
    const idx = sy * width + sx;
    if (startSeen[idx] === 0) {
      startSeen[idx] = 1;
      uniqueStarts.push({ x: sx, y: sy });
    }
  }

  const resultPoints: { x: number; y: number }[] = [];
  const globalVisited = new Uint8Array(width * height);

  for (const start of uniqueStarts) {
    const startIdx = start.y * width + start.x;
    if (globalVisited[startIdx] === 1) continue;

    const targetColor = pixels[startIdx];
    if (targetColor === fillColor) continue;

    if (settings.mask && !settings.mask[startIdx]) continue;

    if (!settings.contiguous) {
      // Non-contiguous (Global replacement)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          if (globalVisited[idx] === 1) continue;
          if (settings.mask && !settings.mask[idx]) continue;
          if (matchColorsWithTolerance(pixels[idx], targetColor, settings.tolerance ?? 0)) {
            globalVisited[idx] = 1;
            resultPoints.push({ x, y });
          }
        }
      }
    } else {
      // Contiguous BFS with queue
      const queueX = new Int32Array(width * height);
      const queueY = new Int32Array(width * height);
      let head = 0;
      let tail = 0;

      queueX[tail] = start.x;
      queueY[tail] = start.y;
      tail++;
      globalVisited[startIdx] = 1;

      while (head < tail) {
        const cx = queueX[head];
        const cy = queueY[head];
        head++;

        resultPoints.push({ x: cx, y: cy });

        const neighbors = [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1],
        ];

        for (let [nx, ny] of neighbors) {
          if (settings.tiling) {
            nx = ((nx % width) + width) % width;
            ny = ((ny % height) + height) % height;
          } else if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
            continue;
          }

          const nIdx = ny * width + nx;
          if (globalVisited[nIdx] === 0) {
            if (settings.mask && !settings.mask[nIdx]) continue;
            
            const color = pixels[nIdx];
            if (matchColorsWithTolerance(color, targetColor, settings.tolerance ?? 0)) {
              globalVisited[nIdx] = 1;
              queueX[tail] = nx;
              queueY[tail] = ny;
              tail++;
            }
          }
        }
      }
    }
  }

  return resultPoints;
}

// Smart Selection (Magic Wand)
export function getMagicWandSelection(
  pixels: string[],
  startX: number,
  startY: number,
  width: number,
  height: number,
  tolerance: number = 0,
  contiguous: boolean = true
): boolean[] {
  const selection = Array(width * height).fill(false);
  const targetColor = pixels[startY * width + startX];

  if (!contiguous) {
    // Non-contiguous (Global matching)
    for (let i = 0; i < pixels.length; i++) {
      if (matchColorsWithTolerance(pixels[i], targetColor, tolerance)) {
        selection[i] = true;
      }
    }
    return selection;
  }

  const visited = new Set<string>();
  const queue: [number, number][] = [[startX, startY]];
  visited.add(`${startX},${startY}`);

  while (queue.length > 0) {
    const [cx, cy] = queue.shift()!;
    selection[cy * width + cx] = true;

    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const key = `${nx},${ny}`;
        if (!visited.has(key)) {
          const color = pixels[ny * width + nx];
          if (matchColorsWithTolerance(color, targetColor, tolerance)) {
            visited.add(key);
            queue.push([nx, ny]);
          }
        }
      }
    }
  }
  return selection;
}

// Calculate all symmetric points based on active settings
export function getSymmetricPoints(
  x: number,
  y: number,
  width: number,
  height: number,
  settings: SymmetrySettings
): { x: number; y: number }[] {
  const points = [{ x, y }];

  if (!settings.x && !settings.y && !settings.radial) {
    return points;
  }

  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);

  // X Symmetry (mirror vertically over canvas vertical center line)
  if (settings.x) {
    const mx = width - 1 - x;
    points.push({ x: mx, y });
  }

  // Y Symmetry (mirror horizontally over canvas horizontal center line)
  if (settings.y) {
    const my = height - 1 - y;
    points.push({ x, y: my });
  }

  // Double mirror (X + Y combined, which is also radial 4)
  if (settings.x && settings.y) {
    const mx = width - 1 - x;
    const my = height - 1 - y;
    points.push({ x: mx, y: my });
  }

  // Radial Symmetry (4-way / 8-way around center)
  if (settings.radial) {
    // 4 points (perfect rotational symmetry around fractional center)
    points.push({ x: width - 1 - y, y: x }); // 90 deg clockwise
    points.push({ x: width - 1 - x, y: height - 1 - y }); // 180 deg
    points.push({ x: y, y: height - 1 - x }); // 270 deg clockwise (90 deg counter-clockwise)

    if (settings.radialCount === 8) {
      // Add reflectional symmetries to form full 8-way octagonal symmetry (Dihedral group D4)
      points.push({ x: width - 1 - x, y: y }); // Horizontal reflection
      points.push({ x: x, y: height - 1 - y }); // Vertical reflection
      points.push({ x: y, y: x }); // Diagonal reflection
      points.push({ x: width - 1 - y, y: height - 1 - x }); // Anti-diagonal reflection
    }
  }

  // Clean duplicate coordinates and out of bounds
  const uniquePoints: { x: number; y: number }[] = [];
  const seen = new Set<string>();

  for (const p of points) {
    if (p.x >= 0 && p.x < width && p.y >= 0 && p.y < height) {
      const key = `${p.x},${p.y}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniquePoints.push(p);
      }
    }
  }

  return uniquePoints;
}

export function isPointInPolygon(x: number, y: number, points: { x: number; y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x, yi = points[i].y;
    const xj = points[j].x, yj = points[j].y;
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function getRotatedStamp(
  pixels: string[],
  width: number,
  height: number,
  rotation: number
): { pixels: string[]; width: number; height: number } {
  const normRotation = ((rotation % 360) + 360) % 360;
  const angle = normRotation === 90 ? 90 : normRotation === 180 ? 180 : normRotation === 270 ? 270 : 0;
  return AssetTransformationService.transform(pixels, width, height, angle, false, false);
}

export function transformStamp(
  pixels: string[],
  width: number,
  height: number,
  rotation: number,
  flipH: boolean,
  flipV: boolean
): { pixels: string[]; width: number; height: number } {
  const normRotation = ((rotation % 360) + 360) % 360;
  const angle = normRotation === 90 ? 90 : normRotation === 180 ? 180 : normRotation === 270 ? 270 : 0;
  return AssetTransformationService.transform(pixels, width, height, angle, flipH, flipV);
}

/**
 * Filters a continuous list of pixel coordinates drawn in a single stroke
 * to remove corner-sharing "jaggies", producing a "pixel-perfect" 1px line.
 */
export function filterPixelPerfect(points: { x: number; y: number }[]): { x: number; y: number }[] {
  if (points.length < 3) return points;
  const result: { x: number; y: number }[] = [points[0]];
  
  for (let i = 1; i < points.length; i++) {
    result.push(points[i]);
    
    // While we have at least 3 points, check if the middle one is a redundant corner
    while (result.length >= 3) {
      const len = result.length;
      const A = result[len - 3];
      const B = result[len - 2];
      const C = result[len - 1];
      
      // If A and C are diagonal or orthogonal neighbors (max difference <= 1), B is a redundant corner
      if (Math.abs(A.x - C.x) <= 1 && Math.abs(A.y - C.y) <= 1) {
        result.splice(len - 2, 1);
      } else {
        break;
      }
    }
  }
  return result;
}

/**
 * Calculates local 2D coordinate offsets for different brush sizes/shapes
 */
export function calculateBrushOffsets(brushSize: number, activeBrush: any): { dx: number; dy: number }[] {
  const offsets: { dx: number; dy: number }[] = [];
  if (activeBrush && activeBrush.pixels) {
    const activeSize = activeBrush.size;
    const scale = brushSize; 
    const totalSize = activeSize * scale;
    const halfSize = Math.floor(totalSize / 2);

    for (let r = 0; r < activeSize; r++) {
      for (let c = 0; c < activeSize; c++) {
        if (activeBrush.pixels[r] && activeBrush.pixels[r][c]) {
          const startX = -halfSize + (c * scale);
          const startY = -halfSize + (r * scale);
          for (let dy = 0; dy < scale; dy++) {
            for (let dx = 0; dx < scale; dx++) {
              offsets.push({ dx: startX + dx, dy: startY + dy });
            }
          }
        }
      }
    }
  } else {
    const halfSize = Math.floor(brushSize / 2);
    for (let dy = 0; dy < brushSize; dy++) {
      for (let dx = 0; dx < brushSize; dx++) {
        offsets.push({ dx: -halfSize + dx, dy: -halfSize + dy });
      }
    }
  }
  return offsets;
}

