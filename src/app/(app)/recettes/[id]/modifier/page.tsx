import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { RecipeForm } from '@/components/forms/RecipeForm';
import { getSessionUserId } from '@/lib/auth';
import { getDB } from '@/server/db';

export const metadata: Metadata = { title: 'Modifier la recette' };

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getSessionUserId();
  const db = getDB();
  const user = db.users.find((u) => u.id === userId);
  const recipe = db.recipes.find((r) => r.id === id);
  if (!user || !recipe || !['admin', 'gestionnaire', 'chef'].includes(user.role)) notFound();

  const ingredients = db.ingredients
    .map((i) => ({ id: i.id, name: i.name, unitId: i.unitId, price: i.price, lossPct: i.lossPct }))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));

  return (
    <div>
      <Link href={`/recettes/${recipe.id}`} className="mb-4 inline-flex text-sm font-semibold text-stone-500 hover:text-ink">
        ← Retour à la fiche
      </Link>
      <h1 className="mb-1 text-2xl font-black tracking-tight text-ink">Modifier « {recipe.name} »</h1>
      <p className="mb-6 text-sm text-stone-500">Les modifications recalculent instantanément le coût matière et le food cost.</p>
      <RecipeForm
        ingredients={ingredients}
        targetPct={db.settings.targetFoodCostPct}
        initial={{
          id: recipe.id,
          name: recipe.name,
          category: recipe.category,
          portions: recipe.portions,
          salePrice: recipe.salePrice,
          status: recipe.status,
          notes: recipe.notes,
          steps: recipe.steps,
          lines: recipe.lines,
        }}
      />
    </div>
  );
}
