import { forwardTransform } from './transformUtils';

export interface HandleInfo {
  name: string; // 'tl', 'tr', 'bl', 'br', 'tc', 'bc', 'lc', 'rc', 'rot', 'pivot'
  x: number; // in screen pixels (already scaled by zoom)
  y: number; // in screen pixels (already scaled by zoom)
  projectX: number; // in project space
  projectY: number; // in project space
}

/**
 * Returns a list of all handles with their coordinates in both project and screen space.
 */
export function getTransformHandles(
  bounds: { x: number; y: number; width: number; height: number },
  pivot: { x: number; y: number },
  translation: { x: number; y: number },
  scale: { x: number; y: number },
  rotation: number,
  zoom: number
): HandleInfo[] {
  const { x, y, width, height } = bounds;

  const keyPoints = [
    { name: 'tl', px: x, py: y },
    { name: 'tr', px: x + width, py: y },
    { name: 'bl', px: x, py: y + height },
    { name: 'br', px: x + width, py: y + height },
    { name: 'tc', px: x + width / 2, py: y },
    { name: 'bc', px: x + width / 2, py: y + height },
    { name: 'lc', px: x, py: y + height / 2 },
    { name: 'rc', px: x + width, py: y + height / 2 },
    { name: 'pivot', px: pivot.x, py: pivot.y },
    // Rotation handle is 2.5 project pixels above TC
    { name: 'rot', px: x + width / 2, py: y - 2.5 },
  ];

  return keyPoints.map(kp => {
    const pt = forwardTransform(kp.px, kp.py, pivot, scale, translation, rotation);
    return {
      name: kp.name,
      x: pt.x * zoom,
      y: pt.y * zoom,
      projectX: pt.x,
      projectY: pt.y,
    };
  });
}

/**
 * Renders the transformation bounding box, connection lines, handles, and pivot.
 */
export function drawTransformUI(
  ctx: CanvasRenderingContext2D,
  bounds: { x: number; y: number; width: number; height: number },
  pivot: { x: number; y: number },
  translation: { x: number; y: number },
  scale: { x: number; y: number },
  rotation: number,
  zoom: number,
  hoveredHandle: string | null
) {
  const handles = getTransformHandles(bounds, pivot, translation, scale, rotation, zoom);
  
  const tl = handles.find(h => h.name === 'tl')!;
  const tr = handles.find(h => h.name === 'tr')!;
  const br = handles.find(h => h.name === 'br')!;
  const bl = handles.find(h => h.name === 'bl')!;
  const tc = handles.find(h => h.name === 'tc')!;
  const rot = handles.find(h => h.name === 'rot')!;
  const piv = handles.find(h => h.name === 'pivot')!;

  ctx.save();

  // 1. Draw Bounding Box Outline
  ctx.strokeStyle = '#C8A96A'; // Brand Gold
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(tl.x, tl.y);
  ctx.lineTo(tr.x, tr.y);
  ctx.lineTo(br.x, br.y);
  ctx.lineTo(bl.x, bl.y);
  ctx.closePath();
  ctx.stroke();

  // 2. Draw Rotation Handle Connection Line
  ctx.strokeStyle = '#C8A96A';
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.moveTo(tc.x, tc.y);
  ctx.lineTo(rot.x, rot.y);
  ctx.stroke();
  ctx.setLineDash([]);

  // 3. Draw Handles (except pivot)
  const handleSize = 8;
  const halfSize = handleSize / 2;

  handles.forEach(h => {
    if (h.name === 'pivot') return;

    const isHovered = hoveredHandle === h.name;
    ctx.fillStyle = isHovered ? '#C8A96A' : '#ffffff';
    ctx.strokeStyle = '#0F3D34';
    ctx.lineWidth = 1.5;

    if (h.name === 'rot') {
      // Rotation handle is a circle
      ctx.beginPath();
      ctx.arc(h.x, h.y, handleSize / 2 + 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // Scale handles are squares
      ctx.fillRect(h.x - halfSize, h.y - halfSize, handleSize, handleSize);
      ctx.strokeRect(h.x - halfSize, h.y - halfSize, handleSize, handleSize);
    }
  });

  // 4. Draw Pivot Handle
  const isPivotHovered = hoveredHandle === 'pivot';
  ctx.strokeStyle = isPivotHovered ? '#f43f5e' : '#10b981'; // emerald-500 or rose-500
  ctx.lineWidth = 1.5;
  
  // Outer circle
  ctx.beginPath();
  ctx.arc(piv.x, piv.y, 5, 0, Math.PI * 2);
  ctx.stroke();

  // Crosshair lines
  ctx.beginPath();
  ctx.moveTo(piv.x - 8, piv.y);
  ctx.lineTo(piv.x + 8, piv.y);
  ctx.moveTo(piv.x, piv.y - 8);
  ctx.lineTo(piv.x, piv.y + 8);
  ctx.stroke();

  ctx.restore();
}
