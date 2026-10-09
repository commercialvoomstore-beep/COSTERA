import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { RecipesClient, type RecipeRow } from '@/components/recipes-client';
import { LinkButton, PageHeader } from '@/components/ui';
import { getSessionUserId } from '@/lib/auth';
import { costOfRecipe, ratioStatus } from '@/lib/foodcost';
import { getDB } from '@/server/db';

export const metadata: Metadata = { title: 'Recettes' };

export default async function RecipesPage() {
  const userId = await getSessionUserId();
  const db = getDB();
  const user = db.users.find((u) => u.id === userId);
  if (!user) redirect('/login');

  const ingMap = new Map(db.ingredients.map((i) => [i.id, i]));
  const rows: RecipeRow[] = db.recipes.map((r) => {
    const cost = costOfRecipe(r, ingMap);
    return {
      id: r.id,
      name: r.name,
      category: r.category,
      status: r.status,
      portions: r.portions,
      salePrice: r.salePrice,
      perPortion: cost.perPortion,
      foodCostPct: cost.foodCostPct,
      ratio: ratioStatus(cost.foodCostPct, db.settings.targetFoodCostPct),
      ingredientsCount: r.lines.length,
    };
  });

  return (
    <div>
      <PageHeader
        title="Fiches techniques"
        description="Chaque recette est chiffrée automatiquement : coût matière, food cost, marge et coefficient — recalculés à chaque variation de prix."
        actions={
          <LinkButton href="/recettes/nouvelle">
            <Plus className="h-4 w-4" />
            Nouvelle recette
          </LinkButton>
        }
      />
      <RecipesClient rows={rows} targetPct={db.settings.targetFoodCostPct} />
    </div>
  );
}
