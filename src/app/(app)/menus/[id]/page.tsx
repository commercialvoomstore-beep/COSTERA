import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { DeleteMenuButton } from '@/components/delete-buttons';
import { MenuEditModal } from '@/components/menu-edit-modal';
import { Badge, Card, PageHeader } from '@/components/ui';
import { getSessionUserId } from '@/lib/auth';
import { coef, fcfa, num, pct } from '@/lib/format';
import { costOfRecipe, ratioStatus } from '@/lib/foodcost';
import { can } from '@/lib/roles';
import { getDB } from '@/server/db';

export const metadata: Metadata = { title: 'Menu' };

export default async function MenuDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDB();
  const userId = await getSessionUserId();
  const user = db.users.find((u) => u.id === userId);
  const menu = db.menus.find((m) => m.id === id);
  if (!user || !menu) notFound();

  const ingMap = new Map(db.ingredients.map((i) => [i.id, i]));
  const recipeById = new Map(db.recipes.map((r) => [r.id, r]));
  const target = db.settings.targetFoodCostPct;
  const canManage = can(user.role, 'manageMenus');

  const allRecipeIds = [...new Set(menu.sections.flatMap((s) => s.recipeIds))];
  const costs = allRecipeIds.map((rid) => {
    const r = recipeById.get(rid);
    return r ? costOfRecipe(r, ingMap) : null;
  }).filter((c) => c !== null);
  const avgPct = costs.filter((c) => c.foodCostPct !== null);
  const avgFoodCost = avgPct.length ? avgPct.reduce((s, c) => s + (c.foodCostPct as number), 0) / avgPct.length : null;
  const totalRevenue = allRecipeIds.reduce((s, rid) => s + (recipeById.get(rid)?.salePrice ?? 0), 0);
  const totalCost = allRecipeIds.reduce((s, rid) => {
    const r = recipeById.get(rid);
    return r ? s + costOfRecipe(r, ingMap).perPortion : s;
  }, 0);

  return (
    <div>
      <Link href="/menus" className="mb-4 inline-flex text-sm font-semibold text-stone-500 hover:text-ink">
        ← Tous les menus
      </Link>
      <PageHeader
        title={menu.name}
        description={menu.description}
        actions={
          canManage ? (
            <>
              <MenuEditModal
                initial={{
                  id: menu.id,
                  name: menu.name,
                  description: menu.description,
                  sections: menu.sections,
                }}
                recipes={db.recipes.filter((r) => r.status === 'active').map((r) => ({ id: r.id, name: r.name, category: r.category }))}
              />
              <DeleteMenuButton id={menu.id} />
            </>
          ) : undefined
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Plats au menu</p>
          <p className="mt-1 text-3xl font-black text-ink">{allRecipeIds.length}</p>
          <p className="text-xs text-stone-400">{menu.sections.length} section(s)</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Food cost moyen du menu</p>
          <p className={`mt-1 text-3xl font-black ${avgFoodCost === null ? 'text-ink' : avgFoodCost <= target ? 'text-forest-700' : avgFoodCost <= target + 8 ? 'text-amber-600' : 'text-red-600'}`}>
            {pct(avgFoodCost)}
          </p>
          <p className="text-xs text-stone-400">objectif {target} %</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Matière vs vente (1× chaque plat)</p>
          <p className="mt-1 text-3xl font-black text-ink">{totalRevenue > 0 ? pct(totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : null) : '—'}</p>
          <p className="text-xs text-stone-400">
            {fcfa(totalCost)} de matière pour {fcfa(totalRevenue)} de vente
          </p>
        </Card>
      </div>

      <div className="space-y-5">
        {menu.sections.map((sec) => (
          <Card key={sec.id}>
            <div className="border-b border-stone-100 px-5 py-4">
              <h3 className="text-sm font-bold uppercase tracking-wide text-stone-500">{sec.title}</h3>
            </div>
            {sec.recipeIds.length === 0 ? (
              <p className="px-5 py-6 text-sm text-stone-400">Aucun plat dans cette section.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px]">
                  <thead>
                    <tr className="border-b border-stone-100">
                      <th className="th">Plat</th>
                      <th className="th">Coût / portion</th>
                      <th className="th">Prix de vente</th>
                      <th className="th">Food cost</th>
                      <th className="th">Marge</th>
                      <th className="th">Coefficient</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sec.recipeIds.map((rid) => {
                      const r = recipeById.get(rid);
                      if (!r) return null;
                      const cost = costOfRecipe(r, ingMap);
                      const st = ratioStatus(cost.foodCostPct, target);
                      return (
                        <tr key={rid} className="border-b border-stone-50 transition hover:bg-sand-50">
                          <td className="td">
                            <Link href={`/recettes/${r.id}`} className="font-semibold text-ink hover:text-brand-700">
                              {r.name}
                            </Link>
                            <p className="text-xs text-stone-400">{r.category}</p>
                          </td>
                          <td className="td whitespace-nowrap font-semibold text-ink">{fcfa(cost.perPortion)}</td>
                          <td className="td whitespace-nowrap text-stone-600">{r.salePrice > 0 ? fcfa(r.salePrice) : '—'}</td>
                          <td className="td">
                            {cost.foodCostPct !== null ? (
                              <Badge tone={st === 'good' ? 'green' : st === 'warn' ? 'amber' : 'red'}>{pct(cost.foodCostPct)}</Badge>
                            ) : (
                              <span className="text-xs text-stone-300">—</span>
                            )}
                          </td>
                          <td className="td whitespace-nowrap text-stone-600">{r.salePrice > 0 ? fcfa(cost.margin) : '—'}</td>
                          <td className="td whitespace-nowrap text-stone-600">{cost.coefficient !== null ? num(cost.coefficient) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
