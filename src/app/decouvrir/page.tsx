import type { Metadata } from 'next';
import { DiscoverClient, type PublicMenuRow } from '@/components/discover-client';
import { PublicHeader } from '@/components/public-header';
import { recipeImage } from '@/lib/dish-images';
import { getDB } from '@/server/db';

export const metadata: Metadata = {
  title: 'Découvrir les menus',
  description: 'Explorez les menus publiés par les chefs COSTERA : gastronomie ivoirienne, cartes de restaurants et menus de réception.',
};

// La vitrine reflète les publications en direct : rendu dynamique.
export const dynamic = 'force-dynamic';

export default function DiscoverPage() {
  const db = getDB();
  const recipeById = new Map(db.recipes.map((r) => [r.id, r]));

  // Vitrine publique : uniquement les menus EXPLICITEMENT publiés.
  const rows: PublicMenuRow[] = db.menus
    .filter((m) => m.published === true)
    .map((m) => {
      const sections = m.sections.map((s) => ({
        title: s.title,
        dishes: s.recipeIds
          .map((rid) => recipeById.get(rid))
          .filter((r) => r !== undefined)
          .map((r) => ({
            id: r.id,
            name: r.name,
            category: r.category,
            price: r.salePrice,
            image: recipeImage(r.id, r.category),
          })),
      }));
      const allDishes = sections.flatMap((s) => s.dishes);
      return {
        id: m.id,
        name: m.name,
        description: m.description,
        sections,
        dishCount: allDishes.length,
        categories: [...new Set(allDishes.map((d) => d.category))],
        cover: allDishes[0]?.image ?? '/dishes/hero-table.jpg',
      };
    });

  return (
    <main className="min-h-screen bg-ivory">
      <PublicHeader />
      <DiscoverClient menus={rows} />
    </main>
  );
}
