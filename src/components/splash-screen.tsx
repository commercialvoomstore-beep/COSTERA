'use client';

// COSTERA — Splash screen V3 INBLOQUABLE.
// Le markup est rendu CÔTÉ SERVEUR : même sans aucun JavaScript, le cycle de
// vie complet (apparition → tenue → disparition) est piloté par le CSS pur
// (s2-kill : invisible + non bloquant après 7 s). JavaScript ne fait que
// raffiner : sortie à 4,3 s, bouton/clic « Passer l'intro », une fois par
// session, désactivé si prefers-reduced-motion.
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
  // gone = démontage côté client (retour de session, reduced-motion, timers).
  // Par défaut false : le markup EST présent dans le HTML servi (SSR).
  const [gone, setGone] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const leavingRef = useRef(false);

  const remember = () => {
    try {
      sessionStorage.setItem(FLAG, '1');
    } catch {
      /* stockage indisponible */
    }
  };

  const leave = useCallback((fadeMs: number) => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    window.setTimeout(() => {
      setGone(true);
      remember();
    }, fadeMs);
  }, []);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(FLAG) === '1';
    } catch {
      /* ignore */
    }
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (seen || reduced) {
      setGone(true); // retour de session : aucun splash
      return;
    }
    const auto = window.setTimeout(() => leave(450), 4400);
    const hard = window.setTimeout(() => {
      setGone(true);
      remember();
    }, 6500);
    return () => {
      window.clearTimeout(auto);
      window.clearTimeout(hard);
    };
  }, [leave]);

  if (gone) return null;

  const src = logoFailed ? '/logo-costera.svg' : logoSrc;

  return (
    <div
      className={`splash2 ${leaving ? 'splash2-leave' : ''}`}
      role="presentation"
      onClick={() => leave(300)}
      title="Cliquer pour passer l'intro"
    >
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
