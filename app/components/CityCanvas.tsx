// app/components/CityCanvas.tsx
'use client';

import CityScene from './CityScene';
import type { ComponentProps } from 'react';

export default function CityCanvas(props: ComponentProps<typeof CityScene>) {
  return <CityScene {...props} />;
}
