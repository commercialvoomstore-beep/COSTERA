import type { Metadata } from 'next';
import { InventoryTool, type InventoryRow } from '@/components/inventory-tool';
import { PrintButton } from '@/components/print-button';
import { Badge, Card, CardHeader, PageHeader } from '@/components/ui';
import { recipeAllergens } from '@/lib/costing-engine';
import { computeNutrition } from '@/lib/nutrition';
import { costOfRecipe } from '@/lib/foodcost';
import { unitAbbr } from '@/lib/units';
import { fcfa, pct } from '@/lib/format';
import { getSessionUserId } from '@/lib/auth';
import { getDB } from '@/server/db';

export const metadata: Metadata = { title: 'Rapports' };

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

export default async function RapportsPage() {
  const db = getDB();
  await getSessionUserId();
  const ingMap = new Map(db.ingredients.map((i) => [i.id, i]));
  const now = new Date();

  const active = db.recipes.filter((r) => r.status === 'active');
  const rows = active.map((r) => ({ recipe: r, cost: costOfRecipe(r, ingMap) }));
  const priced = rows.filter((x) => x.cost.foodCostPct !== null);
  const avgFc = priced.length ? priced.reduce((s, x) => s + (x.cost.foodCostPct as number), 0) / priced.length : null;
  const totalCost = rows.reduce((s, x) => s + x.cost.total, 0);
  const totalMargin = priced.reduce((s, x) => s + x.cost.margin, 0);

  const mois = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  // Inventaire & consommation : consommation THÉORIQUE hebdomadaire par
  // ingrédient = somme (quantité convertie en unité d'achat × ventes/semaine)
  // sur les recettes actives. Ventes hebdo simulées (démo, mêmes chiffres
  // que l'ingénierie de menu du tableau de bord).
  const theoretical = new Map<string, number>();
  active.forEach((r, i) => {
    const sold = 12 + ((i * 13) % 49);
    const cost = costOfRecipe(r, ingMap);
    for (const line of cost.lines) {
      const rec = r.lines.find((l) => l.id === line.lineId);
      if (!rec || !line.valid) continue;
      theoretical.set(rec.ingredientId, (theoretical.get(rec.ingredientId) ?? 0) + line.qtyInPurchaseUnit * sold);
    }
  });
  const inventoryRows: InventoryRow[] = [...theoretical.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([ingId, theo]) => {
      const ing = ingMap.get(ingId);
      return {
        ingredientId: ingId,
        name: ing?.name ?? ingId,
        unitLabel: ing ? unitAbbr(ing.unitId) : '',
        theoretical: Math.round(theo * 10) / 10,
      };
    });

  return (
    <div className="print-sheet">
      <div className="print-only mb-8 border-b-2 border-gold-500 pb-4">
        <p className="font-display text-2xl font-black tracking-tight text-royal-900">COSTERA</p>
        <p className="mt-1 text-xs uppercase tracking-[0.25em] text-stone-500">
          Rapport de synthèse — {mois} · Hôtel de gestion COSTERA · Côte d'Ivoire
        </p>
      </div>

      <div className="flex items-center justify-between">
        <PageHeader
          title="Rapport mensuel de synthèse"
          description="Situation des coûts, marges et conformité des fiches techniques actives."
        />
        <div className="print-hidden hidden lg:block">
          <PrintButton />
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-4 print:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Fiches actives</p>
          <p className="mt-1 text-2xl font-black text-ink tabular-nums">{rows.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Food cost moyen</p>
          <p className={`mt-1 text-2xl font-black tabular-nums ${avgFc !== null && avgFc <= db.settings.targetFoodCostPct ? 'text-forest-700' : 'text-red-600'}`}>
            {avgFc === null ? '—' : pct(avgFc, 2)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Coût matière cumulé</p>
          <p className="mt-1 text-2xl font-black text-ink tabular-nums">{fcfa(totalCost)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Marge cumulée</p>
          <p className="mt-1 text-2xl font-black text-forest-700 tabular-nums">{fcfa(totalMargin)}</p>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Détail par fiche" description="Coût par portion, prix de vente, food cost et marge — calculs en temps réel." />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-stone-100 text-left">
                <th className="th">Recette</th>
                <th className="th">Catégorie</th>
                <th className="th">Coût / portion</th>
                <th className="th">Prix de vente</th>
                <th className="th">Food cost</th>
                <th className="th">Marge / portion</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ recipe, cost }) => (
                <tr key={recipe.id} className="border-b border-stone-50">
                  <td className="td font-semibold text-ink">{recipe.name}</td>
                  <td className="td text-stone-500">{recipe.category}</td>
                  <td className="td tabular-nums">{fcfa(cost.perPortion)}</td>
                  <td className="td tabular-nums">{recipe.salePrice > 0 ? fcfa(recipe.salePrice) : '—'}</td>
                  <td className="td">
                    {cost.foodCostPct !== null ? <Badge tone={cost.foodCostPct > 35 ? 'red' : cost.foodCostPct > db.settings.targetFoodCostPct ? 'amber' : 'green'}>{pct(cost.foodCostPct)}</Badge> : '—'}
                  </td>
                  <td className="td tabular-nums">{fcfa(cost.margin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Inventaire & consommation */}
      <Card className="mt-6">
        <CardHeader
          title="Inventaire & consommation"
          description="Consommation réelle (initial + achats − final) comparée à la consommation théorique issue des fiches actives."
        />
        <div className="p-5">
          <InventoryTool rows={inventoryRows} />
        </div>
      </Card>

      {/* Conformité : allergènes et allergisants */}
      <Card className="mt-6">
        <CardHeader title="Conformité — allergènes identifiés" description="Union automatique des allergènes des ingrédients de chaque fiche." />
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {rows.map(({ recipe }) => {
            const allergens = recipeAllergens(recipe, ingMap);
            const nut = computeNutrition(recipe, ingMap);
            return (
              <div key={recipe.id} className="rounded-2xl border border-stone-100 p-4">
                <p className="text-sm font-bold text-ink">{recipe.name}</p>
                <p className="mt-0.5 text-[11px] text-stone-400 tabular-nums">{nut.kcal} kcal / portion</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {allergens.length === 0 && <span className="text-xs font-medium text-forest-700">Aucun allergène majeur identifié</span>}
                  {allergens.map((a) => (
                    <span key={a} className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: ALLERGEN_COLORS[a] ?? '#8347BD' }}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="print-only mt-10 border-t border-stone-200 pt-3 text-center text-[10px] text-stone-400">
        Généré le {now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} · © COSTERA — VOOMNET FORMATION · Côte d'Ivoire · FCFA
      </div>
    </div>
  );
}
