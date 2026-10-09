import type { Metadata } from 'next';
import Link from 'next/link';
import { CreditCard, ExternalLink, Plus } from 'lucide-react';
import { PlanBadge } from '@/components/plan-ui';
import { Badge, Card, EmptyState, LinkButton, PageHeader } from '@/components/ui';
import { CARD_TYPE_LABELS } from '@/lib/plans';
import { mediaSrc } from '@/lib/media';
import { getSessionUserId } from '@/lib/auth';
import { getDB } from '@/server/db';

export const metadata: Metadata = { title: 'Mes cartes' };

export default async function CartesPage() {
  const db = getDB();
  const userId = await getSessionUserId();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return null;

  const myCards = db.cards
    .filter((c) => c.ownerId === user.id || user.role === 'admin')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div>
      <PageHeader
        title="Mes cartes"
        description="Cartes de restaurant, d'hôtel ou de traiteur. Les cartes sont des conteneurs : elles ne comptent pas dans votre quota de menus."
        actions={<LinkButton href="/cartes/nouvelle" variant="primary"><Plus className="h-4 w-4" /> Nouvelle carte</LinkButton>}
      />

      {myCards.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="h-8 w-8" />}
          title="Aucune carte"
          text="Créez votre première carte pour présenter vos plats à vos clients ou élèves."
          action={<LinkButton href="/cartes/nouvelle" variant="primary"><Plus className="h-4 w-4" /> Créer une carte</LinkButton>}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {myCards.map((card) => {
            const dishCount = db.dishes.filter((d) => d.cardId === card.id).length;
            const cover = mediaSrc(card.coverFileId);
            return (
              <Card key={card.id} className="overflow-hidden">
                <div className="relative h-32">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-gradient-to-br from-royal-100 to-gold-100 text-royal-300">
                      <CreditCard className="h-8 w-8" />
                    </div>
                  )}
                  <div className="absolute right-3 top-3"><PlanBadge plan={card.level} /></div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-lg font-bold text-royal-900">{card.name}</h3>
                      <p className="text-xs uppercase tracking-wide text-body/50">{CARD_TYPE_LABELS[card.type] ?? card.type}</p>
                    </div>
                    <Badge tone={card.status === 'publiee' ? 'green' : 'amber'}>{card.status === 'publiee' ? 'Publiée' : 'Brouillon'}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-body/60">
                    <span className="font-semibold tabular-nums">{dishCount}</span> plat{dishCount > 1 ? 's' : ''}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/cartes/${card.id}`} className="btn-primary">Éditer</Link>
                    {card.status === 'publiee' && (
                      <Link href={`/c/${card.shareSlug}`} className="btn-ghost" target="_blank">
                        <ExternalLink className="h-4 w-4" /> Voir la carte
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
