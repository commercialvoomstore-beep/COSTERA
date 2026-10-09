'use client';

// COSTERA — Parcours de souscription : Forfait → Paiement → Justificatif →
// Validation. Les montants, la création de la demande et l'envoi du
// justificatif passent par des actions serveur (règles côté serveur).
import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Landmark,
  Lock,
  Smartphone,
  UploadCloud,
  X,
} from 'lucide-react';
import { fcfa } from '@/lib/format';
import { PAYMENT_METHODS, PLAN_LABELS, type PaymentMethod, type PlanLevel } from '@/lib/plans';
import type { PaymentPeriod, PlanConfig } from '@/lib/types';
import { setPaymentMethodAction, startSubscriptionAction, submitProofAction } from '@/server/actions/plans';
import { useToast } from '@/components/toast';
import { PlanBadge } from '@/components/plan-ui';

const STEPS = ['Forfait', 'Paiement', 'Justificatif', 'Validation'] as const;

const METHOD_ICON: Record<PaymentMethod['kind'], typeof Smartphone> = {
  mobile: Smartphone,
  bancaire: Landmark,
  carte: CreditCard,
};

export function PaymentStepper({ cfg, plan: initialPlan, period: initialPeriod, resendRef }: {
  cfg: PlanConfig;
  plan: PlanLevel;
  period: PaymentPeriod;
  /** Si fourni : on renvoie un justificatif pour une demande existante (refusée). */
  resendRef?: string;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState(resendRef ? 2 : 0);
  const [plan, setPlan] = useState<PlanLevel>(initialPlan === 'free' ? 'silver' : initialPlan);
  const [period, setPeriod] = useState<PaymentPeriod>(initialPeriod);
  const [ref, setRef] = useState<string | null>(resendRef ?? null);
  const [methodId, setMethodId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Justificatif
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [txReference, setTxReference] = useState('');
  const [txNumber, setTxNumber] = useState('');
  const [drag, setDrag] = useState(false);

  const amountHt = plan === 'gold'
    ? (period === 'annuel' ? cfg.prices.gold.yearly : cfg.prices.gold.monthly)
    : (period === 'annuel' ? cfg.prices.silver.yearly : cfg.prices.silver.monthly);
  const tvaAmount = cfg.tvaEnabled ? Math.round((amountHt * cfg.tvaPct) / 100) : 0;
  const total = amountHt + tvaAmount;
  const method = methodId ? PAYMENT_METHODS.find((m) => m.id === methodId) : null;

  const acceptPdfImage = useMemo(() => '.jpg,.jpeg,.png,.pdf', []);

  async function confirmOrder() {
    setBusy(true);
    setError(null);
    const res = await startSubscriptionAction({ plan, period });
    setBusy(false);
    if (!res.ok || !res.ref) {
      setError(res.error ?? 'Impossible de créer la commande.');
      toast(res.error ?? 'Erreur lors de la création de la commande.', 'error');
      return;
    }
    setRef(res.ref);
    setStep(1);
  }

  async function confirmMethod() {
    if (!ref || !methodId) return;
    setBusy(true);
    await setPaymentMethodAction(ref, methodId);
    setBusy(false);
    setStep(2);
  }

  function pickFile(f: File | null) {
    if (!f) return;
    const okType = ['image/jpeg', 'image/png', 'application/pdf'].includes(f.type);
    if (!okType) {
      toast('Format non autorisé : JPG, PNG ou PDF uniquement.', 'error');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast('Fichier trop volumineux : 5 Mo maximum.', 'error');
      return;
    }
    setFile(f);
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f.type === 'application/pdf' ? null : URL.createObjectURL(f));
  }

  async function sendProof() {
    if (!ref) return;
    if (!file) {
      setError('Ajoutez un justificatif (capture, reçu ou PDF).');
      return;
    }
    if (!txReference.trim()) {
      setError('Indiquez la référence de transaction.');
      return;
    }
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set('ref', ref);
    fd.set('proof', file);
    fd.set('txReference', txReference);
    fd.set('txNumber', txNumber);
    const res = await submitProofAction(fd);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? 'Envoi impossible.');
      toast(res.error ?? 'Envoi du justificatif impossible.', 'error');
      return;
    }
    toast('Demande envoyée. Un administrateur va la valider.', 'success');
    setStep(3);
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Stepper */}
      <ol className="stepper mb-8 flex-wrap justify-center" aria-label="Étapes du paiement">
        {STEPS.map((label, i) => (
          <li key={label} className="step">
            <span className={`step ${i === step ? 'step-active' : i < step ? 'step-done' : ''}`.trim()}>
              <span className="step-dot" aria-hidden>{i < step ? '✓' : i + 1}</span>
              <span className={`hidden text-xs font-semibold sm:block ${i === step ? 'text-royal-800' : 'text-body/40'}`}>{label}</span>
            </span>
            {i < STEPS.length - 1 && <span className="step-line" aria-hidden />}
          </li>
        ))}
      </ol>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">{error}</div>
      )}

      {/* ÉTAPE 1 — Récapitulatif */}
      {step === 0 && (
        <div className="card p-6">
          <h2 className="font-display text-xl font-bold text-royal-900">Récapitulatif de commande</h2>
          <div className="mt-4 space-y-1">
            <label className="label">Forfait choisi</label>
            <div className="flex gap-2">
              {(['silver', 'gold'] as PlanLevel[]).map((p) => (
                <button key={p} type="button" onClick={() => setPlan(p)}
                  className={`flex-1 rounded-xl border px-4 py-3 text-left transition ${plan === p ? 'border-royal-600 bg-royal-50 ring-1 ring-royal-600' : 'border-linec bg-white hover:border-royal-300'}`}>
                  <PlanBadge plan={p} />
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <label className="label">Durée</label>
            <div className="flex gap-2">
              {(['mensuel', 'annuel'] as PaymentPeriod[]).map((p) => (
                <button key={p} type="button" onClick={() => setPeriod(p)}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold capitalize transition ${period === p ? 'border-royal-600 bg-royal-50 text-royal-800 ring-1 ring-royal-600' : 'border-linec bg-white text-body/60 hover:border-royal-300'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <dl className="mt-6 space-y-2 rounded-2xl bg-sand-50 p-5 text-sm">
            <div className="flex justify-between"><dt className="text-body/60">Forfait {PLAN_LABELS[plan]} ({period})</dt><dd className="font-semibold tabular-nums">{fcfa(amountHt)}</dd></div>
            {cfg.tvaEnabled && (
              <div className="flex justify-between"><dt className="text-body/60">TVA ({cfg.tvaPct} %)</dt><dd className="font-semibold tabular-nums">{fcfa(tvaAmount)}</dd></div>
            )}
            <div className="flex justify-between border-t border-linec pt-2 text-base"><dt className="font-bold text-body">Total</dt><dd className="font-display font-bold text-royal-800 tabular-nums">{fcfa(total)}</dd></div>
          </dl>

          <div className="mt-6 flex flex-wrap justify-between gap-3">
            <Link href="/forfaits" className="btn-ghost">Modifier le forfait</Link>
            <button type="button" onClick={confirmOrder} disabled={busy} className="btn-primary">
              {busy ? 'Création…' : 'Continuer vers le paiement'}
            </button>
          </div>
        </div>
      )}

      {/* ÉTAPE 2 — Moyen de paiement */}
      {step === 1 && (
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-royal-900">Choisissez votre moyen de paiement</h2>
            {ref && <span className="rounded-full bg-royal-50 px-3 py-1 text-xs font-bold text-royal-700">Réf. {ref}</span>}
          </div>
          <p className="mt-1 text-sm text-body/55">Montant à régler : <strong className="tabular-nums">{fcfa(total)}</strong>. Indiquez la référence <strong>{ref}</strong> lors du paiement.</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {PAYMENT_METHODS.map((m) => {
              const Icon = METHOD_ICON[m.kind];
              const disabled = m.id === 'carte';
              return (
                <button key={m.id} type="button" disabled={disabled} onClick={() => setMethodId(m.id)}
                  className={`rounded-2xl border p-4 text-left transition ${disabled ? 'cursor-not-allowed opacity-50' : methodId === m.id ? 'border-royal-600 bg-royal-50 ring-1 ring-royal-600' : 'border-linec bg-white hover:border-royal-300'}`}>
                  <span className="flex items-center gap-2 font-semibold text-body">
                    <Icon className="h-4 w-4 text-royal-600" aria-hidden /> {m.label}
                  </span>
                  {m.merchant && <span className="mt-1 block text-xs font-medium text-body/60 tabular-nums">{m.merchant}</span>}
                  <span className="mt-2 block text-xs leading-relaxed text-body/50">{m.instructions}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex justify-between gap-3">
            <button type="button" onClick={() => setStep(0)} className="btn-ghost">Retour</button>
            <button type="button" onClick={confirmMethod} disabled={!methodId || busy} className="btn-primary disabled:opacity-50">
              {busy ? 'Enregistrement…' : 'Continuer vers le justificatif'}
            </button>
          </div>
        </div>
      )}

      {/* ÉTAPE 3 — Justificatif */}
      {step === 2 && (
        <div className="card p-6">
          <h2 className="font-display text-xl font-bold text-royal-900">Envoyez votre justificatif</h2>
          {method && (
            <p className="mt-1 text-sm text-body/55">
              Moyen choisi : <strong>{method.label}</strong> · Montant exact : <strong className="tabular-nums">{fcfa(total)}</strong> · Référence : <strong>{ref}</strong>
            </p>
          )}

          <div
            className={`dropzone mt-5 ${drag ? 'is-drag' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); pickFile(e.dataTransfer.files?.[0] ?? null); }}
            onClick={() => fileInput.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInput.current?.click()}
            aria-label="Déposer ou choisir un justificatif"
          >
            <UploadCloud className="h-8 w-8 text-royal-400" aria-hidden />
            <p className="text-sm font-semibold text-body">Glissez-déposez votre justificatif ici</p>
            <p className="text-xs text-body/50">Capture d'écran, reçu ou PDF · JPG, PNG ou PDF · 5 Mo max</p>
            <input ref={fileInput} type="file" accept={acceptPdfImage} className="sr-only" onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />
          </div>

          {file && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-linec bg-sand-50 p-3">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Aperçu du justificatif" className="h-16 w-16 rounded-lg object-cover" />
              ) : (
                <span className="grid h-16 w-16 place-items-center rounded-lg bg-royal-50 text-royal-600"><FileText className="h-6 w-6" /></span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-body">{file.name}</p>
                <p className="text-xs text-body/50 tabular-nums">{(file.size / 1024 / 1024).toFixed(2)} Mo</p>
              </div>
              <button type="button" onClick={() => { setFile(null); setPreview(null); }} aria-label="Retirer le fichier" className="text-body/40 hover:text-red-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="txref" className="label">Référence de transaction *</label>
              <input id="txref" className="input" value={txReference} onChange={(e) => setTxReference(e.target.value)} placeholder="Ex. OM-2026-000123" />
            </div>
            <div className="space-y-1">
              <label htmlFor="txnum" className="label">Numéro utilisé</label>
              <input id="txnum" className="input" value={txNumber} onChange={(e) => setTxNumber(e.target.value)} placeholder="Ex. 07 00 00 00 00" />
            </div>
          </div>

          <div className="mt-6 flex justify-between gap-3">
            <button type="button" onClick={() => setStep(1)} className="btn-ghost">Retour</button>
            <button type="button" onClick={sendProof} disabled={busy || !file} className="btn-primary disabled:opacity-50">
              {busy ? 'Envoi…' : 'Envoyer la demande'}
            </button>
          </div>
        </div>
      )}

      {/* ÉTAPE 4 — Confirmation */}
      {step === 3 && (
        <div className="card p-8 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-50 text-amber-600">
            <Clock3 className="h-8 w-8" aria-hidden />
          </span>
          <h2 className="mt-4 font-display text-2xl font-bold text-royal-900">Demande envoyée</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-body/60">
            Votre demande est <strong>en attente de validation</strong> par un administrateur. Vous recevrez une notification et un e-mail dès qu'elle sera traitée.
          </p>
          <div className="mx-auto mt-5 w-fit rounded-2xl bg-sand-50 px-6 py-4">
            <p className="text-xs uppercase tracking-wide text-body/50">Référence de commande</p>
            <p className="font-display text-xl font-bold text-royal-800">{ref}</p>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/abonnement" className="btn-primary">Suivre mon abonnement</Link>
            <Link href="/dashboard" className="btn-ghost">Retour au tableau de bord</Link>
          </div>
        </div>
      )}
    </div>
  );
}
