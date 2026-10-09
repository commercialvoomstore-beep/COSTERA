import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { RequestsAdmin, type RequestRow } from '@/components/plans/requests-admin';
import { PageHeader } from '@/components/ui';
import { getSessionUserId } from '@/lib/auth';
import { getDB } from '@/server/db';

export const metadata: Metadata = { title: 'Demandes d’abonnement' };

export default async function DemandesPage() {
  const db = getDB();
  const userId = await getSessionUserId();
  const user = db.users.find((u) => u.id === userId);
  if (!user) redirect('/login');
  if (user.role !== 'admin') redirect('/dashboard');

  const requests: RequestRow[] = db.paymentRequests
    .map((r) => {
      const owner = db.users.find((u) => u.id === r.userId);
      const decider = r.decidedBy ? db.users.find((u) => u.id === r.decidedBy) : null;
      return {
        id: r.id,
        ref: r.ref,
        userName: owner?.name ?? 'Utilisateur supprimé',
        userEmail: owner?.email ?? '—',
        plan: r.plan,
        period: r.period,
        amountTotal: r.amountTotal,
        status: r.status,
        createdAt: r.createdAt,
        submittedAt: r.submittedAt,
        decidedAt: r.decidedAt,
        decidedByName: decider?.name,
        refuseReason: r.refuseReason,
        proofFileId: r.proofFileId,
        proofFileName: r.proofFileName,
        txReference: r.txReference,
        audit: r.audit.map((a) => ({
          action: a.action,
          at: a.at,
          byName: a.by ? db.users.find((u) => u.id === a.by)?.name : undefined,
          note: a.note,
        })),
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <PageHeader
        title="Demandes d'abonnement"
        description="Validez ou refusez les demandes de souscription après vérification du justificatif."
      />
      <RequestsAdmin requests={requests} />
    </div>
  );
}
