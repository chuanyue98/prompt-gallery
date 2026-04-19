import Navbar from '@/components/layout/Navbar';
import Gallery from '@/components/gallery/Gallery';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#030303] text-slate-200 selection:bg-blue-500/30 overflow-x-hidden relative">
      <Navbar />

      {/* Grid Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.15]" 
           style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* Atmosphere Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-900/20 blur-[150px] rounded-full animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-indigo-900/10 blur-[120px] rounded-full animate-pulse" style={{ animationDuration: '12s' }} />
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

      <div className="relative z-10 max-w-[1440px] mx-auto px-4 pt-28 pb-20 sm:px-6 lg:px-8">
        <Gallery />
      </div>

      <footer className="relative z-10 py-32 text-center mt-20 overflow-hidden px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <p className="text-slate-600 text-xs font-black uppercase tracking-[0.4em] mb-4">Unleash the Power of AI</p>
        <p className="text-slate-500 text-[10px] font-medium opacity-50">&copy; 2026 Prompt Gallery Project. All Rights Reserved.</p>
      </footer>
    </main>
  );
}
