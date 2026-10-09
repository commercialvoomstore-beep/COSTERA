'use client';

// COSTERA — Vitrine publique « Découvrir les menus » : fond blanc/ivoire,
// recherche réelle, filtres réels, cartes élégantes au survol premium.
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, UtensilsCrossed } from 'lucide-react';
import { Badge, EmptyState } from './ui';
import type { RecipeCategory } from '@/lib/types';

export interface PublicDish {
  id: string;
  name: string;
  category: RecipeCategory;
  price: number;
  image: string;
}

export interface PublicMenuRow {
  id: string;
  name: string;
  description?: string;
  sections: { title: string; dishes: PublicDish[] }[];
  dishCount: number;
  categories: RecipeCategory[];
  cover: string;
}

export function DiscoverClient({ menus }: { menus: PublicMenuRow[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | RecipeCategory>('all');

  const availableCategories = useMemo(() => {
    const set = new Set<RecipeCategory>();
    menus.forEach((m) => m.categories.forEach((c) => set.add(c)));
    return [...set];
  }, [menus]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return menus
      .filter((m) => (category === 'all' ? true : m.categories.includes(category)))
      .filter((m) => {
        if (!q) return true;
        const dishNames = m.sections.flatMap((s) => s.dishes.map((d) => d.name)).join(' ');
        return `${m.name} ${m.description ?? ''} ${dishNames}`.toLowerCase().includes(q);
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }, [menus, query, category]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-12 sm:px-6">
      {/* Introduction */}
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-600">Vitrine gastronomique</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-royal-800 sm:text-5xl">Découvrir les menus</h1>
        <p className="mt-4 text-base leading-relaxed text-body/60">
          Explorez les cartes publiées par les chefs et établissements COSTERA : une gastronomie ivoirienne
          vivante, chiffrée avec précision et présentée avec élégance.
        </p>
        <div className="mx-auto mt-6 h-px w-44 bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
      </div>

      {/* Recherche + filtres */}
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-body/35" />
          <input
            className="input rounded-full py-2.5 pl-10"
            placeholder="Rechercher un menu, un plat… (ex. garba, kedjenou)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Rechercher un menu"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par catégorie">
          <button
            onClick={() => setCategory('all')}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
              category === 'all' ? 'border-royal-700 bg-royal-700 text-white shadow-sm' : 'border-linec bg-white text-body/60 hover:border-gold-500/70 hover:text-royal-700'
            }`}
          >
            Tous
          </button>
          {availableCategories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                category === c ? 'border-royal-700 bg-royal-700 text-white shadow-sm' : 'border-linec bg-white text-body/60 hover:border-gold-500/70 hover:text-royal-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grille */}
      <div className="mt-10">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<UtensilsCrossed className="h-10 w-10" />}
            title="Aucun menu ne correspond à votre recherche"
            text="Essayez un autre terme ou retirez un filtre : la vitrine s’enrichit au fil des publications des chefs."
            action={
              <button onClick={() => { setQuery(''); setCategory('all'); }} className="btn-ghost">
                Réinitialiser les filtres
              </button>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((m) => (
              <article key={m.id} className="card card-hover group flex flex-col overflow-hidden">
                <Link href={`/decouvrir/${m.id}`} className="flex h-full flex-col" aria-label={`Voir le menu ${m.name}`}>
                  <div className="img-zoom relative aspect-[16/10]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.cover} alt={`Plat du menu ${m.name}`} loading="lazy" className="h-full w-full object-cover" />
                    <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-royal-800 shadow-sm backdrop-blur">
                      {m.dishCount} plat{m.dishCount > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="font-display text-lg font-bold text-body transition-colors duration-200 group-hover:text-royal-700">{m.name}</h2>
                    {m.description ? <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-body/55">{m.description}</p> : null}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {m.categories.slice(0, 3).map((c) => (
                        <Badge key={c} tone="neutral">{c}</Badge>
                      ))}
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-linec pt-4">
                      <span className="text-xs font-semibold uppercase tracking-wide text-body/45">{m.sections.length} section{m.sections.length > 1 ? 's' : ''}</span>
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-royal-700 transition-all duration-200 group-hover:gap-2 group-hover:text-royal-800">
                        Voir le menu
                        <span aria-hidden="true">→</span>
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
