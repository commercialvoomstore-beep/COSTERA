'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChefHat, Eye, EyeOff, Lock, Mail, User, UserRound } from 'lucide-react';
import { registerAction } from '@/server/actions/auth';
import { ErrorNote } from '../ui';

export function SignupForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [profile, setProfile] = useState<'utilisateur' | 'chef'>('utilisateur');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('La confirmation ne correspond pas au mot de passe.');
      return;
    }
    setBusy(true);
    try {
      const res = await registerAction({ firstName, lastName, email, profile, password });
      if (!res.ok) {
        setError(res.error ?? 'Inscription impossible.');
        setBusy(false);
        return;
      }
      router.push('/dashboard');
    } catch {
      setError('Le serveur n’a pas répondu correctement. Vérifiez votre connexion puis réessayez.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="su-first" className="auth-label">
            Prénom
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              id="su-first"
              className="auth-input pl-10"
              placeholder="Awa"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="su-last" className="auth-label">
            Nom
          </label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              id="su-last"
              className="auth-input pl-10"
              placeholder="Koné"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              required
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="su-email" className="auth-label">
          Adresse e-mail
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            id="su-email"
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
        <span className="auth-label">Votre profil</span>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Choix du profil">
          <button
            type="button"
            role="radio"
            aria-checked={profile === 'utilisateur'}
            onClick={() => setProfile('utilisateur')}
            className={`auth-toggle ${profile === 'utilisateur' ? 'auth-toggle-on' : ''}`}
          >
            <UserRound className="h-4 w-4" />
            Utilisateur
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={profile === 'chef'}
            onClick={() => setProfile('chef')}
            className={`auth-toggle ${profile === 'chef' ? 'auth-toggle-on' : ''}`}
          >
            <ChefHat className="h-4 w-4" />
            Chef de restaurant
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="su-pwd" className="auth-label">
          Mot de passe (8 caractères min.)
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            id="su-pwd"
            type={showPwd ? 'text' : 'password'}
            className="auth-input pl-10 pr-11"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-stone-400 transition-colors hover:text-royal-700"
          >
            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="su-confirm" className="auth-label">
          Confirmation du mot de passe
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            id="su-confirm"
            type={showPwd ? 'text' : 'password'}
            className="auth-input pl-10"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
      </div>

      <ErrorNote error={error} />
      <button type="submit" disabled={busy} className="auth-btn-gold w-full">
        {busy ? 'Création du compte…' : 'Créer mon compte'}
        {!busy && <ArrowRight className="h-4 w-4" />}
      </button>
      <p className="text-center text-[11px] leading-relaxed text-stone-400">
        En créant un compte, vous acceptez les conditions d’utilisation de COSTERA et la politique de
        confidentialité de VOOMNET FORMATION (Côte d’Ivoire).
      </p>
    </form>
  );
}
