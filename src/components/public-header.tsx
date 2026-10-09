import Link from 'next/link';
import { Logo } from './logo';

/** En-tête des pages publiques : blanc, logo officiel, navigation claire. */
export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-linec bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" aria-label="COSTERA — accueil">
          <Logo size={46} />
        </Link>
        <nav className="hidden items-center gap-7 md:flex" aria-label="Navigation principale">
          <Link href="/" className="nav-link">Accueil</Link>
          <Link href="/decouvrir" className="nav-link font-semibold text-royal-700">Découvrir les menus</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost hidden sm:inline-flex">Se connecter</Link>
          <Link href="/login" className="btn-primary sm:hidden">Connexion</Link>
        </div>
      </div>
    </header>
  );
}
