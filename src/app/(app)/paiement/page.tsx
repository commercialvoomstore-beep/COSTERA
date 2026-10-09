import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PaymentStepper } from '@/components/plans/payment-stepper';
import { PageHeader } from '@/components/ui';
import { resolvePlanConfig } from '@/lib/plans';
import { getSessionUserId } from '@/lib/auth';
import type { PaymentPeriod, PlanLevel } from '@/lib/types';
import { getDB } from '@/server/db';

export const metadata: Metadata = { title: 'Paiement' };

export default async function PaiementPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; period?: string; resend?: string }>;
}) {
  const userId = await getSessionUserId();
  if (!userId) redirect('/login');
  const sp = await searchParams;
  const db = getDB();
  const cfg = resolvePlanConfig(db.settings);
  const user = db.users.find((u) => u.id === userId);

  const plan: PlanLevel = sp.plan === 'gold' ? 'gold' : 'silver';
  const period: PaymentPeriod = sp.period === 'annuel' ? 'annuel' : 'mensuel';

  // Renvoi de justificatif pour une demande existante (refusée ou sans preuve).
  let resendRef: string | undefined;
  if (sp.resend && user) {
    const existing = db.paymentRequests.find((r) => r.ref === sp.resend && r.userId === user.id);
    if (existing) resendRef = existing.ref;
  }

  return (
    <div>
      <PageHeader
        title="Souscrire un forfait"
        description="Récapitulatif, choix du moyen de paiement, envoi du justificatif puis validation par notre équipe."
      />
      <PaymentStepper cfg={cfg} plan={plan} period={period} resendRef={resendRef} />
    </div>
  );
}
