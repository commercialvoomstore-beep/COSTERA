'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, UtensilsCrossed } from 'lucide-react';
import { MenuForm, type MenuFormRecipe } from './forms/MenuForm';
import { Modal } from './modal';
import { Card, EmptyState } from './ui';
import { fcfa } from '@/lib/format';
import type { Role } from '@/lib/types';
import { can } from '@/lib/roles';

export interface MenuCard {
  id: string;
  name: string;
  description?: string;
  dishCount: number;
  sectionTitles: string[];
  avgPerPortion: number | null;
  avgFoodCostPct: number | null;
}

export function MenusClient({ menus, recipes, role }: { menus: MenuCard[]; recipes: MenuFormRecipe[]; role: Role }) {
  const [open, setOpen] = useState(false);
  const canManage = can(role, 'manageMenus');

  return (
    <div>
      {menus.length === 0 ? (
        <EmptyState
          icon={<UtensilsCrossed className="h-10 w-10" />}
          title="Aucun menu pour le moment"
          text="Composez votre premier menu à partir de vos fiches techniques."
          action={canManage ? (
            <button onClick={() => setOpen(true)} className="btn-primary">
              <Plus className="h-4 w-4" />
              Créer un menu
            </button>
          ) : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {menus.map((m) => (
            <Link key={m.id} href={`/menus/${m.id}`} className="card group p-6 transition hover:-translate-y-0.5 hover:shadow-pop">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-ink group-hover:text-brand-700">{m.name}</h3>
                  {m.description ? <p className="mt-1 text-sm text-stone-500">{m.description}</p> : null}
                </div>
                <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">{m.dishCount} plat{m.dishCount > 1 ? 's' : ''}</span>
              </div>
              <p className="mt-3 text-xs font-medium text-stone-400">{m.sectionTitles.join(' · ')}</p>
              <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">Coût moyen / portion</p>
                  <p className="text-base font-black text-ink">{m.avgPerPortion !== null ? fcfa(m.avgPerPortion) : '—'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">Food cost moyen</p>
                  <p className={`text-base font-black ${m.avgFoodCostPct === null ? 'text-ink' : m.avgFoodCostPct <= 35 ? 'text-forest-700' : m.avgFoodCostPct <= 43 ? 'text-amber-600' : 'text-red-600'}`}>
                    {m.avgFoodCostPct !== null ? `${m.avgFoodCostPct.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %` : '—'}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {canManage ? (
        <div className="mt-6">
          <button onClick={() => setOpen(true)} className="btn-ghost">
            <Plus className="h-4 w-4" />
            Nouveau menu
          </button>
        </div>
      ) : null}

      <Modal open={open} title="Nouveau menu" onClose={() => setOpen(false)}>
        <MenuForm recipes={recipes} onClose={() => setOpen(false)} />
      </Modal>
    </div>
  );
}
