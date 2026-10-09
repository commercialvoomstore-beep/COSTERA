import type { Metadata } from 'next';
import { DiscoverClient, type PublicDish } from '@/components/discover-client';
import { PublicHeader } from '@/components/public-header';
import { recipeImage } from '@/lib/dish-images';
import { computeNutrition } from '@/lib/nutrition';
import { getDB } from '@/server/db';

export const metadata: Metadata = {
  title: 'Découvrir les menus',
  description: 'Explorez les plats publiés par les chefs COSTERA : gastronomie ivoirienne, cartes de restaurants et menus de réception.',
};

// La vitrine reflète les publications en direct : rendu dynamique.
export const dynamic = 'force-dynamic';

export default function DiscoverPage() {
  const db = getDB();
  const recipeById = new Map(db.recipes.map((r) => [r.id, r]));
  const ingredientById = new Map(db.ingredients.map((i) => [i.id, i]));

  // Vitrine publique : plats issus des menus EXPLICITEMENT publiés.
  // Chaque plat est indépendant : une carte unique, dédupliquée.
  const seen = new Set<string>();
  const dishes: PublicDish[] = [];
  for (const menu of db.menus.filter((m) => m.published === true)) {
    for (const section of menu.sections) {
      for (const rid of section.recipeIds) {
        const r = recipeById.get(rid);
        if (!r || seen.has(r.id)) continue;
        seen.add(r.id);
        dishes.push({
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
        });
      }
    }
  }

  return (
    <main className="min-h-screen bg-ivory">
      <PublicHeader />
      <DiscoverClient dishes={dishes} />
    </main>
  );
}
