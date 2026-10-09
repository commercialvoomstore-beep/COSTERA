'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { ROLE_LABELS } from '@/lib/roles';
import type { Role } from '@/lib/types';
import { loginAction } from '@/server/actions/auth';
import { ErrorNote } from '../ui';

export function LoginForm({ demoAccounts }: { demoAccounts: { name: string; email: string; role: Role }[] }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = await loginAction(email, password);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? 'Connexion impossible.');
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="space-y-4" noValidate={false}>
        <div>
          <label htmlFor="login-email" className="auth-label">
            Adresse e-mail
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              id="login-email"
              type="email"
              className="auth-input pl-10"
              placeholder="vous@restaurant.ci"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="login-password" className="auth-label">
            Mot de passe
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              id="login-password"
              type={showPwd ? 'text' : 'password'}
              className="auth-input pl-10 pr-11"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-stone-400 transition-colors hover:text-royal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-500"
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <ErrorNote error={error} />
        <button type="submit" disabled={busy} className="auth-btn-violet w-full">
          {busy ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      <div className="rounded-2xl border border-gold-200/70 bg-[#F5EFE3] p-4">
        <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
          Comptes de démonstration — mot de passe : COSTERA2026
        </p>
        <div className="grid gap-2">
          {demoAccounts.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => {
                setEmail(acc.email);
                setPassword('COSTERA2026');
                setError(null);
              }}
              className="group rounded-xl border border-stone-200/80 bg-white px-3.5 py-2.5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-400 hover:shadow-card"
            >
              <span className="block text-xs font-bold text-ink group-hover:text-royal-800">
                {ROLE_LABELS[acc.role]}
              </span>
              <span className="block truncate text-[11px] text-stone-500">{acc.email}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
