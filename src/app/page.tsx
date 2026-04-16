import Gallery from '@/components/gallery/Gallery';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#030303] text-slate-200 selection:bg-blue-500/30 overflow-x-hidden relative">
      {/* 1. Background Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.15]" 
           style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* 2. Atmosphere Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-900/20 blur-[150px] rounded-full animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-indigo-900/10 blur-[120px] rounded-full animate-pulse" style={{ animationDuration: '12s' }} />
      </div>

      {/* 3. Texture Noise */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] contrast-150 brightness-150">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>

      <header className="relative z-10 pt-28 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 text-[10px] font-black tracking-[0.3em] text-blue-400 uppercase bg-blue-500/5 border border-blue-500/20 rounded-full backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Intelligence x Visuals
        </div>
        
        <h1 className="text-7xl md:text-8xl font-black mb-8 tracking-[-0.04em] leading-none">
          <span className="text-white">Prompt</span>
          <span className="relative inline-block ml-4">
            <span className="absolute -inset-1 bg-blue-500 blur-2xl opacity-20"></span>
            <span className="relative bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Gallery</span>
          </span>
        </h1>
        
        <p className="text-slate-500 max-w-2xl mx-auto text-lg font-medium leading-relaxed px-6 tracking-tight text-center">
          一个专注于 AIGC 提示词美学与工程的灵感库。<br/>
          <span className="text-slate-400">在这里，每一行文字都能幻化为惊艳的镜头。</span>
        </p>
      </header>

      <div className="relative z-10 max-w-[1400px] mx-auto">
        <Gallery />
      </div>

      <footer className="relative z-10 py-32 text-center mt-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <p className="text-slate-600 text-xs font-black uppercase tracking-[0.4em] mb-4 text-center">Unleash the Power of AI</p>
        <p className="text-slate-500 text-[10px] font-medium opacity-50 text-center">&copy; 2026 Prompt Gallery Project. All Rights Reserved.</p>
      </footer>
    </main>
  );
}
