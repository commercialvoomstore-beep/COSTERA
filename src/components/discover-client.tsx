'use client';

// COSTERA — Vitrine publique « Découvrir » : chaque plat est une carte
// unique, organisée par catégories. Clic → modale détaillée : description,
// temps de cuisson, chef (+ ses autres recettes) et carte nutritionnelle
// calculée automatiquement depuis les ingrédients de la fiche technique.
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChefHat, Clock, Flame, Users, X } from 'lucide-react';
import { fcfa } from '@/lib/format';
import type { NutritionTotal } from '@/lib/nutrition';
import type { RecipeCategory } from '@/lib/types';

export interface PublicDish {
  id: string;
  name: string;
  category: RecipeCategory;
  price: number;
  image: string;
  description: string;
  cookTimeMin?: number;
  chef?: string;
  portions: number;
  nutrition: NutritionTotal;
}

const CATEGORY_ORDER: RecipeCategory[] = ['Entrées', 'Plats', 'Accompagnements', 'Desserts', 'Boissons'];

export function DiscoverClient({ dishes }: { dishes: PublicDish[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = dishes.find((d) => d.id === selectedId) ?? null;

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [selected]);

  const groups = useMemo(
    () =>
      CATEGORY_ORDER.map((cat) => ({ cat, items: dishes.filter((d) => d.category === cat) })).filter(
        (g) => g.items.length > 0,
      ),
    [dishes],
  );

  return (
    <>
      {/* En-tête de la vitrine */}
      <section className="mx-auto max-w-6xl px-5 pb-4 pt-12 text-center sm:pt-16">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold-600">La carte COSTERA</p>
        <h1 className="font-display mt-3 text-3xl font-semibold text-royal-900 sm:text-4xl">
          Chaque plat, une signature
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-royal-700/80 sm:text-base">
          Découvrez nos plats un à un : description, temps de cuisson, chef auteur et carte
          nutritionnelle calculée automatiquement à partir des ingrédients de chaque fiche technique.
        </p>
      </section>

      {/* Catégories → cartes individuelles */}
      {groups.map((g) => (
        <section key={g.cat} className="mx-auto max-w-6xl px-5 py-10">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-royal-900">{g.cat}</h2>
              <div className="mt-2 h-px w-16 bg-gradient-to-r from-gold-500 to-transparent" />
            </div>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-royal-500">
              {g.items.length} plat{g.items.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((d) => (
              <DishCard key={d.id} dish={d} onOpen={() => setSelectedId(d.id)} />
            ))}
          </div>
        </section>
      ))}

      {selected && (
        <DishModal
          dish={selected}
          all={dishes}
          onClose={() => setSelectedId(null)}
          onOpen={(id) => setSelectedId(id)}
        />
      )}

      <div className="h-16" />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Carte plat                                                          */
/* ------------------------------------------------------------------ */
function DishCard({ dish, onOpen }: { dish: PublicDish; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="dish-card group relative flex flex-col overflow-hidden rounded-2xl border border-royal-100 bg-white text-left shadow-card transition-all duration-500 ease-premium hover:-translate-y-2 hover:border-gold-300 hover:shadow-pop focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-500"
      aria-label={`Voir le détail de ${dish.name}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-royal-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dish.image}
          alt={dish.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-premium group-hover:scale-[1.07]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-royal-950/45 via-transparent to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-90" />
        <span className="absolute left-4 top-4 rounded-full bg-royal-900/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-300 backdrop-blur-sm">
          {dish.category}
        </span>
        <span className="absolute bottom-3 right-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-royal-800 backdrop-blur-sm">
          <Flame size={12} className="text-gold-600" />
          {dish.nutrition.kcal} kcal
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-semibold leading-snug text-royal-900 transition-colors duration-300 group-hover:text-royal-700">
          {dish.name}
        </h3>
        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-royal-600/90">{dish.description}</p>
        <div className="mt-4 flex items-center justify-between border-t border-royal-100/80 pt-3.5">
          <span className="text-sm font-bold tracking-wide text-gold-700">{fcfa(dish.price)}</span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-royal-500">
            <Clock size={13} className="text-gold-600" />
            {dish.cookTimeMin ? `${dish.cookTimeMin} min` : '—'}
          </span>
        </div>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Modale détail                                                       */
/* ------------------------------------------------------------------ */
function DishModal({
  dish,
  all,
  onClose,
  onOpen,
}: {
  dish: PublicDish;
  all: PublicDish[];
  onClose: () => void;
  onOpen: (id: string) => void;
}) {
  const [chefView, setChefView] = useState(false);
  const others = useMemo(
    () => all.filter((d) => d.chef && d.chef === dish.chef && d.id !== dish.id),
    [all, dish],
  );

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-royal-950/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={dish.name}
    >
      <div
        className="dish-modal relative grid max-h-[90vh] w-full max-w-4xl grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-[0.9fr_1.1fr]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-4 top-4 z-10 rounded-full bg-royal-950/55 p-2 text-ivory backdrop-blur-sm transition-all duration-300 hover:rotate-90 hover:bg-royal-900 hover:text-gold-300"
        >
          <X size={18} />
        </button>

        {/* Visuel */}
        <div className="relative h-56 md:h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dish.image} alt={dish.name} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-royal-950/60 to-transparent" />
          <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-royal-800">
            {dish.category}
          </span>
          <span className="absolute bottom-5 left-5 text-xl font-bold tracking-wide text-gold-300 drop-shadow">
            {fcfa(dish.price)}
          </span>
        </div>

        {/* Contenu */}
        <div className="overflow-y-auto p-6 sm:p-8">
          {chefView ? (
            <ChefPanel dish={dish} others={others} onBack={() => setChefView(false)} onOpen={onOpen} />
          ) : (
            <>
              <h2 className="font-display pr-8 text-2xl font-semibold leading-tight text-royal-900">{dish.name}</h2>

              <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-royal-700">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-royal-50 px-3 py-1.5">
                  <Clock size={13} className="text-gold-600" />
                  Cuisson {dish.cookTimeMin ? `${dish.cookTimeMin} min` : '—'}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-royal-50 px-3 py-1.5">
                  <Users size={13} className="text-gold-600" />
                  {dish.portions} portion{dish.portions > 1 ? 's' : ''}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-royal-50 px-3 py-1.5">
                  <Flame size={13} className="text-gold-600" />
                  {dish.nutrition.kcal} kcal / portion
                </span>
              </div>

              <p className="mt-5 text-sm leading-relaxed text-royal-700">{dish.description}</p>

              {/* Chef */}
              {dish.chef && (
                <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-gold-200 bg-gradient-to-r from-gold-50 to-white px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-royal-900 p-2.5 text-gold-300">
                      <ChefHat size={16} />
                    </span>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-royal-500">Réalisé par</p>
                      <p className="text-sm font-semibold text-royal-900">{dish.chef}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChefView(true)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-royal-200 px-3.5 py-2 text-xs font-semibold text-royal-800 transition-all duration-300 hover:border-gold-400 hover:bg-gold-50 hover:text-gold-700"
                  >
                    Voir ses autres recettes
                    <ArrowRight size={13} />
                  </button>
                </div>
              )}

              {/* Carte nutritionnelle */}
              <NutritionPanel nutrition={dish.nutrition} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Panneau « autres recettes du chef »                                 */
/* ------------------------------------------------------------------ */
function ChefPanel({
  dish,
  others,
  onBack,
  onOpen,
}: {
  dish: PublicDish;
  others: PublicDish[];
  onBack: () => void;
  onOpen: (id: string) => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="text-xs font-semibold uppercase tracking-[0.2em] text-royal-500 transition-colors hover:text-gold-700"
      >
        ← Retour au plat
      </button>
      <div className="mt-4 flex items-center gap-3">
        <span className="rounded-full bg-royal-900 p-3 text-gold-300">
          <ChefHat size={20} />
        </span>
        <div>
          <h2 className="font-display text-xl font-semibold text-royal-900">{dish.chef}</h2>
          <p className="text-xs text-royal-500">
            {others.length} autre{others.length > 1 ? 's' : ''} recette{others.length > 1 ? 's' : ''} publiée
            {others.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {others.length === 0 && (
          <p className="text-sm text-royal-600">Aucune autre recette publiée pour ce chef pour le moment.</p>
        )}
        {others.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onOpen(o.id)}
            className="group flex w-full items-center gap-4 rounded-2xl border border-royal-100 bg-white p-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-300 hover:shadow-card"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={o.image}
              alt=""
              className="h-14 w-14 shrink-0 rounded-xl object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-royal-900">{o.name}</p>
              <p className="text-xs text-royal-500">
                {o.category} · {fcfa(o.price)}
              </p>
            </div>
            <ArrowRight size={15} className="shrink-0 text-gold-600 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Carte nutritionnelle                                                */
/* ------------------------------------------------------------------ */
function NutritionPanel({ nutrition }: { nutrition: NutritionTotal }) {
  const pKcal = nutrition.protein * 4;
  const cKcal = nutrition.carbs * 4;
  const fKcal = nutrition.fat * 9;
  const total = Math.max(1, pKcal + cKcal + fKcal);
  const macros = [
    { label: 'Protéines', grams: nutrition.protein, kcal: pKcal, bar: 'bg-royal-600' },
    { label: 'Glucides', grams: nutrition.carbs, kcal: cKcal, bar: 'bg-gold-500' },
    { label: 'Lipides', grams: nutrition.fat, kcal: fKcal, bar: 'bg-royal-300' },
  ];
  return (
    <div className="mt-6 rounded-2xl border border-royal-100 bg-ivory/60 p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-royal-700">
          Carte nutritionnelle
        </h3>
        <span className="text-[11px] text-royal-500">par portion</span>
      </div>
      <div className="mt-4 flex items-center gap-5">
        <div className="text-center">
          <p className="font-display text-3xl font-semibold text-royal-900">{nutrition.kcal}</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-700">kcal</p>
        </div>
        <div className="flex-1 space-y-2.5">
          {macros.map((m) => (
            <div key={m.label}>
              <div className="flex justify-between text-[11px] font-medium text-royal-700">
                <span>{m.label}</span>
                <span>
                  {m.grams} g · {Math.round((m.kcal / total) * 100)} %
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-royal-100">
                <div
                  className={`h-full rounded-full ${m.bar} transition-all duration-700`}
                  style={{ width: `${Math.max(4, Math.round((m.kcal / total) * 100))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-4 text-[10px] leading-relaxed text-royal-500">
        Valeurs estimées, calculées automatiquement à partir des ingrédients de la fiche technique
        ({nutrition.gramsPerPortion} g d’ingrédients par portion).
      </p>
    </div>
  );
}
