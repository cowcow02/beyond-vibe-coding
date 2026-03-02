'use client';

import { useEffect, useRef } from 'react';

interface Props {
  children?: React.ReactNode;
  onEnter?: () => void;
  sectionIndex: number;
}

export function StorySection({ children, onEnter, sectionIndex }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reset fired state when section changes
    firedRef.current = false;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !firedRef.current) {
          firedRef.current = true;
          onEnter?.();
        }
        // Reset so it can fire again when re-entering
        if (!entry.isIntersecting) {
          firedRef.current = false;
        }
      },
      { threshold: 0.6 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [onEnter, sectionIndex]);

  return (
    <div
      ref={ref}
      data-section-index={sectionIndex}
      style={{
        height: '100vh',
        scrollSnapAlign: 'start',
        position: 'relative',
        background: 'transparent',
      }}
    >
      {children}
    </div>
  );
}
