import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { IngredientsClient, type IngredientRow } from '@/components/ingredients-client';
import { PageHeader } from '@/components/ui';
import { getSessionUserId } from '@/lib/auth';
import { priceDeltaPct } from '@/lib/foodcost';
import { unitAbbr } from '@/lib/units';
import { getDB } from '@/server/db';

export const metadata: Metadata = { title: 'Ingrédients' };

export default async function IngredientsPage() {
  const userId = await getSessionUserId();
  const db = getDB();
  const user = db.users.find((u) => u.id === userId);
  if (!user) redirect('/login');

  const rows: IngredientRow[] = db.ingredients.map((ing) => {
    const h = ing.history;
    const deltaPct = h.length >= 2 ? priceDeltaPct(h[h.length - 2].price, h[h.length - 1].price) : null;
    const recipeCount = db.recipes.filter((r) => r.lines.some((l) => l.ingredientId === ing.id)).length;
    return {
      id: ing.id,
      name: ing.name,
      category: ing.category,
      unitAbbr: unitAbbr(ing.unitId),
      price: ing.price,
      supplier: ing.supplier,
      recipeCount,
      updatedAt: ing.updatedAt,
      deltaPct,
    };
  });

  return (
    <div>
      <PageHeader
        title="Ingrédients"
        description="Votre référentiel d’achat : prix du marché, fournisseurs, unités et taux de perte. Les prix alimentent le coût matière des recettes en temps réel."
      />
      <IngredientsClient rows={rows} role={user.role} />
    </div>
  );
}
