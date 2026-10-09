'use client';

// COSTERA — Analyses du tableau de bord : KPI carte, ingénierie de menu
// (nuage de points interactif popularité × rentabilité, ventes éditables),
// alertes de prix d'achat > 5 %.
import { useMemo, useState } from 'react';
import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { menuEngineering, MENU_ENGINEERING_LABELS, type MenuEngineeringClass } from '@/lib/costing-engine';
import { fcfa, pct } from '@/lib/format';

export interface DashRecipeRow {
  id: string;
  name: string;
  category: string;
  perPortion: number;
  salePrice: number;
  margin: number;
  foodCostPct: number | null;
  defaultSold: number;
}

export interface PriceAlertRow {
  ingredientId: string;
  name: string;
  previous: number;
  current: number;
  deltaPct: number;
  usedBy: string[];
}

const CLASS_COLOR: Record<MenuEngineeringClass, string> = {
  star: '#3f9142',
  'vache-a-lait': '#C8A45D',
  enigme: '#5B2D9E',
  'poids-mort': '#C0392B',
};

export function DashboardExtras({
  recipes,
  alerts,
  targetPct,
}: {
  recipes: DashRecipeRow[];
  alerts: PriceAlertRow[];
  targetPct: number;
}) {
  const [sold, setSold] = useState<Record<string, number>>(() =>
    Object.fromEntries(recipes.map((r) => [r.id, r.defaultSold])),
  );

  const classes = useMemo(
    () => menuEngineering(recipes.map((r) => ({ id: r.id, sold: sold[r.id] ?? 0, margin: r.margin }))),
    [recipes, sold],
  );

  const withFc = recipes.filter((r) => r.foodCostPct !== null);
  const avgFc = withFc.length ? withFc.reduce((s, r) => s + (r.foodCostPct ?? 0), 0) / withFc.length : null;
  const avgMargin = recipes.length ? recipes.reduce((s, r) => s + r.margin, 0) / recipes.length : 0;
  const best = [...recipes].sort((a, b) => b.margin - a.margin)[0];
  const worst = [...withFc].sort((a, b) => (b.foodCostPct ?? 0) - (a.foodCostPct ?? 0))[0];

  const totalSold = recipes.reduce((s, r) => s + (sold[r.id] ?? 0), 0);

  return (
    <div className="mt-8 space-y-6">
      {/* KPI carte */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Food cost moyen</p>
          <p className={`mt-1 text-xl font-black tabular-nums ${avgFc !== null && avgFc <= targetPct ? 'text-forest-700' : 'text-red-600'}`}>
            {avgFc === null ? '—' : pct(avgFc, 2)}
          </p>
          <p className="text-xs text-stone-400">objectif {targetPct} %</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Marge moyenne / portion</p>
          <p className="mt-1 text-xl font-black text-forest-700 tabular-nums">{fcfa(avgMargin)}</p>
          <p className="text-xs text-stone-400">sur {recipes.length} plats actifs</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Plat le plus rentable</p>
          <p className="mt-1 truncate text-base font-black text-ink">{best?.name ?? '—'}</p>
          <p className="text-xs text-forest-600">{best ? `${fcfa(best.margin)} de marge` : ''}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Plat à corriger</p>
          <p className="mt-1 truncate text-base font-black text-ink">{worst?.name ?? '—'}</p>
          <p className="text-xs text-red-600">{worst ? `food cost ${pct(worst.foodCostPct)}` : ''}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Nuage d'ingénierie de menu */}
        <div className="card p-5">
          <h2 className="text-sm font-black uppercase tracking-wide text-stone-600">Analyse du menu — ingénierie</h2>
          <p className="mt-1 text-xs text-stone-400">
            Popularité (part des ventes, modifiable) × rentabilité (marge). Cliquez sur les ventes pour simuler.
          </p>
          <svg viewBox="0 0 560 320" className="mt-4 w-full" role="img" aria-label="Nuage de points popularité rentabilité">
            <line x1="40" y1="280" x2="540" y2="280" stroke="#EAE6EF" strokeWidth="1.5" />
            <line x1="40" y1="20" x2="40" y2="280" stroke="#EAE6EF" strokeWidth="1.5" />
            <line x1="290" y1="20" x2="290" y2="280" stroke="#d9c8ee" strokeDasharray="5 5" />
            <line x1="40" y1="150" x2="540" y2="150" stroke="#d9c8ee" strokeDasharray="5 5" />
            <text x="430" y="40" fontSize="11" fill="#3f9142" fontWeight="700">STARS</text>
            <text x="60" y="40" fontSize="11" fill="#5B2D9E" fontWeight="700">ÉNIGMES</text>
            <text x="430" y="270" fontSize="11" fill="#C8A45D" fontWeight="700">VACHES À LAIT</text>
            <text x="60" y="270" fontSize="11" fill="#C0392B" fontWeight="700">POIDS MORTS</text>
            {(() => {
              // Le seuil de popularité (70 % de la part égale) tombe sur la
              // ligne pointillée verticale (x = 290) et la marge moyenne sur la
              // ligne pointillée horizontale (y = 150) : lecture immédiate.
              const thresholdShare = totalSold > 0 ? (0.7 / Math.max(1, recipes.length)) * 100 : 0;
              const meanMargin = recipes.length ? recipes.reduce((s, r) => s + r.margin, 0) / recipes.length : 0;
              return recipes.map((r) => {
                const share = totalSold > 0 ? ((sold[r.id] ?? 0) / totalSold) * 100 : 0;
                const x = thresholdShare > 0 ? 40 + Math.min(1, share / (2 * thresholdShare)) * 500 : 40;
                const y = meanMargin > 0 ? 280 - Math.min(0.98, r.margin / (2 * meanMargin)) * 260 : 150;
                const cls = classes[r.id];
                return (
                  <g key={r.id}>
                    <circle cx={x} cy={y} r="9" fill={CLASS_COLOR[cls]} opacity="0.85" />
                    <title>{`${r.name} — ${MENU_ENGINEERING_LABELS[cls]} · ${sold[r.id]} ventes/sem · marge ${fcfa(r.margin)}`}</title>
                  </g>
                );
              });
            })()}
            <text x="290" y="308" fontSize="10" fill="#a8a29e" textAnchor="middle">Popularité →</text>
            <text x="16" y="150" fontSize="10" fill="#a8a29e" transform="rotate(-90 16 150)" textAnchor="middle">Marge →</text>
          </svg>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[420px]">
              <thead>
                <tr className="border-b border-stone-100 text-left">
                  <th className="th">Plat</th>
                  <th className="th">Ventes/sem</th>
                  <th className="th">Classe</th>
                </tr>
              </thead>
              <tbody>
                {recipes.map((r) => (
                  <tr key={r.id} className="border-b border-stone-50">
                    <td className="td font-semibold text-ink">{r.name}</td>
                    <td className="td">
                      <input
                        type="number"
                        min={0}
                        aria-label={`Ventes hebdomadaires de ${r.name}`}
                        className="input w-20 py-1"
                        value={sold[r.id] ?? 0}
                        onChange={(e) => setSold((s) => ({ ...s, [r.id]: Number(e.target.value) }))}
                      />
                    </td>
                    <td className="td">
                      <span className="rounded-full px-2.5 py-1 text-[11px] font-bold text-white" style={{ background: CLASS_COLOR[classes[r.id]] }}>
                        {MENU_ENGINEERING_LABELS[classes[r.id]]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alertes prix */}
        <div className="card p-5">
          <h2 className="text-sm font-black uppercase tracking-wide text-stone-600">Alertes prix d'achat (+5 %)</h2>
          <div className="mt-4 space-y-3">
            {alerts.length === 0 && <p className="text-sm text-stone-400">Aucune hausse anormale détectée.</p>}
            {alerts.map((a) => (
              <div key={a.ingredientId} className="rounded-2xl border border-red-100 bg-red-50/60 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-bold text-red-800">
                    <AlertTriangle size={14} /> {a.name}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-black text-red-600 tabular-nums">
                    <TrendingUp size={13} /> +{pct(a.deltaPct, 1)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-red-700 tabular-nums">
                  {fcfa(a.previous)} → {fcfa(a.current)} par unité d'achat
                </p>
                {a.usedBy.length > 0 && (
                  <p className="mt-1.5 text-[11px] text-red-600">
                    Food costs impactés : {a.usedBy.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-[11px] text-stone-400">
            <TrendingDown size={12} /> Les food costs des fiches citées sont recalculés automatiquement.
          </p>
        </div>
      </div>
    </div>
  );
}
