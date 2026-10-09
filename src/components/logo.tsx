import { existsSync } from 'fs';
import path from 'path';
import { BrandLogoClient } from './logo-client';

/**
 * Logo officiel COSTERA.
 * Priorité absolue au fichier officiel déposé dans /public/logo-costera.png
 * (transparence réelle requise). À défaut, la vectorisation fidèle
 * /public/logo-costera.svg (fond transparent) est utilisée.
 */
export function officialLogoSrc(): 'png' | 'svg' {
  try {
    return existsSync(path.join(process.cwd(), 'public', 'logo-costera.png')) ? 'png' : 'svg';
  } catch {
    return 'svg';
  }
}

/**
 * Source d'AFFICHAGE du logo : dérivé transparent (détourage technique,
 * fichier séparé, l'original officiel n'est JAMAIS modifié) > PNG officiel >
 * vectorisation SVG de secours.
 */
export function officialLogoDisplaySrc(): string {
  const pub = (f: string) => path.join(process.cwd(), 'public', f);
  try {
    if (existsSync(pub('logo-costera-transparent.png'))) return '/logo-costera-transparent.png';
    if (existsSync(pub('logo-costera.png'))) return '/logo-costera.png';
  } catch {
    /* ignore */
  }
  return '/logo-costera.svg';
}

export function Logo({ size = 44, withWordmark = false, onDark = false, className = '' }: { size?: number; withWordmark?: boolean; onDark?: boolean; className?: string }) {
  return (
    <BrandLogoClient
      src={officialLogoDisplaySrc()}
      fallback="/logo-costera.svg"
      size={size}
      withWordmark={withWordmark}
      onDark={onDark}
      className={className}
    />
  );
}
