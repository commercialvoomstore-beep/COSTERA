'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp } from 'lucide-react';
import { todayISO } from '@/lib/format';
import { recordPriceAction } from '@/server/actions/ingredients';
import { ErrorNote, Field, SuccessNote } from '../ui';

export function PriceForm({ ingredientId, unitAbbr: unit }: { ingredientId: string; unitAbbr: string }) {
  const router = useRouter();
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    const res = await recordPriceAction(ingredientId, parseFloat(price), date, note);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? 'Enregistrement impossible.');
      return;
    }
    setSuccess('Nouveau prix enregistré. Le coût matière des recettes utilisant cet ingrédient est recalculé automatiquement.');
    setPrice('');
    setNote('');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label={`Nouveau prix (${unit})`}>
          <input className="input" type="number" min="1" step="1" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1600" required />
        </Field>
        <Field label="Date d’effet">
          <input className="input" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} required />
        </Field>
      </div>
      <Field label="Note (facultatif)">
        <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. hausse saisonnière, changement de fournisseur…" />
      </Field>
      <ErrorNote error={error} />
      {success ? <SuccessNote>{success}</SuccessNote> : null}
      <button type="submit" disabled={busy} className="btn-primary">
        <TrendingUp className="h-4 w-4" />
        {busy ? 'Enregistrement…' : 'Enregistrer le prix'}
      </button>
    </form>
  );
}
