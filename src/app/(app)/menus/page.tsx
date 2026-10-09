import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { MenusClient, type MenuCard } from '@/components/menus-client';
import { PageHeader } from '@/components/ui';
import { getSessionUserId } from '@/lib/auth';
import { costOfRecipe } from '@/lib/foodcost';
import { getDB } from '@/server/db';

export const metadata: Metadata = { title: 'Menus' };

export default async function MenusPage() {
  const userId = await getSessionUserId();
  const db = getDB();
  const user = db.users.find((u) => u.id === userId);
  if (!user) redirect('/login');

  const ingMap = new Map(db.ingredients.map((i) => [i.id, i]));
  const recipeById = new Map(db.recipes.map((r) => [r.id, r]));

  const menus: MenuCard[] = db.menus.map((m) => {
    const recipeIds = [...new Set(m.sections.flatMap((s) => s.recipeIds))];
    const recipes = recipeIds.map((id) => recipeById.get(id)).filter((r) => r !== undefined);
    const costs = recipes.map((r) => costOfRecipe(r, ingMap));
    const avgPerPortion = costs.length ? costs.reduce((s, c) => s + c.perPortion, 0) / costs.length : null;
    const priced = costs.filter((c) => c.foodCostPct !== null);
    const avgFoodCostPct = priced.length ? priced.reduce((s, c) => s + (c.foodCostPct as number), 0) / priced.length : null;
    return {
      id: m.id,
      name: m.name,
      description: m.description,
      dishCount: recipeIds.length,
      sectionTitles: m.sections.map((s) => s.title),
      avgPerPortion,
      avgFoodCostPct,
    };
  });

  const recipes = db.recipes
    .filter((r) => r.status === 'active')
    .map((r) => ({ id: r.id, name: r.name, category: r.category }))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));

  return (
    <div>
      <PageHeader
        title="Menus"
        description="Composez vos cartes par sections et suivez la rentabilité de chaque menu, plat par plat."
      />
      <MenusClient menus={menus} recipes={recipes} role={user.role} />
    </div>
  );
}
