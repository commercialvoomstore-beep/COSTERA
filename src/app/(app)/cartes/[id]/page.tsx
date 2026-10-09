import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CardEditor } from '@/components/cards/card-editor';
import { PageHeader } from '@/components/ui';
import { isUnlimited, resolvePlanConfig } from '@/lib/plans';
import { getSessionUserId } from '@/lib/auth';
import { getDB } from '@/server/db';
import { countUserDishes, userLevel } from '@/server/planService';

export const metadata: Metadata = { title: 'Éditer la carte' };

export default async function EditCartePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDB();
  const userId = await getSessionUserId();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return null;

  const card = db.cards.find((c) => c.id === id);
  if (!card) notFound();
  if (card.ownerId !== user.id && user.role !== 'admin') notFound();

  const dishes = db.dishes.filter((d) => d.cardId === card.id);
  const cfg = resolvePlanConfig(db.settings);
  const level = userLevel(user);
  const limit = cfg.quotas[level];

  return (
    <div>
      <PageHeader
        title={card.name}
        description="Modifiez les informations, les plats et l'apparence de votre carte."
        actions={<Link href="/cartes" className="btn-ghost">Retour à mes cartes</Link>}
      />
      <CardEditor
        card={card}
        dishes={dishes}
        recipes={db.recipes.filter((r) => r.status === 'active').map((r) => ({ id: r.id, name: r.name }))}
        videoLimitMb={cfg.videoMaxMb[level] ?? 0}
        plan={level}
        quota={{ used: countUserDishes(db, user.id), limit, unlimited: isUnlimited(limit) }}
      />
    </div>
  );
}
