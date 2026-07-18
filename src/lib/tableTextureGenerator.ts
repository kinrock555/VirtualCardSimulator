import { CanvasTexture, RepeatWrapping } from 'three';
import type { TableTheme } from '../config/tableThemes';

// Textures are drawn in neutral mid-gray so they can be multiplied by each
// theme's `tableColor` via meshStandardMaterial's `color` prop - the pattern
// (weave/felt/planks) is reused across themes, only the tint changes.
const textureCache = new Map<TableTheme['surfacePattern'], CanvasTexture>();

const BASE_GRAY = '#969696';
const LIGHT_GRAY = '#c2c2c2';
const DARK_GRAY = '#6e6e6e';

function createCanvas(size: number): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  return ctx;
}

function drawWeave(ctx: CanvasRenderingContext2D): void {
  const size = ctx.canvas.width;
  ctx.fillStyle = BASE_GRAY;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = LIGHT_GRAY;
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = size * 0.035;
  const step = size / 8;
  for (let offset = -size; offset < size * 2; offset += step) {
    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset + size, size);
    ctx.stroke();
  }
  ctx.strokeStyle = DARK_GRAY;
  for (let offset = -size + step / 2; offset < size * 2; offset += step) {
    ctx.beginPath();
    ctx.moveTo(offset, size);
    ctx.lineTo(offset + size, 0);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawFelt(ctx: CanvasRenderingContext2D): void {
  const size = ctx.canvas.width;
  ctx.fillStyle = BASE_GRAY;
  ctx.fillRect(0, 0, size, size);
  // Sparse fleck noise so it reads as soft felt rather than a flat fill.
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? LIGHT_GRAY : DARK_GRAY;
    ctx.globalAlpha = 0.15 + Math.random() * 0.2;
    ctx.fillRect(Math.random() * size, Math.random() * size, 1.3, 1.3);
  }
  ctx.globalAlpha = 1;
}

function drawPlanks(ctx: CanvasRenderingContext2D): void {
  const size = ctx.canvas.width;
  ctx.fillStyle = BASE_GRAY;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = DARK_GRAY;
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 2;
  const rows = 6;
  for (let i = 1; i < rows; i++) {
    const y = (size / rows) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.25;
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const length = size * 0.08 + Math.random() * size * 0.1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + length, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/** Procedurally draws a small tileable neutral-gray surface pattern - no external image assets. */
export function getTableSurfaceTexture(theme: TableTheme): CanvasTexture {
  const cached = textureCache.get(theme.surfacePattern);
  if (cached) return cached;

  const ctx = createCanvas(256);
  if (theme.surfacePattern === 'weave') drawWeave(ctx);
  else if (theme.surfacePattern === 'felt') drawFelt(ctx);
  else drawPlanks(ctx);

  const texture = new CanvasTexture(ctx.canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(4, 2.5);
  textureCache.set(theme.surfacePattern, texture);
  return texture;
}
