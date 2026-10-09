'use client';

// COSTERA — Page « Nos forfaits » : trois cartes de tarification, GOLD mis
// en avant, et tableau comparatif. Les prix viennent des paramètres (admin).
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Crown, Gem, Leaf, Minus } from 'lucide-react';
import { fcfa } from '@/lib/format';
import type { PlanLevel } from '@/lib/types';
import type { PlanConfig } from '@/lib/types';
import { PlanBadge } from '@/components/plan-ui';

type Period = 'mensuel' | 'annuel';

const FEATURES: { label: string; free: string | boolean; silver: string | boolean; gold: string | boolean }[] = [
  { label: 'Menus inclus', free: '5 menus', silver: '10 menus', gold: 'Illimités' },
  { label: 'Fiches techniques & food cost', free: true, silver: true, gold: true },
  { label: 'Cartes (restaurant, hôtel, traiteur)', free: 'Modèle sobre', silver: 'Modèles raffinés', gold: 'Modèles raffinés' },
  { label: 'Vidéo explicative des menus', free: 'Lien externe', silver: 'Fichiers 100 Mo', gold: 'Fichiers 500 Mo' },
  { label: 'Accès aux plats SILVER', free: false, silver: true, gold: true },
  { label: 'Accès aux plats GOLD', free: false, silver: false, gold: true },
  { label: 'Thèmes & personnalisation avancée', free: false, silver: true, gold: true },
  { label: 'Export PDF & QR code des cartes', free: true, silver: true, gold: true },
  { label: 'Support prioritaire', free: false, silver: false, gold: true },
];

export function PricingSection({
  cfg,
  currentPlan,
}: {
  cfg: PlanConfig;
  currentPlan: PlanLevel;
}) {
  const [period, setPeriod] = useState<Period>('mensuel');

  const prices = useMemo(() => {
    const silver = period === 'annuel' ? cfg.prices.silver.yearly : cfg.prices.silver.monthly;
    const gold = period === 'annuel' ? cfg.prices.gold.yearly : cfg.prices.gold.monthly;
    return { silver, gold };
  }, [cfg, period]);

  const tvaNote = cfg.tvaEnabled ? ` (+ TVA ${cfg.tvaPct} %)` : '';

  const Card = ({
    plan,
    tagline,
    price,
    features,
    highlight,
  }: {
    plan: PlanLevel;
    tagline: string;
    price: number | null;
    features: string[];
    highlight?: boolean;
  }) => {
    const Icon = plan === 'gold' ? Crown : plan === 'silver' ? Gem : Leaf;
    return (
      <div className={`plan-card ${highlight ? 'plan-card-gold' : ''}`}>
        {highlight && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#B8892B] to-[#E2C275] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow">
            Le plus complet
          </span>
        )}
        <div className="flex items-center justify-between">
          <PlanBadge plan={plan} size="lg" />
          <Icon className={`h-6 w-6 ${plan === 'gold' ? 'text-gold-600' : plan === 'silver' ? 'text-silver-600' : 'text-forest-600'}`} aria-hidden />
        </div>
        <p className="mt-3 text-sm text-body/60">{tagline}</p>
        <div className="mt-4">
          {price === null ? (
            <p className="font-display text-3xl font-bold text-body">Gratuit</p>
          ) : (
            <p className="font-display text-3xl font-bold text-body">
              {fcfa(price)}
              <span className="ml-1 text-sm font-medium text-body/50">/ {period === 'annuel' ? 'an' : 'mois'}{tvaNote}</span>
            </p>
          )}
        </div>
        <ul className="mt-5 flex-1 space-y-2.5">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-body/75">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" aria-hidden />
              {f}
            </li>
          ))}
        </ul>
        <div className="mt-6">
          {currentPlan === plan ? (
            <span className="btn-ghost w-full cursor-default justify-center opacity-80">Votre forfait actuel</span>
          ) : plan === 'free' ? (
            <Link href="/abonnement" className="btn-ghost w-full justify-center">Inclus avec votre compte</Link>
          ) : (
            <Link href={`/paiement?plan=${plan}&period=${period}`} className={plan === 'gold' ? 'btn-gold w-full justify-center' : 'btn-primary w-full justify-center'}>
              Choisir ce forfait
            </Link>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Sélecteur de période */}
      <div className="mb-8 flex items-center justify-center gap-1 rounded-full border border-linec bg-white p-1 shadow-sm w-fit mx-auto" role="tablist" aria-label="Période de facturation">
        {(['mensuel', 'annuel'] as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={period === p}
            onClick={() => setPeriod(p)}
            className={`rounded-full px-5 py-2 text-sm font-semibold capitalize transition ${period === p ? 'bg-gradient-to-r from-royal-700 to-royal-600 text-white shadow' : 'text-body/60 hover:text-body'}`}
          >
            {p} {p === 'annuel' && <span className="ml-1 text-[10px] font-bold uppercase text-gold-600">−17%</span>}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card plan="free" tagline="Pour découvrir COSTERA et créer vos premières fiches." price={null}
          features={['5 menus', 'Fiches techniques & food cost', 'Vidéo par lien externe', 'Cartes au modèle sobre']} />
        <Card plan="silver" tagline="Pour les restaurants qui passent à la vitesse supérieure." price={prices.silver}
          features={['10 menus', 'Accès aux plats FREE + SILVER', 'Vidéos jusqu’à 100 Mo', 'Modèles de carte raffinés', 'Thèmes & personnalisation']} />
        <Card plan="gold" tagline="L’offre complète, sans limite, pour l’excellence." price={prices.gold} highlight
          features={['Menus illimités', 'Accès à tous les plats (GOLD inclus)', 'Vidéos jusqu’à 500 Mo', 'Tous les modèles & thèmes', 'Support prioritaire']} />
      </div>

      {/* Tableau comparatif */}
      <div className="mt-14 overflow-x-auto rounded-2xl border border-linec bg-white shadow-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-linec text-left">
              <th className="px-5 py-4 font-bold text-body">Comparatif détaillé</th>
              <th className="px-4 py-4 text-center"><PlanBadge plan="free" /></th>
              <th className="px-4 py-4 text-center"><PlanBadge plan="silver" /></th>
              <th className="px-4 py-4 text-center"><PlanBadge plan="gold" /></th>
            </tr>
          </thead>
          <tbody>
            {FEATURES.map((row) => (
              <tr key={row.label} className="border-b border-linec/60 last:border-0">
                <td className="px-5 py-3 font-medium text-body/80">{row.label}</td>
                {(['free', 'silver', 'gold'] as PlanLevel[]).map((p) => {
                  const v = row[p];
                  return (
                    <td key={p} className="px-4 py-3 text-center">
                      {v === true ? (
                        <Check className="mx-auto h-4 w-4 text-forest-600" aria-label="Inclus" />
                      ) : v === false ? (
                        <Minus className="mx-auto h-4 w-4 text-body/25" aria-label="Non inclus" />
                      ) : (
                        <span className="text-xs font-semibold text-body/70">{v}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
