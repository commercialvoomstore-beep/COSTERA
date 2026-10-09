import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertTriangle, Pencil } from 'lucide-react';
import { DeleteRecipeButton } from '@/components/delete-buttons';
import { PrintButton } from '@/components/print-button';
import { Badge, Card, CardHeader, LinkButton, StatusBadge } from '@/components/ui';
import { getSessionUserId } from '@/lib/auth';
import { coef, fcfa, fmtDate, num, pct } from '@/lib/format';
import { costOfRecipe, ratioStatus, suggestedPrice } from '@/lib/foodcost';
import { can } from '@/lib/roles';
import { unitAbbr } from '@/lib/units';
import { getDB } from '@/server/db';

export const metadata: Metadata = { title: 'Recette' };

export default async function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDB();
  const userId = await getSessionUserId();
  const user = db.users.find((u) => u.id === userId);
  const recipe = db.recipes.find((r) => r.id === id);
  if (!user || !recipe) notFound();

  const ingMap = new Map(db.ingredients.map((i) => [i.id, i]));
  const cost = costOfRecipe(recipe, ingMap);
  const target = db.settings.targetFoodCostPct;
  const ratio = ratioStatus(cost.foodCostPct, target);
  const recommended = suggestedPrice(cost.perPortion, target);
  const canManage = can(user.role, 'manageRecipes');

  const inMenus = db.menus.filter((m) => m.sections.some((s) => s.recipeIds.includes(recipe.id)));

  return (
    <div>
      <Link href="/recettes" className="mb-4 inline-flex text-sm font-semibold text-stone-500 hover:text-ink">
        ← Toutes les recettes
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-ink">{recipe.name}</h1>
            <StatusBadge status={recipe.status} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone="brand">{recipe.category}</Badge>
            <Badge tone="neutral">{recipe.portions} portion{recipe.portions > 1 ? 's' : ''}</Badge>
            <Badge tone="neutral">Fiche du {fmtDate(recipe.createdAt)}</Badge>
          </div>
          {recipe.notes ? <p className="mt-3 max-w-xl text-sm italic text-stone-500">« {recipe.notes} »</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PrintButton />
          {canManage ? (
            <>
              <LinkButton href={`/recettes/${recipe.id}/modifier`} variant="primary">
                <Pencil className="h-4 w-4" />
                Modifier
              </LinkButton>
              <DeleteRecipeButton id={recipe.id} />
            </>
          ) : null}
        </div>
      </div>

      {/* Indicateurs */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Coût total</p>
          <p className="mt-1 text-xl font-black text-ink">{fcfa(cost.total)}</p>
          <p className="text-xs text-stone-400">{recipe.portions} portion{recipe.portions > 1 ? 's' : ''}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Coût / portion</p>
          <p className="mt-1 text-xl font-black text-brand-600">{fcfa(cost.perPortion)}</p>
          <p className="text-xs text-stone-400">matière première</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Food cost</p>
          <p className={`mt-1 text-xl font-black ${ratio === 'good' ? 'text-forest-700' : ratio === 'warn' ? 'text-amber-600' : ratio === 'bad' ? 'text-red-600' : 'text-ink'}`}>
            {pct(cost.foodCostPct)}
          </p>
          <p className="text-xs text-stone-400">objectif {target} %</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Marge / portion</p>
          <p className={`mt-1 text-xl font-black ${cost.margin < 0 ? 'text-red-600' : 'text-forest-700'}`}>{fcfa(cost.margin)}</p>
          <p className="text-xs text-stone-400">prix de vente {recipe.salePrice > 0 ? fcfa(recipe.salePrice) : '—'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Coefficient</p>
          <p className="mt-1 text-xl font-black text-ink">{coef(cost.coefficient)}</p>
          <p className="text-xs text-stone-400">prix ÷ coût matière</p>
        </Card>
      </div>

      {ratio === 'bad' ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div className="text-sm text-red-800">
            <p className="font-bold">Cette recette dépasse largement l’objectif de {target} % de food cost.</p>
            <p className="mt-0.5">
              Prix conseillé pour revenir à l’objectif : <strong>{recommended ? fcfa(recommended) : '—'}</strong> par portion
              (actuellement {recipe.salePrice > 0 ? fcfa(recipe.salePrice) : 'aucun prix défini'}).
            </p>
          </div>
        </div>
      ) : ratio === 'warn' ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <span className="font-bold">Food cost au-dessus de l’objectif :</span> prix conseillé pour {target} % :{' '}
          <strong>{recommended ? fcfa(recommended) : '—'}</strong> par portion.
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* Ingrédients */}
        <Card>
          <CardHeader title={`Ingrédients (${recipe.lines.length})`} description="Quantités, conversions d’unités et coût par ligne, perte incluse." />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="th">Ingrédient</th>
                  <th className="th">Quantité</th>
                  <th className="th">PU</th>
                  <th className="th">Coût</th>
                </tr>
              </thead>
              <tbody>
                {recipe.lines.map((l) => {
                  const ing = ingMap.get(l.ingredientId);
                  const lc = cost.lines.find((x) => x.lineId === l.id);
                  if (!ing) return null;
                  return (
                    <tr key={l.id} className="border-b border-stone-50">
                      <td className="td">
                        <Link href={`/ingredients/${ing.id}`} className="font-semibold text-ink hover:text-brand-700">
                          {ing.name}
                        </Link>
                        {l.note ? <p className="text-xs text-stone-400">{l.note}</p> : null}
                      </td>
                      <td className="td whitespace-nowrap text-stone-600">
                        {num(l.qty)} {unitAbbr(l.unitId)}
                        {lc && lc.valid && lc.qtyInPurchaseUnit !== l.qty ? (
                          <span className="block text-[11px] text-stone-400">≈ {num(lc.qtyInPurchaseUnit)} {unitAbbr(ing.unitId)}</span>
                        ) : null}
                      </td>
                      <td className="td whitespace-nowrap text-stone-500">
                        {fcfa(ing.price)} / {unitAbbr(ing.unitId)}
                        {ing.lossPct > 0 ? <span className="block text-[11px] text-stone-400">perte {ing.lossPct} %</span> : null}
                      </td>
                      <td className="td whitespace-nowrap font-bold text-ink">{lc ? fcfa(lc.cost) : '—'}</td>
                    </tr>
                  );
                })}
                <tr>
                  <td className="td font-black text-ink" colSpan={3}>
                    Coût matière total
                  </td>
                  <td className="td font-black text-brand-600">{fcfa(cost.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          {/* Progression */}
          <Card>
            <CardHeader title="Progression" description={`${recipe.steps.length} étape(s)`} />
            <ol className="space-y-3 p-5">
              {recipe.steps.length === 0 ? <p className="text-sm text-stone-400">Aucune étape renseignée.</p> : null}
              {recipe.steps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-black text-brand-700">{i + 1}</span>
                  <p className="text-sm leading-relaxed text-stone-700">{s}</p>
                </li>
              ))}
            </ol>
          </Card>

          {/* Présence dans les menus */}
          <Card>
            <CardHeader title="Présence dans les menus" />
            <div className="p-5">
              {inMenus.length === 0 ? (
                <p className="text-sm text-stone-400">Cette recette n’apparaît dans aucun menu.</p>
              ) : (
                <ul className="space-y-2">
                  {inMenus.map((m) => (
                    <li key={m.id}>
                      <Link href={`/menus/${m.id}`} className="block rounded-xl border border-stone-100 px-3.5 py-2.5 text-sm font-semibold text-ink transition hover:border-brand-200 hover:bg-brand-50/40">
                        {m.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
