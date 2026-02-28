'use client';

import { useEffect, useRef } from 'react';

interface Props {
  onEnter: () => void;
}

export function SandboxSection({ onEnter }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    firedRef.current = false;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !firedRef.current) {
          firedRef.current = true;
          onEnter();
        }
        if (!entry.isIntersecting) {
          firedRef.current = false;
        }
      },
      { threshold: 0.6 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [onEnter]);

  return (
    <div
      ref={ref}
      style={{
        height: '100vh',
        scrollSnapAlign: 'start',
      }}
    />
  );
}
