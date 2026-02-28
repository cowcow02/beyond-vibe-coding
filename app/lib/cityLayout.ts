// app/lib/cityLayout.ts
export const TILE_SIZE = 2;
export const FLOOR_HEIGHT = 0.8;

export function tileToWorld(col: number, row: number): [number, number] {
  return [col * TILE_SIZE, row * TILE_SIZE];
}

export function districtCenter(
  originCol: number, originRow: number,
  cols: number, rows: number
): [number, number] {
  const [x0, z0] = tileToWorld(originCol, originRow);
  return [
    x0 + (cols * TILE_SIZE) / 2,
    z0 + (rows * TILE_SIZE) / 2,
  ];
}
