import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LoginForm } from '@/components/forms/LoginForm';
import { Logo } from '@/components/logo';
import { getSessionUserId } from '@/lib/auth';
import { getDB } from '@/server/db';

export const metadata: Metadata = { title: 'Connexion' };

export default async function LoginPage() {
  const userId = await getSessionUserId();
  if (userId && getDB().users.some((u) => u.id === userId)) redirect('/dashboard');

  const demoAccounts = getDB()
    .users.map((u) => ({ name: u.name, email: u.email, role: u.role }))
    .sort((a, b) => (a.role === 'admin' ? -1 : b.role === 'admin' ? 1 : 0));

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Panneau gauche : identité royale */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-b from-royal-950 via-royal-900 to-royal-950 p-10 text-white lg:flex">
        <div className="pointer-events-none absolute -right-28 top-1/4 h-96 w-96 rounded-full bg-royal-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-10 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl" />
        <Link href="/" aria-label="Retour à l’accueil">
          <Logo size={52} onDark />
        </Link>
        <div className="relative flex flex-col items-center text-center">
          <Logo size={190} />
          <div className="mt-6 h-px w-52 bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
          <p className="mt-5 font-display text-sm tracking-[0.4em] text-gold-300">GASTRONOMIE &amp; MAÎTRISE DES COÛTS</p>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-royal-100/70">
            Fiches techniques, suivi des prix d’achat, menus rentables : COSTERA transforme les données
            de votre cuisine en décisions de gestion concrètes.
          </p>
        </div>
        <p className="relative text-xs text-royal-100/45">© 2026 COSTERA — VOOMNET FORMATION · V1 · Côte d’Ivoire · FCFA</p>
      </div>

      {/* Panneau droit : formulaire */}
      <div className="flex items-center justify-center bg-ivory px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link href="/" aria-label="Retour à l’accueil">
              <Logo size={52} />
            </Link>
          </div>
          <Link href="/" className="nav-link mb-6 inline-flex items-center gap-1.5 text-xs font-semibold">
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour au site
          </Link>
          <div className="card border-gold-500/25 p-6 shadow-pop sm:p-8">
            <h2 className="font-display text-xl font-bold text-royal-900">Connexion à COSTERA</h2>
            <p className="mb-6 mt-1 text-sm text-body/55">Accédez à votre espace de gestion culinaire.</p>
            <LoginForm demoAccounts={demoAccounts} />
          </div>
        </div>
      </div>
    </main>
  );
}
