'use client';

// COSTERA — Paramètres ADMIN des forfaits : prix, quotas, tailles vidéo, TVA.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import type { PlanConfig } from '@/lib/types';
import { resolvePlanConfig } from '@/lib/plans';
import { updatePlanConfigAction } from '@/server/actions/settings';
import type { Settings } from '@/lib/types';
import { ErrorNote, Field, SuccessNote } from '../ui';

export function PlanSettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const cfg = resolvePlanConfig(settings);

  const [silverMonthly, setSilverMonthly] = useState(String(cfg.prices.silver.monthly));
  const [silverYearly, setSilverYearly] = useState(String(cfg.prices.silver.yearly));
  const [goldMonthly, setGoldMonthly] = useState(String(cfg.prices.gold.monthly));
  const [goldYearly, setGoldYearly] = useState(String(cfg.prices.gold.yearly));
  const [quotaFree, setQuotaFree] = useState(String(cfg.quotas.free));
  const [quotaSilver, setQuotaSilver] = useState(String(cfg.quotas.silver));
  const [quotaGold, setQuotaGold] = useState(String(cfg.quotas.gold));
  const [vidFree, setVidFree] = useState(String(cfg.videoMaxMb.free));
  const [vidSilver, setVidSilver] = useState(String(cfg.videoMaxMb.silver));
  const [vidGold, setVidGold] = useState(String(cfg.videoMaxMb.gold));
  const [tvaPct, setTvaPct] = useState(String(cfg.tvaPct));
  const [tvaEnabled, setTvaEnabled] = useState(cfg.tvaEnabled);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const n = (s: string) => Number(s);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    const res = await updatePlanConfigAction({
      prices: {
        silver: { monthly: n(silverMonthly), yearly: n(silverYearly) },
        gold: { monthly: n(goldMonthly), yearly: n(goldYearly) },
      },
      quotas: { free: n(quotaFree), silver: n(quotaSilver), gold: n(quotaGold) },
      videoMaxMb: { free: n(vidFree), silver: n(vidSilver), gold: n(vidGold) },
      tvaPct: n(tvaPct),
      tvaEnabled,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? 'Enregistrement impossible.');
      return;
    }
    setSuccess('Configuration des forfaits enregistrée.');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">Prix (FCFA)</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="SILVER / mois"><input type="number" min="0" step="100" className="input tabular-nums" value={silverMonthly} onChange={(e) => setSilverMonthly(e.target.value)} /></Field>
          <Field label="SILVER / an"><input type="number" min="0" step="100" className="input tabular-nums" value={silverYearly} onChange={(e) => setSilverYearly(e.target.value)} /></Field>
          <Field label="GOLD / mois"><input type="number" min="0" step="100" className="input tabular-nums" value={goldMonthly} onChange={(e) => setGoldMonthly(e.target.value)} /></Field>
          <Field label="GOLD / an"><input type="number" min="0" step="100" className="input tabular-nums" value={goldYearly} onChange={(e) => setGoldYearly(e.target.value)} /></Field>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">Quota de menus par forfait</p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="FREE"><input type="number" min="0" className="input tabular-nums" value={quotaFree} onChange={(e) => setQuotaFree(e.target.value)} /></Field>
          <Field label="SILVER"><input type="number" min="0" className="input tabular-nums" value={quotaSilver} onChange={(e) => setQuotaSilver(e.target.value)} /></Field>
          <Field label="GOLD" hint="-1 = illimité"><input type="number" min="-1" className="input tabular-nums" value={quotaGold} onChange={(e) => setQuotaGold(e.target.value)} /></Field>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">Taille vidéo max (Mo) · 0 = lien externe uniquement</p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="FREE"><input type="number" min="0" className="input tabular-nums" value={vidFree} onChange={(e) => setVidFree(e.target.value)} /></Field>
          <Field label="SILVER"><input type="number" min="0" className="input tabular-nums" value={vidSilver} onChange={(e) => setVidSilver(e.target.value)} /></Field>
          <Field label="GOLD"><input type="number" min="0" className="input tabular-nums" value={vidGold} onChange={(e) => setVidGold(e.target.value)} /></Field>
        </div>
      </div>

      <div className="grid grid-cols-2 items-end gap-3">
        <Field label="TVA (%)"><input type="number" min="0" max="50" step="0.5" className="input tabular-nums" value={tvaPct} onChange={(e) => setTvaPct(e.target.value)} /></Field>
        <label className="flex items-center gap-2 pb-2 text-sm font-medium text-body">
          <input type="checkbox" checked={tvaEnabled} onChange={(e) => setTvaEnabled(e.target.checked)} className="h-4 w-4 accent-royal-600" />
          Appliquer la TVA aux abonnements
        </label>
      </div>

      <ErrorNote error={error} />
      {success ? <SuccessNote>{success}</SuccessNote> : null}
      <button type="submit" disabled={busy} className="btn-primary">
        <Save className="h-4 w-4" />
        {busy ? 'Enregistrement…' : 'Enregistrer la configuration'}
      </button>
    </form>
  );
}
