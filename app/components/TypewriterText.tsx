'use client';

import { useState, useEffect, useRef } from 'react';

interface Props {
  text: string;
  charDelay?: number;
  onComplete?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export default function TypewriterText({
  text,
  charDelay = 38,
  onComplete,
  className,
  style,
}: Props) {
  const [count, setCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    setCount(0);

    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
    }

    if (text.length === 0) {
      onCompleteRef.current?.();
      return;
    }

    let current = 0;

    intervalRef.current = setInterval(() => {
      current += 1;
      setCount(current);

      if (current >= text.length) {
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        onCompleteRef.current?.();
      }
    }, charDelay);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [text, charDelay]);

  const isComplete = count >= text.length;
  const displayed = text.slice(0, count);

  return (
    <>
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .typewriter-cursor {
          animation: blink 0.7s step-end infinite;
          display: inline-block;
        }
      `}</style>
      <span className={className} style={style}>
        {displayed}
        {!isComplete && (
          <span className="typewriter-cursor" aria-hidden="true">_</span>
        )}
      </span>
    </>
  );
}
