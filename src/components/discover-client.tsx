'use client';

// COSTERA — Vitrine publique « Découvrir les menus » : une carte par menu
// publié, bouton « Découvrir les menus » → modal plein écran premium
// (zoom depuis la carte, fond flouté, onglets dorés, plats en cascade,
// séparateurs pointillés, badge Food Cost réservé aux rôles connectés,
// bottom-sheet mobile, focus piégé, Échap, clic extérieur).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ChefHat, Clock, Flame, Phone, Users, X } from 'lucide-react';
import { fcfa } from '@/lib/format';
import type { NutritionTotal } from '@/lib/nutrition';
import type { RecipeCategory, Role } from '@/lib/types';

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
  allergens: string[];
  foodCostPct: number | null;
  margin: number;
}

export interface PublicMenu {
  id: string;
  name: string;
  description?: string;
  cover: string;
  dishes: PublicDish[];
}

const TABS: RecipeCategory[] = ['Entrées', 'Plats', 'Accompagnements', 'Desserts', 'Boissons'];

const ALLERGEN_COLORS: Record<string, string> = {
  gluten: '#B8892B',
  arachides: '#C0562B',
  poisson: '#2B6EC0',
  crustacés: '#C02B5E',
  œufs: '#C0A22B',
  lait: '#7A9CC0',
  soja: '#4C8A3C',
  'fruits à coque': '#8A5A2B',
  céleri: '#5E8A3C',
  moutarde: '#B09A20',
  sésame: '#9A7B4F',
  sulfites: '#8A3C8A',
  lupin: '#B0C02B',
  mollusques: '#3C6E8A',
};

export function DiscoverClient({ menus, viewerRole }: { menus: PublicMenu[]; viewerRole: Role | null }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = menus.find((m) => m.id === openId) ?? null;

  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pb-4 pt-12 text-center sm:pt-16">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold-600">La carte COSTERA</p>
        <h1 className="font-display mt-3 text-3xl font-semibold text-royal-900 sm:text-4xl">
          Nos cartes de menus
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-royal-700/80 sm:text-base">
          Chaque carte s’ouvre comme un véritable menu de restaurant : plats décrits, prix en FCFA,
          et pour les équipes connectées, le Food Cost et la marge de chaque plat.
        </p>
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-7 px-5 py-10 md:grid-cols-2">
        {menus.map((m) => (
          <MenuCard key={m.id} menu={m} onOpen={() => setOpenId(m.id)} />
        ))}
        {menus.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-royal-200 bg-white p-10 text-center text-sm text-royal-500">
            Aucun menu publié pour le moment.
          </div>
        )}
      </section>
      <div className="h-16" />

      {open && <MenuModal menu={open} viewerRole={viewerRole} onClose={() => setOpenId(null)} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Carte menu                                                          */
/* ------------------------------------------------------------------ */
function MenuCard({ menu, onOpen }: { menu: PublicMenu; onOpen: () => void }) {
  const prices = menu.dishes.map((d) => d.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return (
    <article className="dish-card group overflow-hidden rounded-3xl border border-royal-100 bg-white shadow-card transition-all duration-500 ease-premium hover:-translate-y-1.5 hover:border-gold-300 hover:shadow-pop">
      <div className="relative h-52 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={menu.cover}
          alt={menu.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-premium group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-royal-950/70 via-transparent to-transparent" />
        <span className="absolute bottom-3 right-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-royal-800">
          {menu.dishes.length} plats · {fcfa(min)} – {fcfa(max)}
        </span>
      </div>
      <div className="p-6">
        <h2 className="font-display text-xl font-semibold text-royal-900">{menu.name}</h2>
        {menu.description && <p className="mt-2 line-clamp-2 text-sm text-royal-600/90">{menu.description}</p>}
        <button
          type="button"
          onClick={onOpen}
          className="auth-btn-violet mt-5 w-full sm:w-auto"
        >
          Découvrir les menus
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Modal plein écran                                                   */
/* ------------------------------------------------------------------ */
function MenuModal({ menu, viewerRole, onClose }: { menu: PublicMenu; viewerRole: Role | null; onClose: () => void }) {
  const [tab, setTab] = useState<RecipeCategory>('Entrées');
  const [detail, setDetail] = useState<PublicDish | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const staff = viewerRole !== null;

  const cats = useMemo(() => TABS.filter((c) => menu.dishes.some((d) => d.category === c)), [menu]);
  const activeTab = cats.includes(tab) ? tab : (cats[0] ?? 'Entrées');
  const dishes = menu.dishes.filter((d) => d.category === activeTab);
  const prices = menu.dishes.map((d) => d.price);

  /* Focus piégé + Échap */
  useEffect(() => {
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>('button, a')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (detail) setDetail(null);
        else onClose();
      }
      if (e.key === 'Tab' && panel) {
        const els = [...panel.querySelectorAll<HTMLElement>('button, a, [tabindex]:not([tabindex="-1"])')].filter(
          (el) => !el.hasAttribute('disabled'),
        );
        if (els.length === 0) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [detail, onClose]);

  return (
    <div
      className="menu-backdrop fixed inset-0 z-[80] flex items-end justify-center lg:items-center lg:p-8"
      onClick={() => (detail ? setDetail(null) : onClose())}
      role="dialog"
      aria-modal="true"
      aria-label={`Menu ${menu.name}`}
    >
      <div
        ref={panelRef}
        className="menu-panel relative flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden bg-ivory shadow-2xl lg:h-[88vh] lg:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête Ken Burns */}
        <div className="relative h-44 shrink-0 overflow-hidden sm:h-52">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={menu.cover} alt="" className="kenburns absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-royal-950/85 via-royal-950/25 to-royal-950/10" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu"
            className="absolute right-4 top-4 rounded-full bg-royal-950/55 p-2 text-ivory backdrop-blur-sm transition-all duration-300 hover:rotate-90 hover:bg-royal-900 hover:text-gold-300"
          >
            <X size={18} />
          </button>
          <div className="absolute bottom-4 left-5 right-5 sm:left-7">
            <h2 className="font-display text-2xl font-semibold text-white drop-shadow sm:text-3xl">{menu.name}</h2>
            <p className="mt-1 text-xs font-medium text-ivory/85">
              {menu.dishes.length} plats · {fcfa(Math.min(...prices))} – {fcfa(Math.max(...prices))}
            </p>
          </div>
        </div>

        {/* Onglets catégories, soulignement doré animé */}
        <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-royal-100 bg-white px-4 sm:px-6" role="tablist">
          {cats.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={activeTab === c}
              onClick={() => setTab(c)}
              className={`menu-tab ${activeTab === c ? 'menu-tab-on' : ''}`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Plats en cascade */}
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-7">
          <div key={activeTab} className="space-y-3.5">
            {dishes.map((d, i) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDetail(d)}
                style={{ animationDelay: `${i * 60}ms` }}
                className="menu-dish group flex w-full items-center gap-4 rounded-2xl border border-royal-100/70 bg-white p-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-300 hover:shadow-card sm:p-4"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={d.image}
                  alt=""
                  loading="lazy"
                  className="h-16 w-16 shrink-0 rounded-xl object-cover transition-transform duration-500 group-hover:scale-105 sm:h-20 sm:w-20"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-display truncate text-base font-semibold text-royal-900">{d.name}</h3>
                    <span className="menu-dots" aria-hidden="true" />
                    <span className="shrink-0 text-sm font-bold tracking-wide text-gold-700 tabular-nums">
                      {fcfa(d.price)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-royal-600/90">{d.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {staff && d.foodCostPct !== null && (
                      <span className="rounded-full bg-royal-900 px-2.5 py-0.5 text-[10px] font-semibold text-gold-300">
                        Food Cost {d.foodCostPct.toFixed(0)} % · Marge {fcfa(d.margin)}
                      </span>
                    )}
                    {d.allergens.length > 0 && <AllergenBadges allergens={d.allergens} compact />}
                  </div>
                </div>
              </button>
            ))}
            {dishes.length === 0 && (
              <p className="rounded-2xl border border-dashed border-royal-200 bg-white p-8 text-center text-sm text-royal-500">
                Aucun plat dans cette catégorie pour ce menu.
              </p>
            )}
          </div>
        </div>

        {/* Pied */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-royal-100 bg-white px-5 py-4">
          <p className="text-[11px] text-royal-500">Prix nets en francs CFA · service compris</p>
          <a href="mailto:contact@costera.ci" className="auth-btn-gold">
            <Phone className="h-4 w-4" />
            {staff ? 'Réserver' : 'Contacter'}
          </a>
        </div>
      </div>

      {detail && <DishDetail dish={detail} staff={staff} onClose={() => setDetail(null)} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Détail plat (nutrition + allergènes)                                */
/* ------------------------------------------------------------------ */
function DishDetail({ dish, staff, onClose }: { dish: PublicDish; staff: boolean; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const n = dish.nutrition;
  const pKcal = n.protein * 4;
  const cKcal = n.carbs * 4;
  const fKcal = n.fat * 9;
  const total = Math.max(1, pKcal + cKcal + fKcal);
  const ring = (kcal: number) => `${(kcal / total) * 100}`;

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-royal-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={dish.name}
    >
      <div
        className="relative max-h-[86vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-4 top-4 rounded-full bg-royal-50 p-2 text-royal-700 transition-all duration-300 hover:rotate-90 hover:bg-royal-100"
        >
          <X size={16} />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dish.image} alt="" className="h-40 w-full rounded-2xl object-cover" />
        <h3 className="font-display mt-4 text-xl font-semibold text-royal-900">{dish.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-royal-700">{dish.description}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-royal-700">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-royal-50 px-3 py-1.5">
            <Clock size={13} className="text-gold-600" /> Cuisson {dish.cookTimeMin ?? '—'} min
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-royal-50 px-3 py-1.5">
            <Users size={13} className="text-gold-600" /> {dish.portions} portions
          </span>
          {dish.chef && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-50 px-3 py-1.5 text-gold-800">
              <ChefHat size={13} /> {dish.chef}
            </span>
          )}
        </div>

        {/* Nutrition : étiquette + anneau des macros */}
        <div className="mt-5 rounded-2xl border border-royal-100 bg-ivory/60 p-5">
          <div className="flex items-center gap-5">
            <div
              className="relative h-24 w-24 shrink-0 rounded-full"
              style={{
                background: `conic-gradient(#5B2D9E 0 ${ring(pKcal)}%, #C8A45D ${ring(pKcal)}% ${
                  parseFloat(ring(pKcal)) + parseFloat(ring(cKcal))
                }%, #BB9CE0 ${parseFloat(ring(pKcal)) + parseFloat(ring(cKcal))}% 100%)`,
              }}
              role="img"
              aria-label={`Répartition : protéines ${Math.round((pKcal / total) * 100)} %, glucides ${Math.round(
                (cKcal / total) * 100,
              )} %, lipides ${Math.round((fKcal / total) * 100)} %`}
            >
              <div className="absolute inset-2 flex flex-col items-center justify-center rounded-full bg-white">
                <span className="font-display text-lg font-semibold text-royal-900 tabular-nums">{n.kcal}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-gold-700">kcal</span>
              </div>
            </div>
            <div className="flex-1 space-y-1.5 text-[12px] font-medium text-royal-700">
              <p className="flex justify-between"><span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-royal-600" />Protéines</span><span className="tabular-nums">{n.protein} g</span></p>
              <p className="flex justify-between"><span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-gold-500" />Glucides</span><span className="tabular-nums">{n.carbs} g</span></p>
              <p className="flex justify-between"><span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-royal-300" />Lipides</span><span className="tabular-nums">{n.fat} g</span></p>
              <p className="flex justify-between text-royal-500"><span>Fibres</span><span className="tabular-nums">{n.fiber ?? '—'} g</span></p>
            </div>
          </div>
          <p className="mt-3 text-[10px] text-royal-500">
            Calculée automatiquement par portion à partir des ingrédients de la fiche technique.
          </p>
        </div>

        {dish.allergens.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-royal-700">Allergènes</p>
            <div className="mt-2">
              <AllergenBadges allergens={dish.allergens} />
            </div>
          </div>
        )}
        {staff && dish.foodCostPct !== null && (
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-royal-900 px-3 py-1.5 text-[11px] font-semibold text-gold-300">
            <Flame size={12} /> Food Cost {dish.foodCostPct.toFixed(2)} % · Marge {fcfa(dish.margin)}
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pictogrammes allergènes                                             */
/* ------------------------------------------------------------------ */
export function AllergenBadges({ allergens, compact = false }: { allergens: string[]; compact?: boolean }) {
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {allergens.map((a) => (
        <span
          key={a}
          title={`Allergène : ${a}`}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
          style={{ background: ALLERGEN_COLORS[a] ?? '#8347BD' }}
        >
          {compact ? a.slice(0, 3).toUpperCase() : a}
        </span>
      ))}
    </span>
  );
}
