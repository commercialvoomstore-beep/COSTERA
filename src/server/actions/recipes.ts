'use server';

import { revalidatePath } from 'next/cache';
import { RECIPE_CATEGORIES, type Recipe, type RecipeCategory, type RecipeStatus } from '@/lib/types';
import { assertRole } from '@/server/currentUser';
import { getDB, newId, nowISO, saveDB } from '@/server/db';

export interface RecipePayload {
  id?: string;
  name: string;
  category: RecipeCategory;
  portions: number;
  salePrice: number;
  status: RecipeStatus;
  lines: { ingredientId: string; qty: number; unitId: string; note?: string }[];
  steps: string[];
  notes?: string;
}

function validateRecipe(data: RecipePayload): string | null {
  if (!data.name.trim()) return 'Le nom de la recette est requis.';
  if (!RECIPE_CATEGORIES.includes(data.category)) return 'Catégorie invalide.';
  if (!Number.isInteger(data.portions) || data.portions < 1) return 'Le nombre de portions doit être un entier ≥ 1.';
  if (!Number.isFinite(data.salePrice) || data.salePrice < 0) return 'Le prix de vente doit être positif ou nul.';
  if (!data.lines.length) return 'Ajoutez au moins un ingrédient à la fiche technique.';
  for (const l of data.lines) {
    if (!Number.isFinite(l.qty) || l.qty <= 0) return 'Chaque ligne doit avoir une quantité strictement positive.';
  }
  if (!['active', 'brouillon', 'archivee'].includes(data.status)) return 'Statut invalide.';
  return null;
}

export async function saveRecipeAction(data: RecipePayload): Promise<{ ok: boolean; id?: string; error?: string }> {
  const guard = await assertRole('admin', 'gestionnaire', 'chef');
  if (!guard.ok) return guard;
  const err = validateRecipe(data);
  if (err) return { ok: false, error: err };
  const db = getDB();
  const ingredientIds = new Set(db.ingredients.map((i) => i.id));
  for (const l of data.lines) {
    if (!ingredientIds.has(l.ingredientId)) return { ok: false, error: 'Un ingrédient sélectionné n’existe plus.' };
  }

  const lines = data.lines.map((l) => ({
    id: newId('line'),
    ingredientId: l.ingredientId,
    qty: l.qty,
    unitId: l.unitId,
    ...(l.note?.trim() ? { note: l.note.trim() } : {}),
  }));
  const steps = data.steps.map((s) => s.trim()).filter(Boolean);

  if (data.id) {
    const idx = db.recipes.findIndex((r) => r.id === data.id);
    if (idx === -1) return { ok: false, error: 'Recette introuvable.' };
    const updated: Recipe = {
      ...db.recipes[idx],
      name: data.name.trim(),
      category: data.category,
      portions: data.portions,
      salePrice: Math.round(data.salePrice),
      status: data.status,
      lines,
      steps,
      notes: data.notes?.trim() || undefined,
      updatedAt: nowISO(),
    };
    const recipes = [...db.recipes];
    recipes[idx] = updated;
    saveDB({ ...db, recipes });
  } else {
    const id = newId('rec');
    const recipe: Recipe = {
      id,
      name: data.name.trim(),
      category: data.category,
      portions: data.portions,
      salePrice: Math.round(data.salePrice),
      status: data.status,
      lines,
      steps,
      notes: data.notes?.trim() || undefined,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    saveDB({ ...db, recipes: [...db.recipes, recipe] });
  }
  revalidatePath('/recettes', 'layout');
  revalidatePath('/dashboard', 'page');
  revalidatePath('/menus', 'layout');
  return { ok: true, id: data.id ?? undefined };
}

export async function deleteRecipeAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const guard = await assertRole('admin', 'gestionnaire', 'chef');
  if (!guard.ok) return guard;
  const db = getDB();
  const menus = db.menus.map((m) => ({
    ...m,
    sections: m.sections.map((s) => ({ ...s, recipeIds: s.recipeIds.filter((rid) => rid !== id) })),
  }));
  saveDB({ ...db, recipes: db.recipes.filter((r) => r.id !== id), menus });
  revalidatePath('/recettes', 'layout');
  revalidatePath('/menus', 'layout');
  revalidatePath('/dashboard', 'page');
  return { ok: true };
}
