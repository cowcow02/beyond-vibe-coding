'use client';

export function HeroSection() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(2,6,23,0.75)',
      }}
    >
      <style>{`
        @keyframes hero-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .hero-scroll-prompt {
          animation: hero-pulse 2s ease-in-out infinite;
        }
      `}</style>

      {/* Main heading */}
      <h1
        style={{
          fontFamily: 'monospace',
          fontSize: 'clamp(2.25rem, 5vw, 3.75rem)',
          fontWeight: 700,
          color: '#ffffff',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          margin: 0,
          textAlign: 'center',
        }}
      >
        BEYOND VIBE CODING
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontFamily: 'monospace',
          fontSize: '1.25rem',
          color: 'rgba(148,163,184,0.8)',
          fontStyle: 'italic',
          marginTop: '1rem',
          marginBottom: 0,
          textAlign: 'center',
        }}
      >
        How far does it go?
      </p>

      {/* Scroll prompt */}
      <div
        className="hero-scroll-prompt"
        style={{
          position: 'absolute',
          bottom: '2rem',
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          color: 'rgba(148,163,184,0.5)',
        }}
      >
        scroll to begin ↓
      </div>
    </div>
  );
}
