'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import type { Settings } from '@/lib/types';
import { updateSettingsAction } from '@/server/actions/settings';
import { ErrorNote, Field, SuccessNote } from '../ui';

export function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [orgName, setOrgName] = useState(settings.orgName);
  const [target, setTarget] = useState(String(settings.targetFoodCostPct));
  const [country, setCountry] = useState(settings.country);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    const res = await updateSettingsAction({ orgName, targetFoodCostPct: parseFloat(target), country });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? 'Enregistrement impossible.');
      return;
    }
    setSuccess('Paramètres enregistrés. L’objectif de food cost est appliqué à toute la plateforme.');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Nom de l’établissement">
        <input className="input" value={orgName} onChange={(e) => setOrgName(e.target.value)} required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Objectif food cost (%)" hint="Ratio matière maximal souhaité.">
          <input className="input" type="number" min="5" max="90" step="1" value={target} onChange={(e) => setTarget(e.target.value)} required />
        </Field>
        <Field label="Pays / marché">
          <input className="input" value={country} onChange={(e) => setCountry(e.target.value)} />
        </Field>
      </div>
      <Field label="Devise">
        <input className="input cursor-not-allowed bg-stone-100" value="Franc CFA (XOF)" disabled />
      </Field>
      <ErrorNote error={error} />
      {success ? <SuccessNote>{success}</SuccessNote> : null}
      <button type="submit" disabled={busy} className="btn-primary">
        <Save className="h-4 w-4" />
        {busy ? 'Enregistrement…' : 'Enregistrer les paramètres'}
      </button>
    </form>
  );
}
