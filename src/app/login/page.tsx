import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LoginForm } from '@/components/forms/LoginForm';
import { Logo } from '@/components/ui';
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
      {/* Panneau gauche : marque */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink p-10 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-brand-600/20 blur-3xl" />
        <Link href="/">
          <Logo dark />
        </Link>
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-brand-400">Food cost &amp; coût matière</p>
          <h1 className="mt-3 max-w-md text-3xl font-black leading-snug">
            Pilotez votre coût matière, du marché d’Adjamé à l’assiette.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-stone-400">
            Fiches techniques, suivi des prix d’achat, menus rentables : COSTERA transforme les données de votre cuisine en
            décisions de gestion concrètes.
          </p>
        </div>
        <p className="text-xs text-stone-500">© 2026 COSTERA — VOOMNET FORMATION · V1 · Côte d’Ivoire · FCFA</p>
      </div>

      {/* Panneau droit : formulaire */}
      <div className="flex items-center justify-center bg-sand-50 px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link href="/">
              <Logo />
            </Link>
          </div>
          <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-ink">
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour au site
          </Link>
          <div className="card p-6 sm:p-8">
            <h2 className="text-xl font-black text-ink">Connexion à COSTERA</h2>
            <p className="mb-6 mt-1 text-sm text-stone-500">Accédez à votre espace de gestion culinaire.</p>
            <LoginForm demoAccounts={demoAccounts} />
          </div>
        </div>
      </div>
    </main>
  );
}
