'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { FeatureItem } from './feature-data';

type Props = {
  item: FeatureItem;
  index: number;
  /** Indice de la carte activée au toucher (écrans tactiles), sinon null. */
  touchActive: number | null;
  onTouchActivate: (index: number | null) => void;
};

/**
 * Carte « Fonctionnalités » avec effet de survol spectaculaire :
 * image révélée + voile violet, texte clair, élévation, ligne dorée,
 * lien « Découvrir », reflet, inclinaison 3D et lueur suivant le curseur.
 * Accessible : focus clavier = survol, tactile = 1er appui active,
 * prefers-reduced-motion = simple fondu.
 */
export function FeatureCard({ item, index, touchActive, onTouchActivate }: Props) {
  const cellRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const preloaded = useRef(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [fine, setFine] = useState(false); // souris précise (tilt + lueur)
  const [coarse, setCoarse] = useState(false); // écran tactile
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mqFine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const mqCoarse = window.matchMedia('(hover: none)');
    const mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    setFine(mqFine.matches);
    setCoarse(mqCoarse.matches);
    setReduced(mqReduced.matches);
    const sync = () => {
      setFine(mqFine.matches);
      setCoarse(mqCoarse.matches);
      setReduced(mqReduced.matches);
    };
    mqFine.addEventListener('change', sync);
    mqCoarse.addEventListener('change', sync);
    mqReduced.addEventListener('change', sync);
    return () => {
      mqFine.removeEventListener('change', sync);
      mqCoarse.removeEventListener('change', sync);
      mqReduced.removeEventListener('change', sync);
      cancelAnimationFrame(frame.current);
    };
  }, []);

  /** Précharge l'image au premier survol pour éviter tout clignotement. */
  const handleEnter = useCallback(() => {
    if (preloaded.current) return;
    preloaded.current = true;
    const img = new Image();
    img.src = `${item.image}.webp`;
  }, [item.image]);

  /** Inclinaison 3D (±6°) + lueur dorée qui suit le curseur (--x / --y). */
  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!fine || reduced) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const tilt = tiltRef.current;
        if (!tilt) return;
        const px = x / rect.width - 0.5;
        const py = y / rect.height - 0.5;
        tilt.style.setProperty('--x', `${x.toFixed(1)}px`);
        tilt.style.setProperty('--y', `${y.toFixed(1)}px`);
        tilt.style.setProperty('--rx', `${(-py * 12).toFixed(2)}deg`); // ±6° max
        tilt.style.setProperty('--ry', `${(px * 12).toFixed(2)}deg`); // ±6° max
      });
    },
    [fine, reduced],
  );

  const handleLeave = useCallback(() => {
    cancelAnimationFrame(frame.current);
    const tilt = tiltRef.current;
    if (!tilt) return;
    tilt.style.setProperty('--rx', '0deg');
    tilt.style.setProperty('--ry', '0deg');
  }, []);

  /**
   * Écrans tactiles : le 1er appui active l'effet (classe is-active),
   * le 2nd appui suit le lien.
   */
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!coarse) return;
      if (touchActive !== index) {
        e.preventDefault();
        onTouchActivate(index);
      }
    },
    [coarse, index, onTouchActivate, touchActive],
  );

  const isActive = touchActive === index;

  return (
    <div
      ref={cellRef}
      className={`fc-cell${isActive ? ' is-active' : ''}`}
    >
      <Link
        href={item.href}
        className="fc-link"
        onClick={handleClick}
        aria-label={`${item.title} — découvrir`}
      >
        <div className="fc-lift">
          <div
            ref={tiltRef}
            className="fc-tilt"
            onMouseEnter={handleEnter}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
          >
            {/* Image de fond (fond violet de secours tant qu'elle charge) */}
            <div className="fc-bg">
              <picture>
                <source srcSet={`${item.image}.webp`} type="image/webp" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${item.image}.jpg`}
                  alt={item.imageAlt}
                  loading="lazy"
                  decoding="async"
                  onLoad={() => setImgLoaded(true)}
                  className={`fc-img${imgLoaded ? ' is-loaded' : ''}`}
                />
              </picture>
              {/* Voile violet nuit pour la lisibilité du texte */}
              <div className="fc-veil" aria-hidden="true" />
            </div>

            {/* Lueur dorée circulaire qui suit le curseur (desktop) */}
            <div className="fc-glow" aria-hidden="true" />
            {/* Reflet lumineux diagonal (une fois par survol) */}
            <div className="fc-shine" aria-hidden="true" />
            {/* Fond « papier » : bandeau image permanent de 120 px sur tactile */}
            <div className="fc-paper" aria-hidden="true" />

            {/* Contenu */}
            <div className="fc-content">
              <span className="fc-icon">
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="fc-title">{item.title}</h3>
              <p className="fc-text">{item.text}</p>
              <span className="fc-line" aria-hidden="true" />
              <span className="fc-cta" aria-hidden="true">
                Découvrir
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
