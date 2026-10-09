import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AuthShowcase } from '@/components/auth-showcase';
import { LoginForm } from '@/components/forms/LoginForm';
import { Logo, officialLogoDisplaySrc } from '@/components/logo';
import { getSessionUserId } from '@/lib/auth';
import { getDB } from '@/server/db';

export const metadata: Metadata = { title: 'Connexion' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const userId = await getSessionUserId();
  if (userId && getDB().users.some((u) => u.id === userId)) redirect('/dashboard');

  // Erreur renvoyée par le repli sans JS (/api/auth/login) : affichée au
  // rendu serveur, donc visible même si JavaScript est indisponible.
  const params = await searchParams;
  const initialError =
    params.erreur === 'identifiants'
      ? 'Identifiants incorrects. Vérifiez votre e-mail et votre mot de passe.'
      : null;

  const demoAccounts = getDB()
    .users.map((u) => ({ name: u.name, email: u.email, role: u.role }))
    .sort((a, b) => (a.role === 'admin' ? -1 : b.role === 'admin' ? 1 : 0));

  return (
    <main className="min-h-screen bg-[#FAF8F5] lg:grid lg:grid-cols-[58fr_42fr]">
      <AuthShowcase logoSrc={officialLogoDisplaySrc()} />

      {/* Colonne formulaire */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="auth-card auth-swap w-full max-w-[440px]">
          <div className="mb-5 flex justify-center">
            <span className="auth-medallion">
              <Logo size={54} />
            </span>
          </div>
          <h1 className="font-display text-center text-2xl font-semibold text-[#1A1A2E]">
            Connexion à COSTERA
          </h1>
          <p className="mb-7 mt-1.5 text-center text-sm text-stone-500">
            Accédez à votre espace de gestion culinaire.
          </p>
          <LoginForm demoAccounts={demoAccounts} initialError={initialError} />
          <p className="mt-6 text-center text-sm text-stone-500">
            Pas encore de compte ?{' '}
            <Link href="/signup" className="font-semibold text-royal-700 underline-offset-4 transition-colors hover:text-gold-700 hover:underline">
              S’inscrire
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
