// app/components/RoadGrid.tsx
'use client';

import { districts } from '../data/city';
import { tileToWorld, TILE_SIZE } from '../lib/cityLayout';

export function RoadGrid() {
  // Road stripe markings at district borders
  const markings: Array<{ x: number; z: number; w: number; d: number }> = [];

  // Collect unique row and col boundaries
  const rowBoundaries = new Set<number>();
  const colBoundaries = new Set<number>();
  districts.forEach(d => {
    rowBoundaries.add(d.originRow);
    rowBoundaries.add(d.originRow + d.rows);
    colBoundaries.add(d.originCol);
    colBoundaries.add(d.originCol + d.cols);
  });

  // Bounding box of all districts
  let minCol = Infinity, maxCol = -Infinity;
  let minRow = Infinity, maxRow = -Infinity;
  districts.forEach(d => {
    minCol = Math.min(minCol, d.originCol);
    maxCol = Math.max(maxCol, d.originCol + d.cols);
    minRow = Math.min(minRow, d.originRow);
    maxRow = Math.max(maxRow, d.originRow + d.rows);
  });

  const totalW = (maxCol - minCol) * TILE_SIZE;
  const totalD = (maxRow - minRow) * TILE_SIZE;
  const [startX] = tileToWorld(minCol, 0);
  const [, startZ] = tileToWorld(0, minRow);

  // Horizontal stripes (along Z boundaries)
  rowBoundaries.forEach(row => {
    const [, z] = tileToWorld(0, row);
    markings.push({ x: startX + totalW / 2, z, w: totalW + TILE_SIZE * 2, d: 0.12 });
  });

  // Vertical stripes (along X boundaries)
  colBoundaries.forEach(col => {
    const [x] = tileToWorld(col, 0);
    markings.push({ x, z: startZ + totalD / 2, w: 0.12, d: totalD + TILE_SIZE * 2 });
  });

  return (
    <group>
      {markings.map((m, i) => (
        <mesh key={i} position={[m.x, 0.01, m.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[m.w, m.d]} />
          <meshBasicMaterial color="#475569" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}
