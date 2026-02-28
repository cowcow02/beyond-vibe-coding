// app/components/CityTree.tsx
'use client';

interface Props {
  position: [number, number, number];
  scale?: number;
}

export function CityTree({ position, scale = 1 }: Props) {
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.1, 0.6, 6]} />
        <meshLambertMaterial color="#78350f" />
      </mesh>
      {/* Bottom canopy */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <coneGeometry args={[0.45, 0.7, 6]} />
        <meshLambertMaterial color="#16a34a" />
      </mesh>
      {/* Middle canopy */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <coneGeometry args={[0.32, 0.6, 6]} />
        <meshLambertMaterial color="#15803d" />
      </mesh>
      {/* Top canopy */}
      <mesh position={[0, 1.7, 0]} castShadow>
        <coneGeometry args={[0.18, 0.45, 6]} />
        <meshLambertMaterial color="#166534" />
      </mesh>
    </group>
  );
}
