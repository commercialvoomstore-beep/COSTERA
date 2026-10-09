import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { RecipeForm } from '@/components/forms/RecipeForm';
import { getSessionUserId } from '@/lib/auth';
import { getDB } from '@/server/db';

export const metadata: Metadata = { title: 'Nouvelle recette' };

export default async function NewRecipePage() {
  const userId = await getSessionUserId();
  const db = getDB();
  const user = db.users.find((u) => u.id === userId);
  if (!user || !['admin', 'gestionnaire', 'chef'].includes(user.role)) notFound();

  const ingredients = db.ingredients
    .map((i) => ({ id: i.id, name: i.name, unitId: i.unitId, price: i.price, lossPct: i.lossPct }))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));

  return (
    <div>
      <Link href="/recettes" className="mb-4 inline-flex text-sm font-semibold text-stone-500 hover:text-ink">
        ← Toutes les recettes
      </Link>
      <h1 className="mb-1 text-2xl font-black tracking-tight text-ink">Nouvelle fiche technique</h1>
      <p className="mb-6 text-sm text-stone-500">Le coût matière se calcule en direct pendant la saisie.</p>
      <RecipeForm ingredients={ingredients} targetPct={db.settings.targetFoodCostPct} />
    </div>
  );
}
