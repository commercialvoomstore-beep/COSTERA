'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { ROLE_LABELS } from '@/lib/roles';
import type { Role } from '@/lib/types';
import { createUserAction } from '@/server/actions/users';
import { ErrorNote, Field, SuccessNote } from '../ui';

export function UserForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('chef');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    const res = await createUserAction({ name, email, role, password });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? 'Création impossible.');
      return;
    }
    setSuccess(`Compte créé pour ${name} (${ROLE_LABELS[role]}).`);
    setName('');
    setEmail('');
    setPassword('');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nom complet">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Aya N’Guessan" required />
        </Field>
        <Field label="Rôle">
          <select className="input" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="admin">{ROLE_LABELS.admin}</option>
            <option value="gestionnaire">{ROLE_LABELS.gestionnaire}</option>
            <option value="chef">{ROLE_LABELS.chef}</option>
          </select>
        </Field>
      </div>
      <Field label="Adresse e-mail">
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom@restaurant.ci" required />
      </Field>
      <Field label="Mot de passe" hint="6 caractères minimum.">
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
      </Field>
      <ErrorNote error={error} />
      {success ? <SuccessNote>{success}</SuccessNote> : null}
      <button type="submit" disabled={busy} className="btn-primary">
        <UserPlus className="h-4 w-4" />
        {busy ? 'Création…' : 'Créer le compte'}
      </button>
    </form>
  );
}
