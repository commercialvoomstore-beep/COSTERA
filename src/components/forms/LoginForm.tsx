'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail } from 'lucide-react';
import { ROLE_LABELS } from '@/lib/roles';
import type { Role } from '@/lib/types';
import { loginAction } from '@/server/actions/auth';
import { ErrorNote } from '../ui';

export function LoginForm({ demoAccounts }: { demoAccounts: { name: string; email: string; role: Role }[] }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
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
      <form onSubmit={submit} className="space-y-4">
        <div>
          <span className="label">Adresse e-mail</span>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="email"
              className="input pl-9"
              placeholder="vous@restaurant.ci"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
        </div>
        <div>
          <span className="label">Mot de passe</span>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="password"
              className="input pl-9"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
        </div>
        <ErrorNote error={error} />
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      <div className="rounded-xl bg-sand-100 p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">Comptes de démonstration — mot de passe : costera2026</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {demoAccounts.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => {
                setEmail(acc.email);
                setPassword('costera2026');
              }}
              className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-left transition hover:border-brand-400"
            >
              <span className="block text-xs font-bold text-ink">{ROLE_LABELS[acc.role]}</span>
              <span className="block truncate text-[11px] text-stone-500">{acc.email}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
