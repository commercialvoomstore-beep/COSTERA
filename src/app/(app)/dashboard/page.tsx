import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, ChefHat, Gauge, Percent, Wallet } from 'lucide-react';
import { BarList, Donut } from '@/components/charts';
import { DashboardExtras, type DashRecipeRow, type PriceAlertRow } from '@/components/dashboard-extras';
import { Badge, Card, CardHeader, PageHeader } from '@/components/ui';
import { priceIncreaseAlert } from '@/lib/costing-engine';
import { fmtDate, fcfa, pct } from '@/lib/format';
import { costOfRecipe, priceDeltaPct, ratioStatus } from '@/lib/foodcost';
import { can } from '@/lib/roles';
import { getSessionUserId } from '@/lib/auth';
import { getDB } from '@/server/db';

export const metadata: Metadata = { title: 'Tableau de bord' };

const CATEGORY_COLORS: Record<string, string> = {
  Entrées: '#D98245',
  Plats: '#6B3BB5',
  Accompagnements: '#C8A45D',
  Desserts: '#9d6fd0',
  Boissons: '#54258A',
};

export default async function DashboardPage() {
  const db = getDB();
  const userId = await getSessionUserId();
  const user = db.users.find((u) => u.id === userId)!;
  const ingMap = new Map(db.ingredients.map((i) => [i.id, i]));

  // Recettes actives avec coûts calculés
  const activeRecipes = db.recipes.filter((r) => r.status === 'active');
  const priced = activeRecipes
    .map((r) => ({ recipe: r, cost: costOfRecipe(r, ingMap) }))
    .filter((x) => x.cost.foodCostPct !== null);

  const avgFoodCost = priced.length ? priced.reduce((s, x) => s + (x.cost.foodCostPct as number), 0) / priced.length : null;
  const target = db.settings.targetFoodCostPct;
  const badCount = priced.filter((x) => ratioStatus(x.cost.foodCostPct, target) === 'bad').length;
  const goodCount = priced.filter((x) => ratioStatus(x.cost.foodCostPct, target) === 'good').length;
  const avgMargin = priced.length ? priced.reduce((s, x) => s + x.cost.margin, 0) / priced.length : null;

  // Répartition du coût matière par catégorie de recette
  const byCategory = new Map<string, number>();
  for (const { recipe, cost } of activeRecipes.map((r) => ({ recipe: r, cost: costOfRecipe(r, ingMap) }))) {
    byCategory.set(recipe.category, (byCategory.get(recipe.category) ?? 0) + cost.total);
  }
  const donutSegments = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value, color: CATEGORY_COLORS[label] ?? '#78716c' }));

  // Top recettes par coût matière / portion
  const topCosts = [...priced]
    .sort((a, b) => b.cost.perPortion - a.cost.perPortion)
    .slice(0, 5)
    .map(({ recipe, cost }) => ({ label: recipe.name, value: cost.perPortion, display: fcfa(cost.perPortion), sub: '/ portion' }));

  // Mouvements de prix récents
  const priceMoves = db.ingredients
    .map((ing) => {
      const h = ing.history;
      if (h.length < 2) return null;
      const last = h[h.length - 1];
      const prev = h[h.length - 2];
      return { ing, last, prev, delta: priceDeltaPct(prev.price, last.price) };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.last.date.localeCompare(a.last.date))
    .slice(0, 7);

  // Analyses : lignes plats (marges réelles) + ventes hebdomadaires simulées (démo),
  // et alertes d'achat : hausse du dernier prix enregistré supérieure à 5 %.
  const dashRecipes = activeRecipes.map((r) => ({ recipe: r, cost: costOfRecipe(r, ingMap) }));
  const extraRows: DashRecipeRow[] = dashRecipes.map(({ recipe, cost }, i) => ({
    id: recipe.id,
    name: recipe.name,
    category: recipe.category,
    perPortion: cost.perPortion,
    salePrice: recipe.salePrice,
    margin: cost.margin,
    foodCostPct: cost.foodCostPct,
    defaultSold: 12 + ((i * 13) % 49),
  }));
  const priceAlerts: PriceAlertRow[] = db.ingredients
    .map((ing) => {
      if (ing.history.length < 2) return null;
      const prev = ing.history[ing.history.length - 2];
      const last = ing.history[ing.history.length - 1];
      if (!priceIncreaseAlert(prev.price, last.price)) return null;
      return {
        ingredientId: ing.id,
        name: ing.name,
        previous: prev.price,
        current: last.price,
        deltaPct: ((last.price - prev.price) / prev.price) * 100,
        usedBy: dashRecipes
          .filter(({ recipe }) => recipe.lines.some((l) => l.ingredientId === ing.id))
          .map(({ recipe }) => recipe.name),
      };
    })
    .filter((x): x is PriceAlertRow => x !== null);

  return (
    <div>
      <PageHeader
        title={`Bonjour, ${user.name.split(' ')[0]}`}
        description={`Voici la situation de ${db.settings.orgName} — objectif food cost : ${target} %.`}
      />

      {/* KPI */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Recettes actives</p>
            <ChefHat className="h-4 w-4 text-brand-600" />
          </div>
          <p className="text-3xl font-black text-ink">{activeRecipes.length}</p>
          <p className="mt-1 text-xs text-stone-400">{db.recipes.length} fiches au total · {db.ingredients.length} ingrédients suivis</p>
        </Card>
        <Card className="p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Food cost moyen</p>
            <Percent className="h-4 w-4 text-brand-600" />
          </div>
          <p className="text-3xl font-black text-ink">{pct(avgFoodCost)}</p>
          <p className="mt-1 text-xs text-stone-400">
            Objectif : {target} % ·{' '}
            <span className={badCount > 0 ? 'font-semibold text-red-600' : 'font-semibold text-forest-700'}>
              {badCount} recette(s) en dépassement sévère
            </span>
          </p>
        </Card>
        <Card className="p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Marge moyenne / portion</p>
            <Wallet className="h-4 w-4 text-brand-600" />
          </div>
          <p className="text-3xl font-black text-ink">{avgMargin !== null ? fcfa(avgMargin) : '—'}</p>
          <p className="mt-1 text-xs text-stone-400">Sur les recettes actives avec prix de vente</p>
        </Card>
        <Card className="p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Santé du portefeuille</p>
            <Gauge className="h-4 w-4 text-brand-600" />
          </div>
          <p className="text-3xl font-black text-ink">
            {goodCount}<span className="text-lg text-stone-400"> / {priced.length}</span>
          </p>
          <p className="mt-1 text-xs text-stone-400">recettes sous l’objectif de {target} %</p>
        </Card>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {/* Répartition par catégorie */}
        <Card>
          <CardHeader title="Répartition du coût matière" description="Coût matière cumulé par catégorie de recette active." />
          <div className="flex flex-col items-center gap-6 p-5 sm:flex-row">
            <Donut segments={donutSegments} centerValue={fcfa([...byCategory.values()].reduce((s, v) => s + v, 0))} centerLabel="coût total" />
            <ul className="w-full space-y-2">
              {donutSegments.map((s) => (
                <li key={s.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-stone-600">{s.label}</span>
                  </span>
                  <span className="font-semibold text-ink">{fcfa(s.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {/* Top coûts */}
        <Card>
          <CardHeader title="Top 5 des coûts matière / portion" description="Les recettes les plus gourmandes en matière." />
          <div className="p-5">
            {topCosts.length ? (
              <BarList items={topCosts} />
            ) : (
              <p className="text-sm text-stone-400">Aucune recette active pour le moment.</p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Mouvements de prix */}
        <Card>
          <CardHeader
            title="Derniers mouvements de prix"
            description="Variations récentes des prix d’achat — surveillez l’impact sur vos coûts."
            actions={
              can(user.role, 'manageIngredients') || can(user.role, 'updatePrices') ? (
                <Link href="/ingredients" className="text-xs font-bold text-brand-600 hover:text-brand-700">
                  Voir les ingrédients →
                </Link>
              ) : undefined
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="th">Ingrédient</th>
                  <th className="th">Ancien prix</th>
                  <th className="th">Nouveau prix</th>
                  <th className="th">Variation</th>
                  <th className="th">Date</th>
                </tr>
              </thead>
              <tbody>
                {priceMoves.map(({ ing, last, prev, delta }) => (
                  <tr key={ing.id} className="border-b border-stone-50 hover:bg-sand-50">
                    <td className="td">
                      <Link href={`/ingredients/${ing.id}`} className="font-semibold text-ink hover:text-brand-700">
                        {ing.name}
                      </Link>
                    </td>
                    <td className="td text-stone-500">{fcfa(prev.price)}</td>
                    <td className="td font-semibold text-ink">{fcfa(last.price)}</td>
                    <td className="td">
                      <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${delta >= 0 ? 'text-red-600' : 'text-forest-700'}`}>
                        {delta >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                        {pct(Math.abs(delta))}
                      </span>
                    </td>
                    <td className="td text-stone-400">{fmtDate(last.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Alertes food cost */}
        <Card>
          <CardHeader title="Alertes food cost" description={`Recettes au-dessus de ${target} % de ratio matière.`} />
          <div className="space-y-3 p-5">
            {priced
              .filter((x) => ratioStatus(x.cost.foodCostPct, target) !== 'good')
              .sort((a, b) => (b.cost.foodCostPct as number) - (a.cost.foodCostPct as number))
              .slice(0, 6)
              .map(({ recipe, cost }) => {
                const st = ratioStatus(cost.foodCostPct, target);
                return (
                  <Link
                    key={recipe.id}
                    href={`/recettes/${recipe.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-stone-100 px-3.5 py-2.5 transition hover:border-brand-200 hover:bg-brand-50/40"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-stone-700">
                      <AlertTriangle className={`h-4 w-4 ${st === 'bad' ? 'text-red-500' : 'text-amber-500'}`} />
                      {recipe.name}
                    </span>
                    <Badge tone={st === 'bad' ? 'red' : 'amber'}>{pct(cost.foodCostPct)}</Badge>
                  </Link>
                );
              })}
            {priced.every((x) => ratioStatus(x.cost.foodCostPct, target) === 'good') ? (
              <p className="rounded-xl bg-forest-50 px-4 py-3 text-sm font-medium text-forest-800">
                Toutes les recettes actives respectent l’objectif de {target} %.
              </p>
            ) : null}
          </div>
        </Card>
      </div>

      {/* Analyses : KPI carte, ingénierie de menu, alertes prix */}
      <DashboardExtras recipes={extraRows} alerts={priceAlerts} targetPct={target} />
    </div>
  );
}
