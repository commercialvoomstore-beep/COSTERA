'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Badge, EmptyState } from './ui';
import { fcfa, pct } from '@/lib/format';
import { RECIPE_CATEGORIES } from '@/lib/types';
import type { RatioStatus } from '@/lib/foodcost';

export interface RecipeRow {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'brouillon' | 'archivee';
  portions: number;
  salePrice: number;
  perPortion: number;
  foodCostPct: number | null;
  ratio: RatioStatus;
  ingredientsCount: number;
}

export function RecipesClient({ rows, targetPct }: { rows: RecipeRow[]; targetPct: number }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => (category === 'all' ? true : r.category === category))
      .filter((r) => (status === 'all' ? true : r.status === status))
      .filter((r) => (q ? r.name.toLowerCase().includes(q) : true))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }, [rows, query, category, status]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input className="input pl-9" placeholder="Rechercher une recette…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className="input w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">Toutes catégories</option>
          {RECIPE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">Tous statuts</option>
          <option value="active">Actives</option>
          <option value="brouillon">Brouillons</option>
          <option value="archivee">Archivées</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Aucune recette trouvée" text="Modifiez vos filtres ou créez une nouvelle fiche technique." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="th">Recette</th>
                <th className="th">Catégorie</th>
                <th className="th">Coût / portion</th>
                <th className="th">Prix de vente</th>
                <th className="th">Food cost</th>
                <th className="th">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-stone-50 transition hover:bg-sand-50">
                  <td className="td">
                    <Link href={`/recettes/${r.id}`} className="font-semibold text-ink hover:text-brand-700">
                      {r.name}
                    </Link>
                    <p className="text-xs text-stone-400">
                      {r.ingredientsCount} ingrédient{r.ingredientsCount > 1 ? 's' : ''} · {r.portions} portion{r.portions > 1 ? 's' : ''}
                    </p>
                  </td>
                  <td className="td">
                    <Badge tone="neutral">{r.category}</Badge>
                  </td>
                  <td className="td whitespace-nowrap font-bold text-ink">{fcfa(r.perPortion)}</td>
                  <td className="td whitespace-nowrap text-stone-600">{r.salePrice > 0 ? fcfa(r.salePrice) : '—'}</td>
                  <td className="td">
                    {r.foodCostPct !== null ? (
                      <Badge tone={r.ratio === 'good' ? 'green' : r.ratio === 'warn' ? 'amber' : 'red'}>{pct(r.foodCostPct)}</Badge>
                    ) : (
                      <span className="text-xs text-stone-300">—</span>
                    )}
                  </td>
                  <td className="td">
                    {r.status === 'active' ? <Badge tone="green">Active</Badge> : r.status === 'brouillon' ? <Badge tone="amber">Brouillon</Badge> : <Badge tone="neutral">Archivée</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-stone-400">
        Code couleur : <span className="font-semibold text-forest-700">vert</span> ≤ {targetPct} % ·{' '}
        <span className="font-semibold text-amber-600">ambre</span> ≤ {targetPct + 8} % ·{' '}
        <span className="font-semibold text-red-600">rouge</span> &gt; {targetPct + 8} %.
      </p>
    </div>
  );
}
