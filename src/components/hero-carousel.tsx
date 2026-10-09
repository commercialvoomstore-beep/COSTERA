'use client';

// COSTERA — HeroCarousel : carrousel cinématographique de la colonne gauche
// (Connexion / Inscription). Fondu enchaîné PAR-DESSUS + zoom avant continu
// (scale 1 → 1.14 sur 7 s, dérive alternée 1-2 %), cycle 5 s, fondu 1.4 s,
// pause au survol et onglet masqué, prefers-reduced-motion respecté,
// <picture> WebP + srcset mobile, précharge décodée (image.decode()),
// indicateurs dont la pastille active se remplit en 5 s.
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BrandLogoClient } from './logo-client';

export interface HeroSlide {
  img: string;
  slogan: string;
  sub: string;
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    img: '/images/hero-1.jpg',
    slogan: 'L’excellence culinaire, pilotée au franc près.',
    sub: 'Le feu, le geste précis, les coûts maîtrisés.',
  },
  {
    img: '/images/hero-2.jpg',
    slogan: 'L’art de recevoir se transmet.',
    sub: 'Hôtellerie • Restauration • Excellence.',
  },
  {
    img: '/images/hero-3.jpg',
    slogan: 'Maîtrisez vos coûts, sublimez vos saveurs.',
    sub: 'Chaque sauce, chaque franc, au compte.',
  },
  {
    img: '/images/hero-4.jpg',
    slogan: 'Du marché d’Abidjan à l’assiette, chaque franc compte.',
    sub: 'Le service d’exception, cœur ivoirien.',
  },
  {
    img: '/images/hero-5.jpg',
    slogan: 'La cuisine ivoirienne mérite une gestion d’exception.',
    sub: 'Bar, salle, cuisine : pilotez tout.',
  },
  {
    img: '/images/hero-6.jpg',
    slogan: 'Des suites impeccables, des comptes impeccables.',
    sub: 'L’excellence hôtelière, au franc près.',
  },
];

const CYCLE_MS = 5000; // rythme du carrousel
const FADE_MS = 1400; // fondu enchaîné
const DECODE_GRACE_MS = 3000; // sursis si l'image suivante n'est pas décodée

const base = (img: string) => img.replace(/\.jpg$/, '');

export function HeroCarousel({ slides, logoSrc }: { slides: HeroSlide[]; logoSrc: string }) {
  const [active, setActive] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [hovered, setHovered] = useState(false);
  const [hiddenTab, setHiddenTab] = useState(false);

  const paused = hovered || hiddenTab;

  const activeRef = useRef(0);
  const accRef = useRef(0);
  const pausedRef = useRef(false);
  const barRef = useRef<HTMLSpanElement | null>(null);
  const decodedRef = useRef<Set<string>>(new Set());
  const leavingTimer = useRef<number | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  /* Précharge + décodage en arrière-plan ; la première en priorité haute. */
  useEffect(() => {
    slides.forEach((s, i) => {
      const img = new Image();
      if (i === 0) (img as unknown as { fetchPriority?: string }).fetchPriority = 'high';
      const done = () => decodedRef.current.add(s.img);
      img.src = s.img;
      if (typeof img.decode === 'function') {
        img.decode().then(done).catch(done);
      } else {
        img.onload = done;
        img.onerror = done;
      }
    });
  }, [slides]);

  /* Onglet masqué → pause. */
  useEffect(() => {
    const onVis = () => setHiddenTab(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const goTo = useCallback((i: number) => {
    const prev = activeRef.current;
    if (i === prev) return;
    activeRef.current = i;
    accRef.current = 0;
    setActive(i);
    setLeaving(prev);
    if (leavingTimer.current) window.clearTimeout(leavingTimer.current);
    leavingTimer.current = window.setTimeout(() => setLeaving(null), FADE_MS + 100);
  }, []);

  /* Minuteur rAF : barre de progression + cycle 5 s, pause au survol/onglet. */
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (!pausedRef.current) accRef.current += dt;
      if (barRef.current) {
        barRef.current.style.width = `${Math.min(100, (accRef.current / CYCLE_MS) * 100)}%`;
      }
      if (accRef.current >= CYCLE_MS) {
        const next = (activeRef.current + 1) % slides.length;
        const ready = decodedRef.current.has(slides[next].img);
        if (ready || accRef.current >= CYCLE_MS + DECODE_GRACE_MS) goTo(next);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [goTo, slides]);

  const slide = slides[active];

  return (
    <div
      className={`hero-carousel ${paused ? 'is-paused' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Images superposées : fondu par-dessus + zoom continu */}
      {slides.map((s, i) => {
        const isActive = i === active;
        const isLeaving = i === leaving;
        const kb = i % 2 === 0 ? 'kb-a' : 'kb-b';
        return (
          <div
            key={s.img}
            className={`hero-slide ${isActive ? 'hero-slide-active' : ''}`}
            aria-hidden={!isActive}
          >
            <picture>
              <source
                type="image/webp"
                srcSet={`${base(s.img)}-800.webp 800w, ${base(s.img)}.webp 1600w`}
                sizes="(max-width: 1023px) 100vw, 58vw"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.img}
                srcSet={`${base(s.img)}-800.jpg 800w, ${s.img} 1600w`}
                sizes="(max-width: 1023px) 100vw, 58vw"
                alt=""
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : 'auto'}
                draggable={false}
                className={isActive || isLeaving ? kb : ''}
              />
            </picture>
          </div>
        );
      })}

      {/* Voile violet + dégradé sombre bas */}
      <div className="hero-veil" aria-hidden="true" />

      {/* Haut : logo + retour au site */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-5 sm:p-7">
        <Link href="/" aria-label="COSTERA — retour à l’accueil">
          <BrandLogoClient src={logoSrc} fallback="/logo-costera.svg" size={46} onDark />
        </Link>
        <Link
          href="/"
          className="nav-link inline-flex items-center gap-1.5 rounded-full bg-royal-950/40 px-3.5 py-1.5 text-xs font-semibold text-ivory backdrop-blur-sm transition-colors hover:text-gold-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour au site
        </Link>
      </div>

      {/* Bas : slogan synchronisé + indicateurs */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-7">
        <div key={active} className="hero-copy">
          <span className="mb-3 block h-px w-8 bg-gold-400" aria-hidden="true" />
          <h2 className="font-display max-w-md text-xl font-semibold leading-snug text-white drop-shadow sm:text-2xl lg:text-[1.7rem]">
            {slide.slogan}
          </h2>
          <p className="mt-2.5 text-xs font-medium tracking-wide text-ivory/85">{slide.sub}</p>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2" role="tablist" aria-label="Images de présentation">
            {slides.map((s, i) =>
              i === active ? (
                <span key={s.img} className="hero-dot-track" role="tab" aria-selected="true" aria-label={`Image ${i + 1} (active)`}>
                  <span
                    className="hero-dot-fill"
                    ref={(el) => {
                      barRef.current = el;
                    }}
                  />
                </span>
              ) : (
                <button
                  key={s.img}
                  type="button"
                  role="tab"
                  aria-selected="false"
                  aria-label={`Afficher l’image ${i + 1}`}
                  onClick={() => goTo(i)}
                  className="hero-dot"
                />
              ),
            )}
          </div>
          <p className="hidden text-[10px] text-ivory/55 sm:block">
            © 2026 COSTERA — VOOMNET FORMATION · Côte d’Ivoire ·
          </p>
        </div>
      </div>
    </div>
  );
}
