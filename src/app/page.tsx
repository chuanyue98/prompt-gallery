import Navbar from '@/components/layout/Navbar';
import Gallery from '@/components/gallery/Gallery';

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden text-[var(--text-primary)]">
      <Navbar />
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.18]" style={{
        backgroundImage:
          'linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      <div className="relative z-10 pt-24">
        <Gallery />
      </div>
    </main>
  );
}
