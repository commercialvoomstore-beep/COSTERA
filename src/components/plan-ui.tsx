'use client';

// COSTERA — Composants d'affichage des forfaits : badges FREE/SILVER/GOLD,
// jauge de quota, cadenas et contenu verrouillé.
import { useEffect, useRef, useState } from 'react';
import { Crown, Gem, Leaf, Lock, LockOpen } from 'lucide-react';
import type { PlanLevel } from '@/lib/types';
import { PLAN_LABELS, PLAN_SHORT, isUnlimited, nextLevel } from '@/lib/plans';

/* ------------------------------------------------------------------ */
/* Badge de forfait                                                     */
/* ------------------------------------------------------------------ */

export function PlanBadge({ plan, size = 'sm' }: { plan: PlanLevel; size?: 'sm' | 'lg' }) {
  const cls = plan === 'gold' ? 'plan-badge-gold' : plan === 'silver' ? 'plan-badge-silver' : 'plan-badge-free';
  const Icon = plan === 'gold' ? Crown : plan === 'silver' ? Gem : Leaf;
  const px = size === 'lg' ? 'px-4 py-1.5 text-xs' : '';
  return (
    <span className={`plan-badge ${cls} ${px}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {PLAN_SHORT[plan]}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Jauge de quota de menus                                              */
/* ------------------------------------------------------------------ */

export function QuotaGauge({
  used,
  limit,
  plan,
  unlimited,
}: {
  used: number;
  limit: number;
  plan: PlanLevel;
  unlimited?: boolean;
}) {
  const pctUsed = unlimited || limit <= 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const near = !unlimited && limit > 0 && used / limit >= 0.8 && used < limit;
  const full = !unlimited && limit > 0 && used >= limit;
  const fillCls = plan === 'gold' ? 'quota-fill-gold' : plan === 'silver' ? 'quota-fill-silver' : 'quota-fill-free';

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-semibold text-body">
          {unlimited ? (
            <>Menus utilisés : <span className="tabular-nums">{used}</span> · illimité</>
          ) : (
            <>
              <span className="tabular-nums">{used}</span> / <span className="tabular-nums">{limit}</span> menus utilisés
            </>
          )}
        </span>
        {!unlimited && <span className="text-xs font-bold text-body/50 tabular-nums">{pctUsed}%</span>}
      </div>
      {!unlimited && (
        <div className="quota-track" role="progressbar" aria-valuenow={used} aria-valuemin={0} aria-valuemax={limit}>
          <div className={`quota-fill ${fillCls}`} style={{ width: `${pctUsed}%` }} />
        </div>
      )}
      {full && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          Limite atteinte : la création de nouveaux menus est bloquée. Passez à un forfait supérieur pour continuer.
        </p>
      )}
      {near && !full && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
          Vous approchez de la limite de votre forfait. Pensez à passer au niveau supérieur.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Contenu verrouillé : aperçu flouté + cadenas + déverrouillage        */
/* ------------------------------------------------------------------ */

export function LockedOverlay({
  level,
  accountLevel,
  onUnlock,
  children,
  locked = true,
}: {
  /** Niveau requis par le contenu. */
  level: PlanLevel;
  /** Niveau du compte courant (pour décider du bouton). */
  accountLevel: PlanLevel;
  onUnlock?: (target: PlanLevel) => void;
  children: React.ReactNode;
  locked?: boolean;
}) {
  const [shake, setShake] = useState(false);
  const [opening, setOpening] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  if (!locked) return <>{children}</>;

  const target = nextLevel(accountLevel) ?? level;
  const unlockLabel = `Débloquer avec ${PLAN_SHORT[level]}`;

  const handleClick = () => {
    setShake(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setShake(false), 420);
  };

  return (
    <div className="locked-overlay">
      <div className="locked-preview" aria-hidden>
        {children}
      </div>
      <div className="locked-veil" onClick={handleClick} role="button" tabIndex={0} aria-label={`Contenu ${PLAN_LABELS[level]} verrouillé`}>
        <span className={`grid h-12 w-12 place-items-center rounded-full bg-white/95 text-royal-800 shadow-pop ${shake ? 'padlock-shake' : ''}`}>
          <Lock className="h-5 w-5" aria-hidden />
        </span>
        <PlanBadge plan={level} />
        <p className="max-w-[220px] text-center text-xs font-medium text-white/90">
          Contenu réservé au forfait {PLAN_LABELS[level]}.
        </p>
        {onUnlock && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpening(true);
              setTimeout(() => onUnlock(level), 250);
            }}
            className="btn-gold mt-1"
          >
            <LockOpen className={`h-4 w-4 ${opening ? 'padlock-open' : ''}`} aria-hidden />
            {unlockLabel}
          </button>
        )}
      </div>
    </div>
  );
}
