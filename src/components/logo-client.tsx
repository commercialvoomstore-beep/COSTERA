'use client';

import { useState } from 'react';

/**
 * Affiche le logo officiel COSTERA (PNG déposé > vectorisation SVG de secours).
 * En cas d'erreur de chargement du PNG, bascule proprement sur le SVG
 * (jamais de cadre blanc : les deux fichiers ont une transparence réelle).
 */
export function BrandLogoClient({ kind, size, withWordmark, onDark, className }: { kind: 'png' | 'svg'; size: number; withWordmark?: boolean; onDark?: boolean; className?: string }) {
  const [failed, setFailed] = useState(false);
  const src = kind === 'png' && !failed ? '/logo-costera.png' : '/logo-costera.svg';

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
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
