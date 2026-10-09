'use client';

// COSTERA — Rendu d'une carte (menu de restaurant / hôtel) avec thème,
// séparateurs pointillés nom–prix, ornements et verrouillage par niveau.
import { useMemo } from 'react';
import Link from 'next/link';
import { Crown, Gem, Leaf } from 'lucide-react';
import { mediaSrc } from '@/lib/media';
import { canAccessLevel, CARD_THEMES } from '@/lib/plans';
import { fcfa } from '@/lib/format';
import type { Card, Dish, PlanLevel } from '@/lib/types';
import { LockedOverlay, PlanBadge } from '@/components/plan-ui';

const FONT_CLASS: Record<Card['font'], string> = {
  classique: 'font-display',
  moderne: 'font-sans',
  affiche: 'font-display italic',
};

export function CardRender({
  card,
  dishes,
  viewerLevel,
  showLocks = true,
  onUnlock,
}: {
  card: Card;
  dishes: Dish[];
  viewerLevel: PlanLevel;
  /** false = rendu éditeur : pas de floutage (le propriétaire voit tout). */
  showLocks?: boolean;
  /** Appelé quand on clique « Débloquer » sur un plat verrouillé. */
  onUnlock?: (target: PlanLevel) => void;
}) {
  const theme = CARD_THEMES.find((t) => t.id === card.theme) ?? CARD_THEMES[0];
  const accent = card.accentColor || theme.accent;

  const byCategory = useMemo(() => {
    const ordered = card.categories.length ? card.categories : ['Plats'];
    const map = new Map<string, Dish[]>();
    for (const c of ordered) map.set(c, []);
    for (const d of [...dishes].sort((a, b) => a.sortIndex - b.sortIndex)) {
      const key = d.category && map.has(d.category) ? d.category : ordered[0];
      map.get(key)?.push(d);
    }
    return [...map.entries()].filter(([, list]) => list.length > 0);
  }, [card.categories, dishes]);

  const cover = mediaSrc(card.coverFileId);

  return (
    <div className={`${theme.bg} ${theme.ink} overflow-hidden rounded-3xl shadow-pop`} style={{ ['--accent' as never]: accent }}>
      {/* En-tête */}
      <div className="relative">
        {cover && (
          <div className="relative h-48 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt="" className="h-full w-full object-cover opacity-90" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent 60%)' }} />
          </div>
        )}
        <div className={`relative px-8 pb-6 pt-8 text-center ${cover ? '-mt-16' : ''}`}>
          <p className="text-[11px] font-bold uppercase tracking-[0.35em]" style={{ color: accent }}>
            {card.type === 'personnalise' && card.customType ? card.customType : card.type.replace(/-/g, ' ')}
          </p>
          <h2 className={`${FONT_CLASS[card.font]} mt-2 text-3xl font-bold`} style={{ color: theme.ink === 'text-[#F8F4EB]' ? '#fff' : undefined }}>
            {card.name}
          </h2>
          {card.slogan && <p className="mt-1 text-sm italic opacity-80">{card.slogan}</p>}
          <div className="mx-auto mt-4 h-px w-32" style={{ background: `linear-gradient(to right, transparent, ${accent}, transparent)` }} />
          <div className="mt-3 flex justify-center">
            <PlanBadge plan={card.level} />
          </div>
        </div>
      </div>

      {/* Plats par catégorie */}
      <div className="space-y-8 px-8 pb-10">
        {byCategory.map(([cat, list]) => (
          <div key={cat}>
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px flex-1" style={{ background: `linear-gradient(to right, transparent, ${accent})` }} />
              <h3 className={`${FONT_CLASS[card.font]} text-lg font-semibold`} style={{ color: accent }}>{cat}</h3>
              <span className="h-px flex-1" style={{ background: `linear-gradient(to left, transparent, ${accent})` }} />
            </div>
            <ul className="space-y-4">
              {list.map((d) => {
                const locked = showLocks && !canAccessLevel(viewerLevel, d.level);
                return (
                  <li key={d.id}>
                    <DishRow dish={d} accent={accent} locked={locked} viewerLevel={viewerLevel} onUnlock={onUnlock} />
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {byCategory.length === 0 && (
          <p className="py-10 text-center text-sm opacity-60">Aucun plat sur cette carte pour le moment.</p>
        )}
      </div>
    </div>
  );
}

function DishRow({ dish, accent, locked, viewerLevel, onUnlock }: { dish: Dish; accent: string; locked: boolean; viewerLevel: PlanLevel; onUnlock?: (t: PlanLevel) => void }) {
  const photo = mediaSrc(dish.photoFileId);
  const LevelIcon = dish.level === 'gold' ? Crown : dish.level === 'silver' ? Gem : Leaf;

  const inner = (
    <div className="flex items-start gap-4">
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" className={`h-16 w-16 shrink-0 rounded-xl object-cover ${locked ? 'locked-preview' : ''}`} />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate font-semibold">{dish.name}</span>
          <span className="flex-1 border-b border-dotted opacity-40" />
          <span className="shrink-0 font-bold tabular-nums" style={{ color: accent }}>{fcfa(dish.price)}</span>
        </div>
        {dish.description && <p className="mt-1 line-clamp-2 text-xs opacity-70">{dish.description}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {dish.level !== 'free' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase opacity-70">
              <LevelIcon className="h-3 w-3" /> {dish.level}
            </span>
          )}
          {dish.allergens.map((a) => (
            <span key={a} className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">{a}</span>
          ))}
        </div>
      </div>
    </div>
  );

  if (!locked) return inner;
  return (
    <LockedOverlay level={dish.level} accountLevel={viewerLevel} locked onUnlock={onUnlock}>
      {inner}
    </LockedOverlay>
  );
}
