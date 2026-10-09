import type { Metadata } from 'next';
import Link from 'next/link';
import { CardEditor } from '@/components/cards/card-editor';
import { PageHeader } from '@/components/ui';
import { isUnlimited, resolvePlanConfig } from '@/lib/plans';
import { getSessionUserId } from '@/lib/auth';
import { getDB } from '@/server/db';
import { countUserDishes, userLevel } from '@/server/planService';

export const metadata: Metadata = { title: 'Nouvelle carte' };

export default async function NouvelleCartePage() {
  const db = getDB();
  const userId = await getSessionUserId();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return null;

  const cfg = resolvePlanConfig(db.settings);
  const level = userLevel(user);
  const limit = cfg.quotas[level];

  return (
    <div>
      <PageHeader
        title="Nouvelle carte"
        description="Créez une carte pour votre restaurant, hôtel ou service traiteur."
        actions={<Link href="/cartes" className="btn-ghost">Retour à mes cartes</Link>}
      />
      <CardEditor
        card={null}
        dishes={[]}
        recipes={db.recipes.filter((r) => r.status === 'active').map((r) => ({ id: r.id, name: r.name }))}
        videoLimitMb={cfg.videoMaxMb[level] ?? 0}
        plan={level}
        quota={{ used: countUserDishes(db, user.id), limit, unlimited: isUnlimited(limit) }}
      />
    </div>
  );
}
