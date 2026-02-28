// app/lib/isometric.ts

export const TILE_W = 64;  // width of one isometric tile
export const TILE_H = 32;  // height of one isometric tile
export const FLOOR_H = 24; // visual height of one building floor

export interface ScreenPos {
  x: number;
  y: number;
}

/** Convert world grid (col, row) → canvas screen (x, y) for the tile's top-left corner */
export function toScreen(col: number, row: number): ScreenPos {
  return {
    x: (col - row) * (TILE_W / 2),
    y: (col + row) * (TILE_H / 2),
  };
}

/** Draw a single isometric floor box at world position (col, row), at height floorIndex */
export function drawFloorBox(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  floorIndex: number,
  colorTop: string,
  colorLeft: string,
  colorRight: string,
  alpha = 1,
) {
  const { x, y } = toScreen(col, row);
  const yBase = y - floorIndex * FLOOR_H; // move up by floor height

  ctx.save();
  ctx.globalAlpha = alpha;

  // Top face (diamond)
  ctx.beginPath();
  ctx.moveTo(x,               yBase - TILE_H / 2);
  ctx.lineTo(x + TILE_W / 2, yBase);
  ctx.lineTo(x,               yBase + TILE_H / 2);
  ctx.lineTo(x - TILE_W / 2, yBase);
  ctx.closePath();
  ctx.fillStyle = colorTop;
  ctx.fill();

  // Left face
  ctx.beginPath();
  ctx.moveTo(x - TILE_W / 2, yBase);
  ctx.lineTo(x,               yBase + TILE_H / 2);
  ctx.lineTo(x,               yBase + TILE_H / 2 + FLOOR_H);
  ctx.lineTo(x - TILE_W / 2, yBase + FLOOR_H);
  ctx.closePath();
  ctx.fillStyle = colorLeft;
  ctx.fill();

  // Right face
  ctx.beginPath();
  ctx.moveTo(x + TILE_W / 2, yBase);
  ctx.lineTo(x,               yBase + TILE_H / 2);
  ctx.lineTo(x,               yBase + TILE_H / 2 + FLOOR_H);
  ctx.lineTo(x + TILE_W / 2, yBase + FLOOR_H);
  ctx.closePath();
  ctx.fillStyle = colorRight;
  ctx.fill();

  ctx.restore();
}

/** Draw a flat isometric tile (road, district ground) */
export function drawGroundTile(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  fillColor: string,
  strokeColor?: string,
) {
  const { x, y } = toScreen(col, row);

  ctx.beginPath();
  ctx.moveTo(x,               y - TILE_H / 2);
  ctx.lineTo(x + TILE_W / 2, y);
  ctx.lineTo(x,               y + TILE_H / 2);
  ctx.lineTo(x - TILE_W / 2, y);
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();

  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
}

/** Bounding box check: did a click at (px, py) land on tile (col, row)? */
export function hitTestTile(
  px: number, py: number,
  col: number, row: number,
  originX: number, originY: number,
): boolean {
  const { x, y } = toScreen(col, row);
  const tx = px - (originX + x);
  const ty = py - (originY + y);
  // isometric rhombus hit test
  return Math.abs(tx / (TILE_W / 2)) + Math.abs(ty / (TILE_H / 2)) <= 1;
}
