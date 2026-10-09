'use server';

import { revalidatePath } from 'next/cache';
import { INGREDIENT_CATEGORIES, type Ingredient, type IngredientCategory } from '@/lib/types';
import { unitById } from '@/lib/units';
import { assertRole } from '@/server/currentUser';
import { getDB, newId, nowISO, saveDB } from '@/server/db';

export interface IngredientPayload {
  name: string;
  category: IngredientCategory;
  unitId: string;
  price: number;
  supplier?: string;
  lossPct?: number;
}

function validateIngredient(data: IngredientPayload): string | null {
  if (!data.name.trim()) return 'Le nom de l’ingrédient est requis.';
  if (!INGREDIENT_CATEGORIES.includes(data.category)) return 'Catégorie invalide.';
  if (!unitById(data.unitId)) return 'Unité d’achat invalide.';
  if (!Number.isFinite(data.price) || data.price <= 0) return 'Le prix doit être un montant positif (FCFA).';
  const loss = data.lossPct ?? 0;
  if (!Number.isFinite(loss) || loss < 0 || loss > 95) return 'Le taux de perte doit être compris entre 0 et 95 %.';
  return null;
}

export async function createIngredientAction(data: IngredientPayload): Promise<{ ok: boolean; id?: string; error?: string }> {
  const guard = await assertRole('admin', 'gestionnaire');
  if (!guard.ok) return guard;
  const err = validateIngredient(data);
  if (err) return { ok: false, error: err };
  const db = getDB();
  const id = newId('ing');
  const ingredient: Ingredient = {
    id,
    name: data.name.trim(),
    category: data.category,
    unitId: data.unitId,
    price: Math.round(data.price),
    supplier: data.supplier?.trim() || undefined,
    lossPct: data.lossPct ?? 0,
    history: [{ price: Math.round(data.price), date: new Date().toISOString().slice(0, 10), note: 'Prix initial' }],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  saveDB({ ...db, ingredients: [...db.ingredients, ingredient] });
  revalidatePath('/ingredients', 'layout');
  return { ok: true, id };
}

export async function updateIngredientAction(id: string, data: IngredientPayload): Promise<{ ok: boolean; error?: string }> {
  const guard = await assertRole('admin', 'gestionnaire');
  if (!guard.ok) return guard;
  const err = validateIngredient(data);
  if (err) return { ok: false, error: err };
  const db = getDB();
  const idx = db.ingredients.findIndex((i) => i.id === id);
  if (idx === -1) return { ok: false, error: 'Ingrédient introuvable.' };
  const existing = db.ingredients[idx];
  const updated: Ingredient = {
    ...existing,
    name: data.name.trim(),
    category: data.category,
    unitId: data.unitId,
    price: Math.round(data.price),
    supplier: data.supplier?.trim() || undefined,
    lossPct: data.lossPct ?? 0,
    updatedAt: nowISO(),
  };
  // Si le prix saisi diffère du dernier historique, on le trace.
  const lastEntry = existing.history[existing.history.length - 1];
  if (!lastEntry || Math.round(data.price) !== lastEntry.price) {
    updated.history = [...existing.history, { price: Math.round(data.price), date: new Date().toISOString().slice(0, 10), note: 'Mise à jour de la fiche' }];
  }
  const ingredients = [...db.ingredients];
  ingredients[idx] = updated;
  saveDB({ ...db, ingredients });
  revalidatePath('/ingredients', 'layout');
  revalidatePath(`/ingredients/${id}`, 'page');
  return { ok: true };
}

export async function recordPriceAction(id: string, price: number, dateISO: string, note?: string): Promise<{ ok: boolean; error?: string }> {
  const guard = await assertRole('admin', 'gestionnaire', 'chef');
  if (!guard.ok) return guard;
  if (!Number.isFinite(price) || price <= 0) return { ok: false, error: 'Le prix doit être un montant positif (FCFA).' };
  if (!dateISO || Number.isNaN(new Date(dateISO).getTime())) return { ok: false, error: 'Date invalide.' };
  const db = getDB();
  const idx = db.ingredients.findIndex((i) => i.id === id);
  if (idx === -1) return { ok: false, error: 'Ingrédient introuvable.' };
  const existing = db.ingredients[idx];
  const history = [...existing.history, { price: Math.round(price), date: dateISO, ...(note?.trim() ? { note: note.trim() } : {}) }];
  history.sort((a, b) => a.date.localeCompare(b.date));
  const ingredients = [...db.ingredients];
  ingredients[idx] = { ...existing, price: Math.round(price), history, updatedAt: nowISO() };
  saveDB({ ...db, ingredients });
  revalidatePath('/ingredients', 'layout');
  revalidatePath(`/ingredients/${id}`, 'page');
  revalidatePath('/dashboard', 'page');
  return { ok: true };
}

export async function deleteIngredientAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const guard = await assertRole('admin', 'gestionnaire');
  if (!guard.ok) return guard;
  const db = getDB();
  const usedBy = db.recipes.filter((r) => r.lines.some((l) => l.ingredientId === id));
  if (usedBy.length > 0) {
    return { ok: false, error: `Suppression impossible : cet ingrédient est utilisé dans ${usedBy.length} recette(s) (${usedBy.map((r) => r.name).join(', ')}).` };
  }
  saveDB({ ...db, ingredients: db.ingredients.filter((i) => i.id !== id) });
  revalidatePath('/ingredients', 'layout');
  return { ok: true };
}
