'use client';

// COSTERA — Splash screen V2 : réception hôtelière, logo officiel centré,
// « L'EXCELLENCE SE TRANSMET. » · « FORMATION • HÔTELLERIE • RESTAURATION »,
// bouton « Passer l'intro → ». ≈ 4,3 s puis sortie automatique GARANTIE,
// une fois par session, désactivé si prefers-reduced-motion.
import { useCallback, useEffect, useRef, useState } from 'react';

const FLAG = 'costera_splash_done';

const PARTICLES = [
  { left: '18%', top: '30%', delay: '0.9s', size: 3 },
  { left: '26%', top: '62%', delay: '1.5s', size: 2 },
  { left: '72%', top: '26%', delay: '1.1s', size: 2 },
  { left: '80%', top: '58%', delay: '1.8s', size: 3 },
  { left: '60%', top: '74%', delay: '2.2s', size: 2 },
  { left: '38%', top: '20%', delay: '2.6s', size: 2 },
];

export function SplashScreen({ logoSrc }: { logoSrc: string }) {
  const [phase, setPhase] = useState<'hidden' | 'show' | 'leave' | 'done'>('hidden');
  const [logoFailed, setLogoFailed] = useState(false);
  const leaving = useRef(false);

  /** Déclenche la sortie (appelé par le timer auto ET par le bouton). */
  const leave = useCallback((fadeMs: number) => {
    if (leaving.current) return;
    leaving.current = true;
    setPhase('leave');
    window.setTimeout(() => {
      setPhase('done');
      try {
        sessionStorage.setItem(FLAG, '1');
      } catch {
        /* stockage indisponible */
      }
    }, fadeMs);
  }, []);

  useEffect(() => {
    // Une seule exécution au montage : les timers NE SONT PAS nettoyés
    // par les changements de phase (sinon la sortie auto saute).
    let seen = false;
    try {
      seen = sessionStorage.getItem(FLAG) === '1';
    } catch {
      /* ignore */
    }
    const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (seen || reduced) {
      setPhase('done');
      return;
    }
    setPhase('show');
    const auto = window.setTimeout(() => leave(450), 4300);
    return () => window.clearTimeout(auto); // uniquement au démontage réel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === 'done' || phase === 'hidden') return null;

  const src = logoFailed ? '/logo-costera.svg' : logoSrc;

  return (
    <div className={`splash2 ${phase === 'leave' ? 'splash2-leave' : ''}`} role="presentation">
      {/* Décor hôtelier */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/splash-hotel.jpg" alt="" className="splash2-bg" draggable={false} />
      {/* Voile violet très léger pour la lisibilité */}
      <div className="splash2-veil" aria-hidden="true" />

      {/* Particules dorées discrètes */}
      <div className="splash2-particles" aria-hidden="true">
        {PARTICLES.map((p, i) => (
          <span key={i} style={{ left: p.left, top: p.top, animationDelay: p.delay, width: p.size, height: p.size }} />
        ))}
      </div>

      {/* Composition centrale */}
      <div className="splash2-center">
        <div className="splash2-logo-wrap">
          <div className="splash2-halo" aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt="COSTERA"
            className="splash2-logo"
            draggable={false}
            onError={() => setLogoFailed(true)}
          />
          <div className="splash2-shimmer" aria-hidden="true" />
        </div>
        <h1 className="splash2-slogan">L’EXCELLENCE SE TRANSMET.</h1>
        <div className="splash2-line" aria-hidden="true" />
        <p className="splash2-sub">FORMATION • HÔTELLERIE • RESTAURATION</p>
      </div>

      {/* Passer l'intro */}
      <button type="button" className="splash2-skip" onClick={() => leave(380)}>
        Passer l’intro
        <span className="splash2-skip-arrow" aria-hidden="true">→</span>
      </button>
    </div>
  );
}
