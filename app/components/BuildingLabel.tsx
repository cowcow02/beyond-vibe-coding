// app/components/BuildingLabel.tsx
'use client';

import { Text } from '@react-three/drei';

interface Props {
  name: string;
  position: [number, number, number];
  accentColor: string;
}

export function BuildingLabel({ name, position, accentColor }: Props) {
  return (
    <Text
      position={position}
      font="/fonts/SpaceMono-Regular.woff2"
      fontSize={0.22}
      color="#e2e8f0"
      anchorX="center"
      anchorY="bottom"
      outlineWidth={0.03}
      outlineColor="#0f172a"
      renderOrder={1}
      depthOffset={-1}
    >
      {name}
    </Text>
  );
}
