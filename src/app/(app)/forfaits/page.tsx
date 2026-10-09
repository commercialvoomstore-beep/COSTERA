import type { Metadata } from 'next';
import { PricingSection } from '@/components/plans/pricing';
import { PageHeader } from '@/components/ui';
import { resolvePlanConfig } from '@/lib/plans';
import { getSessionUserId } from '@/lib/auth';
import { getDB } from '@/server/db';
import { userLevel } from '@/server/planService';

export const metadata: Metadata = { title: 'Nos forfaits' };

export default async function ForfaitsPage() {
  const db = getDB();
  const userId = await getSessionUserId();
  const user = db.users.find((u) => u.id === userId);
  const cfg = resolvePlanConfig(db.settings);
  const current = user ? userLevel(user) : 'free';

  return (
    <div>
      <PageHeader
        title="Nos forfaits"
        description="Choisissez le niveau d'accès qui correspond à votre établissement. Les contenus des niveaux supérieurs restent verrouillés tant que vous n'avez pas souscrit."
      />
      <PricingSection cfg={cfg} currentPlan={current} />
    </div>
  );
}
