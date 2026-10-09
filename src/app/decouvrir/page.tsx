import type { Metadata } from 'next';
import { DiscoverClient, type PublicMenu } from '@/components/discover-client';
import { PublicHeader } from '@/components/public-header';
import { recipeImage } from '@/lib/dish-images';
import { costOfRecipe } from '@/lib/foodcost';
import { recipeAllergens } from '@/lib/costing-engine';
import { computeNutrition } from '@/lib/nutrition';
import { getSessionUserId } from '@/lib/auth';
import { getDB } from '@/server/db';

export const metadata: Metadata = {
  title: 'Découvrir les menus',
  description: 'Explorez les cartes publiées par les chefs COSTERA : gastronomie ivoirienne, cartes de restaurants et menus de réception.',
};

// La vitrine reflète les publications en direct : rendu dynamique.
export const dynamic = 'force-dynamic';

export default async function DiscoverPage() {
  const db = getDB();
  const recipeById = new Map(db.recipes.map((r) => [r.id, r]));
  const ingredientById = new Map(db.ingredients.map((i) => [i.id, i]));

  const userId = await getSessionUserId();
  const viewerRole = userId ? (db.users.find((u) => u.id === userId)?.role ?? null) : null;

  // Vitrine publique : uniquement les menus EXPLICITEMENT publiés.
  const menus: PublicMenu[] = db.menus
    .filter((m) => m.published === true)
    .map((m) => {
      const seen = new Set<string>();
      const dishes = m.sections.flatMap((s) =>
        s.recipeIds
          .map((rid) => recipeById.get(rid))
          .filter((r): r is NonNullable<typeof r> => {
            if (!r || seen.has(r.id)) return false;
            seen.add(r.id);
            return true;
          })
          .map((r) => {
            const cost = costOfRecipe(r, ingredientById);
            return {
              id: r.id,
              name: r.name,
              category: r.category,
              price: r.salePrice,
              image: recipeImage(r.id, r.category),
              description: r.description ?? '',
              cookTimeMin: r.cookTimeMin,
              chef: r.chef,
              portions: r.portions,
              nutrition: computeNutrition(r, ingredientById),
              allergens: recipeAllergens(r, ingredientById),
              foodCostPct: cost.foodCostPct,
              margin: cost.margin,
            };
          }),
      );
      return {
        id: m.id,
        name: m.name,
        description: m.description,
        cover: dishes[0]?.image ?? '/dishes/hero-table.jpg',
        dishes,
      };
    });

  return (
    <main className="min-h-screen bg-ivory">
      <PublicHeader current="decouvrir" />
      <DiscoverClient menus={menus} viewerRole={viewerRole} />
    </main>
  );
}
