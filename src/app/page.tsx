import Navbar from '@/components/layout/Navbar';
import Gallery from '@/components/gallery/Gallery';

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden text-[var(--text-primary)] selection:bg-[color-mix(in_srgb,var(--accent)_28%,transparent)]">
      <Navbar />

      {/* Grid Background */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.18]"
        style={{
          backgroundImage:
            'linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      >
      </div>

      {/* Atmosphere Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute top-[-20%] left-[-10%] h-[70%] w-[70%] rounded-full blur-[150px] animate-pulse"
          style={{ background: 'color-mix(in srgb, var(--accent) 16%, transparent)', animationDuration: '8s' }}
        />
        <div
          className="absolute bottom-[-10%] right-[-5%] h-[50%] w-[50%] rounded-full blur-[120px] animate-pulse"
          style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', animationDuration: '12s' }}
        />
      </div>

      {/* Noise Texture */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] contrast-150 brightness-150">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>

      <div className="relative z-20 mx-auto max-w-[1440px] px-4 pt-28 pb-20 sm:px-6 lg:px-8">
        <Gallery />
      </div>

      <footer className="relative z-10 mt-32 overflow-hidden px-6 py-24 text-center">
        <div className="absolute top-0 left-1/2 h-[1px] w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-[var(--border-soft)] to-transparent" />
        <div className="mx-auto max-w-xl space-y-6">
          <p className="font-heading text-[10px] font-black uppercase tracking-[0.5em] text-[var(--text-muted)] opacity-80">Unleash the Power of AI</p>
          <div className="h-px w-12 mx-auto bg-[var(--accent)] opacity-30" />
          <p className="font-heading text-[11px] font-black tracking-[0.2em] text-[var(--text-secondary)] opacity-70">
            &copy; 2026 PROMPT GALLERY PROJECT.<br/>
            ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>
    </main>
  );
}
