import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AuthShowcase } from '@/components/auth-showcase';
import { SignupForm } from '@/components/forms/SignupForm';
import { Logo, officialLogoDisplaySrc } from '@/components/logo';
import { getSessionUserId } from '@/lib/auth';
import { getDB } from '@/server/db';

export const metadata: Metadata = { title: 'Inscription' };

export default async function SignupPage() {
  const userId = await getSessionUserId();
  if (userId && getDB().users.some((u) => u.id === userId)) redirect('/dashboard');

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
          <h1 className="font-display text-center text-2xl font-semibold text-[#1A1A2E]">S’inscrire</h1>
          <p className="mb-7 mt-1.5 text-center text-sm text-stone-500">
            Rejoignez COSTERA et pilotez votre cuisine au franc près.
          </p>
          <SignupForm />
          <p className="mt-6 text-center text-sm text-stone-500">
            Déjà inscrit ?{' '}
            <Link href="/login" className="font-semibold text-royal-700 underline-offset-4 transition-colors hover:text-gold-700 hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
