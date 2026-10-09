'use client';

// COSTERA — Splash screen : signature visuelle courte (≈1,2 s), non bloquante,
// non rejouée à chaque navigation interne, respectueuse de prefers-reduced-motion.
import { useEffect, useState } from 'react';

const FLAG = 'costera_splash_done';

export function SplashScreen() {
  const [phase, setPhase] = useState<'hidden' | 'show' | 'leave' | 'done'>('hidden');

  useEffect(() => {
    if (phase !== 'hidden') return;
    let seen = false;
    try {
      seen = sessionStorage.getItem(FLAG) === '1';
    } catch {
      /* stockage indisponible : on affiche quand même une fois */
    }
    const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (seen || reduced) {
      setPhase('done');
      return;
    }
    setPhase('show');
    const t1 = window.setTimeout(() => setPhase('leave'), 1000);
    const t2 = window.setTimeout(() => {
      setPhase('done');
      try {
        sessionStorage.setItem(FLAG, '1');
      } catch {
        /* ignore */
      }
    }, 1380);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [phase]);

  if (phase === 'done' || phase === 'hidden') return null;

  return (
    <div className={`splash ${phase === 'leave' ? 'splash-leave' : ''}`} aria-hidden="true">
      <div className="flex flex-col items-center px-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-costera.svg" alt="" width={168} height={168} className="splash-logo select-none" draggable={false} />
        <div className="splash-line mt-5 h-px w-56 bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
        <p className="splash-tagline mt-4 font-display text-sm tracking-[0.42em] text-gold-300">
          GASTRONOMIE &amp; MAÎTRISE DES COÛTS
        </p>
      </div>
    </div>
  );
}
