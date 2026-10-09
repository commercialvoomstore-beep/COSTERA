import Link from 'next/link';
import { Logo } from '@/components/ui';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-sand-50 px-4 text-center">
      <Logo />
      <p className="text-6xl font-black text-brand-600">404</p>
      <p className="max-w-sm text-stone-500">La page demandée n’existe pas ou a été déplacée.</p>
      <Link href="/" className="btn-primary">
        Retour à l’accueil
      </Link>
    </main>
  );
}
