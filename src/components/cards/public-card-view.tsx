'use client';

// COSTERA — Vue publique d'une carte : applique le verrouillage selon le
// niveau du visiteur, renvoie vers les forfaits pour débloquer, et gère
// l'impression PDF (?print=1).
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { canAccessLevel, PLAN_LABELS } from '@/lib/plans';
import type { Card, Dish, PlanLevel } from '@/lib/types';
import { CardRender } from './card-render';
import { PlanBadge } from '@/components/plan-ui';

export function PublicCardView({
  card,
  dishes,
  viewerLevel,
  isOwner,
  autoPrint,
}: {
  card: Card;
  dishes: Dish[];
  viewerLevel: PlanLevel;
  isOwner: boolean;
  autoPrint: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    if (autoPrint) {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [autoPrint]);

  // Le propriétaire voit sa carte complète (pas de floutage).
  const showLocks = !isOwner;

  // Carte entière verrouillée si son niveau dépasse celui du visiteur.
  const cardLocked = showLocks && !canAccessLevel(viewerLevel, card.level);
  if (cardLocked) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 text-center shadow-pop">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-royal-50 text-royal-600"><Lock className="h-7 w-7" /></span>
        <h2 className="mt-4 font-display text-2xl font-bold text-royal-900">Carte {PLAN_LABELS[card.level]}</h2>
        <p className="mt-2 text-sm text-body/60">
          Cette carte est réservée aux abonnés {PLAN_LABELS[card.level]}. Son contenu détaillé n'est pas accessible avec votre forfait actuel.
        </p>
        <div className="mt-3 flex justify-center"><PlanBadge plan={card.level} size="lg" /></div>
        <button type="button" onClick={() => router.push('/forfaits')} className="btn-gold mt-6 justify-center">
          Débloquer avec {card.level === 'gold' ? 'GOLD' : 'SILVER'}
        </button>
      </div>
    );
  }

  return <CardRender card={card} dishes={dishes} viewerLevel={viewerLevel} showLocks={showLocks} onUnlock={() => router.push('/forfaits')} />;
}
