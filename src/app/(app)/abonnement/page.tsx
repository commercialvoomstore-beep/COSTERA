import type { Metadata } from 'next';
import Link from 'next/link';
import { Download, Receipt, RefreshCcw, Sparkles } from 'lucide-react';
import { QuotaGauge, PlanBadge } from '@/components/plan-ui';
import { Badge, Card, CardHeader, EmptyState, LinkButton, PageHeader } from '@/components/ui';
import { PLAN_LABELS, resolvePlanConfig, planIsExpired } from '@/lib/plans';
import { isUnlimited } from '@/lib/plans';
import { fcfa, fmtDate } from '@/lib/format';
import { getSessionUserId } from '@/lib/auth';
import { getDB } from '@/server/db';
import { countUserDishes, userLevel } from '@/server/planService';

export const metadata: Metadata = { title: 'Mon abonnement' };

const STATUS_META: Record<string, { label: string; tone: 'green' | 'amber' | 'red' | 'neutral' }> = {
  en_attente: { label: 'En attente', tone: 'amber' },
  validee: { label: 'Validée', tone: 'green' },
  refusee: { label: 'Refusée', tone: 'red' },
  expiree: { label: 'Expirée', tone: 'neutral' },
};

export default async function AbonnementPage() {
  const db = getDB();
  const userId = await getSessionUserId();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return null;

  const cfg = resolvePlanConfig(db.settings);
  const level = userLevel(user);
  const used = countUserDishes(db, user.id);
  const limit = cfg.quotas[level];
  const expired = planIsExpired(user);
  const requests = db.paymentRequests.filter((r) => r.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const subs = db.subscriptions.filter((s) => s.userId === user.id).sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  return (
    <div>
      <PageHeader
        title="Mon abonnement"
        description="Forfait actif, expiration, historique des paiements et des demandes."
        actions={<LinkButton href="/forfaits" variant="primary"><Sparkles className="h-4 w-4" /> Changer de forfait</LinkButton>}
      />

      {/* Forfait actuel */}
      <Card className="mb-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <PlanBadge plan={level} size="lg" />
              <span className="font-display text-lg font-bold text-royal-900">{PLAN_LABELS[level]}</span>
            </div>
            <p className="mt-1.5 text-sm text-body/60">
              {level === 'free' ? (
                'Forfait gratuit, sans expiration.'
              ) : expired ? (
                <span className="font-semibold text-red-600">Abonnement expiré le {user.planExpiresAt ? fmtDate(user.planExpiresAt) : '—'}. Vos menus sont en lecture seule.</span>
              ) : (
                <>Actif jusqu'au <strong>{user.planExpiresAt ? fmtDate(user.planExpiresAt) : '—'}</strong>.</>
              )}
            </p>
          </div>
          {level !== 'gold' && (
            <LinkButton href="/forfaits" variant="gold">Passer au niveau supérieur</LinkButton>
          )}
        </div>
        <div className="mt-5 border-t border-linec pt-5">
          <QuotaGauge used={used} limit={limit} plan={level} unlimited={isUnlimited(limit)} />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Demandes */}
        <Card>
          <CardHeader title="Demandes d'abonnement" description="Vos demandes de souscription et leur statut." />
          <div className="space-y-3 p-5">
            {requests.length === 0 && (
              <EmptyState icon={<Receipt className="h-8 w-8" />} title="Aucune demande" text="Choisissez un forfait pour créer votre première demande." />
            )}
            {requests.map((r) => {
              const st = STATUS_META[r.status];
              return (
                <div key={r.id} className="rounded-xl border border-linec p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <PlanBadge plan={r.plan} />
                      <span className="text-sm font-semibold text-body capitalize">{r.period}</span>
                    </div>
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-body/60">
                    Réf. <strong>{r.ref}</strong> · {fcfa(r.amountTotal)} · créée le {fmtDate(r.createdAt)}
                  </p>
                  {r.status === 'refusee' && r.refuseReason && (
                    <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"><strong>Motif :</strong> {r.refuseReason}</p>
                  )}
                  {r.status === 'refusee' && (
                    <Link href={`/paiement?plan=${r.plan}&period=${r.period}&resend=${r.ref}`} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-royal-700 hover:text-royal-900">
                      <RefreshCcw className="h-4 w-4" /> Renvoyer un justificatif
                    </Link>
                  )}
                  {r.status === 'en_attente' && !r.proofFileId && (
                    <Link href={`/paiement?plan=${r.plan}&period=${r.period}&resend=${r.ref}`} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-royal-700 hover:text-royal-900">
                      <Receipt className="h-4 w-4" /> Envoyer le justificatif
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Historique des paiements */}
        <Card>
          <CardHeader title="Historique des paiements" description="Vos abonnements activés et reçus téléchargeables." />
          <div className="space-y-3 p-5">
            {subs.length === 0 && (
              <EmptyState icon={<Download className="h-8 w-8" />} title="Aucun paiement" text="Vos reçus apparaîtront ici après validation." />
            )}
            {subs.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-linec p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <PlanBadge plan={s.plan} />
                    <span className="text-sm font-bold text-body">{fcfa(s.amount)}</span>
                  </div>
                  <p className="mt-1 text-xs text-body/55">
                    Du {fmtDate(s.startedAt)} au {s.expiresAt ? fmtDate(s.expiresAt) : '—'} · {s.period}
                  </p>
                </div>
                <a href={`/api/recu/${s.id}`} className="btn-ghost" download>
                  <Download className="h-4 w-4" /> Reçu PDF
                </a>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
