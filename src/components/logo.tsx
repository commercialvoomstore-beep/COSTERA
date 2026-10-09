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

export function Logo({ size = 44, withWordmark = false, onDark = false, className = '' }: { size?: number; withWordmark?: boolean; onDark?: boolean; className?: string }) {
  const kind = officialLogoSrc();
  return (
    <BrandLogoClient kind={kind} size={size} withWordmark={withWordmark} onDark={onDark} className={className} />
  );
}
