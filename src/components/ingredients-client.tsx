'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight, Plus, Search } from 'lucide-react';
import { IngredientForm } from './forms/IngredientForm';
import { Modal } from './modal';
import { Badge, EmptyState } from './ui';
import { INGREDIENT_CATEGORIES } from '@/lib/types';
import { fcfa, fmtDate, pct } from '@/lib/format';
import { can } from '@/lib/roles';
import type { Role } from '@/lib/types';

export interface IngredientRow {
  id: string;
  name: string;
  category: string;
  unitAbbr: string;
  price: number;
  supplier?: string;
  recipeCount: number;
  updatedAt: string;
  deltaPct: number | null;
}

export function IngredientsClient({ rows, role }: { rows: IngredientRow[]; role: Role }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [openCreate, setOpenCreate] = useState(false);
  const canManage = can(role, 'manageIngredients');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => (category === 'all' ? true : r.category === category))
      .filter((r) => (q ? r.name.toLowerCase().includes(q) || (r.supplier ?? '').toLowerCase().includes(q) : true))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }, [rows, query, category]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input className="input pl-9" placeholder="Rechercher un ingrédient, un fournisseur…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className="input w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">Toutes les catégories</option>
          {INGREDIENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {canManage ? (
          <button onClick={() => setOpenCreate(true)} className="btn-primary ml-auto">
            <Plus className="h-4 w-4" />
            Nouvel ingrédient
          </button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Aucun ingrédient trouvé"
          text="Modifiez votre recherche ou créez un nouvel ingrédient pour commencer."
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="th">Ingrédient</th>
                <th className="th">Catégorie</th>
                <th className="th">Prix d’achat</th>
                <th className="th">Variation</th>
                <th className="th">Utilisation</th>
                <th className="th">Mise à jour</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-stone-50 transition hover:bg-sand-50">
                  <td className="td">
                    <Link href={`/ingredients/${r.id}`} className="font-semibold text-ink hover:text-brand-700">
                      {r.name}
                    </Link>
                    {r.supplier ? <p className="text-xs text-stone-400">{r.supplier}</p> : null}
                  </td>
                  <td className="td">
                    <Badge tone="neutral">{r.category}</Badge>
                  </td>
                  <td className="td whitespace-nowrap font-bold text-ink">
                    {fcfa(r.price)}
                    <span className="text-xs font-normal text-stone-400"> / {r.unitAbbr}</span>
                  </td>
                  <td className="td">
                    {r.deltaPct === null ? (
                      <span className="text-xs text-stone-300">—</span>
                    ) : Math.abs(r.deltaPct) < 0.05 ? (
                      <span className="text-xs font-semibold text-stone-400">stable</span>
                    ) : r.deltaPct > 0 ? (
                      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-red-600">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        +{pct(r.deltaPct)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-forest-700">
                        <ArrowDownRight className="h-3.5 w-3.5" />
                        {pct(r.deltaPct)}
                      </span>
                    )}
                  </td>
                  <td className="td text-sm text-stone-500">
                    {r.recipeCount} recette{r.recipeCount > 1 ? 's' : ''}
                  </td>
                  <td className="td text-xs text-stone-400">{fmtDate(r.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={openCreate} title="Nouvel ingrédient" onClose={() => setOpenCreate(false)}>
        <IngredientForm onClose={() => setOpenCreate(false)} />
      </Modal>
    </div>
  );
}
