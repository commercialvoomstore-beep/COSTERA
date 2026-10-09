'use client';

import { useState } from 'react';

/**
 * Affiche le logo officiel COSTERA (dérivé transparent du PNG officiel >
 * PNG officiel > vectorisation SVG de secours). En cas d'erreur de
 * chargement, bascule proprement sur le SVG (jamais de cadre blanc).
 */
export function BrandLogoClient({ src, fallback, size, withWordmark, onDark, className }: { src: string; fallback: string; size: number; withWordmark?: boolean; onDark?: boolean; className?: string }) {
  const [failed, setFailed] = useState(false);
  const finalSrc = failed ? fallback : src;

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={finalSrc}
        alt="COSTERA"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="shrink-0 select-none drop-shadow-sm"
        onError={() => setFailed(true)}
        draggable={false}
      />
      {withWordmark ? (
        <span className={`font-display text-xl font-bold tracking-wide ${onDark ? 'text-ivory' : 'text-royal-800'}`}>
          COSTERA
        </span>
      ) : null}
    </span>
  );
}
