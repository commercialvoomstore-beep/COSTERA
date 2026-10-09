'use server';

// COSTERA — Plats / menus (soumis au quota de création). Le quota est
// vérifié CÔTÉ SERVEUR : la création est bloquée si la limite est atteinte,
// et le niveau d'accès est validé. Les plats existants ne sont jamais
// supprimés lors d'un changement de forfait.
import { revalidatePath } from 'next/cache';
import type { Dish, PlanLevel, VideoInfo } from '@/lib/types';
import { getCurrentUser } from '@/server/currentUser';
import { getDB, newId, nowISO, saveDB } from '@/server/db';
import { checkDishQuota } from '@/server/planService';
import { saveImageFile } from '@/server/uploads';

export interface DishPayload {
  id?: string;
  cardId: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  level: PlanLevel;
  allergens: string[];
  recipeId?: string;
  status: Dish['status'];
  video?: VideoInfo;
}

export interface DishResult {
  ok: boolean;
  id?: string;
  error?: string;
  /** true si le refus est dû au quota (déclenche la fenêtre « passer au niveau supérieur »). */
  quotaExceeded?: boolean;
  used?: number;
  limit?: number;
  plan?: string;
}

export async function saveDishAction(data: DishPayload): Promise<DishResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Session expirée. Veuillez vous reconnecter.' };
  if (!data.name.trim()) return { ok: false, error: 'Le nom du plat est requis.' };
  if (!Number.isFinite(data.price) || data.price < 0) return { ok: false, error: 'Prix invalide.' };

  const db = getDB();
  const card = db.cards.find((c) => c.id === data.cardId);
  if (!card) return { ok: false, error: 'Choisissez une carte pour ce plat.' };
  if (card.ownerId !== user.id && user.role !== 'admin') {
    return { ok: false, error: 'Vous ne pouvez ajouter des plats qu’à vos propres cartes.' };
  }

  const isUpdate = Boolean(data.id);

  // Quota vérifié CÔTÉ SERVEUR uniquement à la CRÉATION (jamais à l'édition).
  if (!isUpdate) {
    const quota = checkDishQuota(db, user, db.settings);
    if (!quota.ok) {
      return {
        ok: false,
        quotaExceeded: true,
        used: quota.used,
        limit: quota.limit,
        plan: quota.plan,
        error: quota.reason,
      };
    }
  }

  if (data.id) {
    const idx = db.dishes.findIndex((d) => d.id === data.id);
    if (idx === -1) return { ok: false, error: 'Plat introuvable.' };
    const dish = db.dishes[idx];
    if (dish.ownerId !== user.id && user.role !== 'admin') return { ok: false, error: 'Droits insuffisants.' };
    db.dishes[idx] = {
      ...dish,
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      price: data.price,
      category: data.category || undefined,
      level: data.level,
      allergens: data.allergens,
      recipeId: data.recipeId || undefined,
      status: data.status,
      video: data.video,
      updatedAt: nowISO(),
    };
    saveDB(db);
    revalidatePath('/cartes');
    return { ok: true, id: data.id };
  }

  const dish: Dish = {
    id: newId('dish'),
    cardId: card.id,
    ownerId: user.id,
    name: data.name.trim(),
    description: data.description?.trim() || undefined,
    price: data.price,
    category: data.category || undefined,
    level: data.level,
    allergens: data.allergens ?? [],
    recipeId: data.recipeId || undefined,
    video: data.video,
    status: data.status,
    sortIndex: db.dishes.filter((d) => d.cardId === card.id).length,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  db.dishes.push(dish);
  saveDB(db);
  revalidatePath('/cartes');
  return { ok: true, id: dish.id };
}

/** Téléverse la photo d'un plat et l'associe. */
export async function uploadDishPhotoAction(formData: FormData): Promise<{ ok: boolean; fileId?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Session expirée.' };
  const dishId = String(formData.get('dishId') || '');
  const file = formData.get('photo');
  const db = getDB();
  const dish = db.dishes.find((d) => d.id === dishId);
  if (!dish) return { ok: false, error: 'Plat introuvable.' };
  if (dish.ownerId !== user.id && user.role !== 'admin') return { ok: false, error: 'Plat non accessible.' };
  const saved = await saveImageFile(file instanceof File ? file : null, 8);
  if (!saved.ok || !saved.fileId) return { ok: false, error: saved.error };
  dish.photoFileId = saved.fileId;
  dish.updatedAt = nowISO();
  saveDB(db);
  revalidatePath('/cartes');
  return { ok: true, fileId: saved.fileId };
}

export async function deleteDishAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Session expirée.' };
  const db = getDB();
  const dish = db.dishes.find((d) => d.id === id);
  if (!dish) return { ok: false, error: 'Plat introuvable.' };
  if (dish.ownerId !== user.id && user.role !== 'admin') return { ok: false, error: 'Droits insuffisants.' };
  db.dishes = db.dishes.filter((d) => d.id !== id);
  saveDB(db);
  revalidatePath('/cartes');
  return { ok: true };
}

/** Réordonne les plats d'une carte (glisser-déposer). */
export async function reorderDishesAction(cardId: string, orderedIds: string[]): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Session expirée.' };
  const db = getDB();
  const card = db.cards.find((c) => c.id === cardId);
  if (!card) return { ok: false, error: 'Carte introuvable.' };
  if (card.ownerId !== user.id && user.role !== 'admin') return { ok: false, error: 'Droits insuffisants.' };
  const pos = new Map(orderedIds.map((id, i) => [id, i]));
  for (const d of db.dishes) {
    if (d.cardId === cardId && pos.has(d.id)) d.sortIndex = pos.get(d.id)!;
  }
  saveDB(db);
  revalidatePath('/cartes');
  return { ok: true };
}
