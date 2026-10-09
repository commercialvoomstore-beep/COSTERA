'use client';

// COSTERA — Tableau de bord ADMIN « Demandes d'abonnement » : liste filtrable,
// visionneuse de justificatif, validation et refus (motif obligatoire).
import { useMemo, useState } from 'react';
import { CheckCircle2, Eye, FileText, XCircle } from 'lucide-react';
import { fcfa, fmtDate } from '@/lib/format';
import type { PaymentStatus, PlanLevel } from '@/lib/types';
import { refuseRequestAction, validateRequestAction } from '@/server/actions/plans';
import { PlanBadge } from '@/components/plan-ui';
import { useToast } from '@/components/toast';
import { EmptyState } from '@/components/ui';

export interface RequestRow {
  id: string;
  ref: string;
  userName: string;
  userEmail: string;
  plan: PlanLevel;
  period: string;
  amountTotal: number;
  status: PaymentStatus;
  createdAt: string;
  submittedAt?: string;
  decidedAt?: string;
  decidedByName?: string;
  refuseReason?: string;
  proofFileId?: string;
  proofFileName?: string;
  txReference?: string;
  audit: { action: string; at: string; byName?: string; note?: string }[];
}

const FILTERS: { id: PaymentStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'en_attente', label: 'En attente' },
  { id: 'validee', label: 'Validées' },
  { id: 'refusee', label: 'Refusées' },
];

export function RequestsAdmin({ requests }: { requests: RequestRow[] }) {
  const { toast } = useToast();
  const [filter, setFilter] = useState<PaymentStatus | 'all'>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refuseFor, setRefuseFor] = useState<RequestRow | null>(null);
  const [reason, setReason] = useState('');
  const [viewProof, setViewProof] = useState<RequestRow | null>(null);
  const [showAudit, setShowAudit] = useState<string | null>(null);

  const rows = useMemo(
    () => requests.filter((r) => filter === 'all' || r.status === filter),
    [requests, filter],
  );

  async function validate(r: RequestRow) {
    setBusyId(r.id);
    const res = await validateRequestAction(r.id);
    setBusyId(null);
    if (res.ok) toast(`Demande ${r.ref} validée. Le forfait ${r.plan.toUpperCase()} est activé.`, 'success');
    else toast(res.error ?? 'Validation impossible.', 'error');
  }

  async function confirmRefuse() {
    if (!refuseFor) return;
    if (!reason.trim()) {
      toast('Le motif de refus est obligatoire.', 'error');
      return;
    }
    setBusyId(refuseFor.id);
    const res = await refuseRequestAction(refuseFor.id, reason);
    setBusyId(null);
    if (res.ok) {
      toast(`Demande ${refuseFor.ref} refusée.`, 'info');
      setRefuseFor(null);
      setReason('');
    } else {
      toast(res.error ?? 'Refus impossible.', 'error');
    }
  }

  const statusBadge: Record<PaymentStatus, string> = {
    en_attente: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    validee: 'bg-forest-50 text-forest-700 ring-forest-600/20',
    refusee: 'bg-red-50 text-red-700 ring-red-600/20',
    expiree: 'bg-sand-100 text-body/60 ring-body/10',
  };
  const statusLabel: Record<PaymentStatus, string> = {
    en_attente: 'En attente',
    validee: 'Validée',
    refusee: 'Refusée',
    expiree: 'Expirée',
  };

  return (
    <div>
      {/* Filtres */}
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = f.id === 'all' ? requests.length : requests.filter((r) => r.status === f.id).length;
          return (
            <button key={f.id} type="button" onClick={() => setFilter(f.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${filter === f.id ? 'bg-royal-700 text-white shadow' : 'bg-white text-body/60 ring-1 ring-linec hover:text-body'}`}>
              {f.label} <span className="tabular-nums">({count})</span>
            </button>
          );
        })}
      </div>

      {rows.length === 0 && (
        <EmptyState icon={<FileText className="h-8 w-8" />} title="Aucune demande" text="Les demandes d'abonnement apparaîtront ici." />
      )}

      <div className="space-y-4">
        {rows.map((r) => (
          <div key={r.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-body">{r.userName}</span>
                  <span className="text-xs text-body/50">{r.userEmail}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-body/60">
                  <PlanBadge plan={r.plan} />
                  <span className="capitalize">{r.period}</span>
                  <span className="font-bold text-body tabular-nums">{fcfa(r.amountTotal)}</span>
                  <span>· Réf. {r.ref}</span>
                </div>
                <p className="mt-1 text-xs text-body/50">
                  Créée le {fmtDate(r.createdAt)}
                  {r.submittedAt ? ` · justificatif le ${fmtDate(r.submittedAt)}` : ''}
                  {r.txReference ? ` · transaction ${r.txReference}` : ''}
                </p>
              </div>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusBadge[r.status]}`}>
                {statusLabel[r.status]}
              </span>
            </div>

            {r.refuseReason && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"><strong>Motif de refus :</strong> {r.refuseReason}</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {r.proofFileId && (
                <button type="button" onClick={() => setViewProof(r)} className="btn-ghost">
                  <Eye className="h-4 w-4" /> Voir le justificatif
                </button>
              )}
              <button type="button" onClick={() => setShowAudit(showAudit === r.id ? null : r.id)} className="btn-ghost">
                <FileText className="h-4 w-4" /> Historique
              </button>

              {r.status === 'en_attente' && (
                <span className="ml-auto flex gap-2">
                  <button type="button" onClick={() => setRefuseFor(r)} disabled={busyId === r.id} className="btn-ghost text-red-600">
                    <XCircle className="h-4 w-4" /> Refuser
                  </button>
                  <button type="button" onClick={() => validate(r)} disabled={busyId === r.id} className="btn-primary">
                    <CheckCircle2 className="h-4 w-4" /> {busyId === r.id ? 'Traitement…' : 'Valider'}
                  </button>
                </span>
              )}
              {r.status !== 'en_attente' && r.decidedAt && (
                <span className="ml-auto text-xs text-body/50">
                  {statusLabel[r.status].toLowerCase()} le {fmtDate(r.decidedAt)}
                  {r.decidedByName ? ` par ${r.decidedByName}` : ''}
                </span>
              )}
            </div>

            {showAudit === r.id && (
              <ol className="mt-3 space-y-1.5 rounded-xl bg-sand-50 p-4 text-xs text-body/70">
                {r.audit.map((a, i) => (
                  <li key={i}>
                    <span className="font-semibold">{fmtDate(a.at)}</span> — {a.action}
                    {a.byName ? ` (${a.byName})` : ''}
                    {a.note ? ` · ${a.note}` : ''}
                  </li>
                ))}
              </ol>
            )}
          </div>
        ))}
      </div>

      {/* Modale refus */}
      {refuseFor && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-royal-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Refuser la demande">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-pop">
            <h3 className="font-display text-lg font-bold text-royal-900">Refuser la demande {refuseFor.ref}</h3>
            <p className="mt-1 text-sm text-body/60">Le motif sera communiqué à l'utilisateur, qui pourra renvoyer un justificatif.</p>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} className="input mt-4" placeholder="Motif du refus (obligatoire)…" />
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => { setRefuseFor(null); setReason(''); }} className="btn-ghost">Annuler</button>
              <button type="button" onClick={confirmRefuse} disabled={busyId === refuseFor.id} className="btn-primary bg-red-600 hover:bg-red-700">
                {busyId === refuseFor.id ? 'Traitement…' : 'Confirmer le refus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visionneuse de justificatif */}
      {viewProof && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-royal-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Justificatif" onClick={() => setViewProof(null)}>
          <div className="max-h-[86vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-5 shadow-pop" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-body">Justificatif — {viewProof.ref} ({viewProof.proofFileName})</p>
              <button type="button" onClick={() => setViewProof(null)} className="btn-ghost">Fermer</button>
            </div>
            {/\.pdf$/i.test(viewProof.proofFileName ?? '') ? (
              <iframe src={`/api/file/${viewProof.proofFileId}`} title="Justificatif PDF" className="h-[70vh] w-full rounded-xl border border-linec" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/file/${viewProof.proofFileId}`} alt="Justificatif de paiement" className="w-full rounded-xl border border-linec object-contain" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
