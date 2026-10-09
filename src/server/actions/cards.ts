'use server';

// COSTERA — Cartes (hôtel / restaurant / traiteur) : CRUD, publication,
// partage. Les cartes sont des conteneurs : elles ne comptent PAS dans le
// quota de menus (seuls les plats qu'elles regroupent comptent).
import { revalidatePath } from 'next/cache';
import type { Card, CardStatus, CardType } from '@/lib/types';
import { getCurrentUser } from '@/server/currentUser';
import { getDB, newId, nowISO, saveDB } from '@/server/db';
import { saveImageFile } from '@/server/uploads';

export interface CardPayload {
  id?: string;
  type: CardType;
  customType?: string;
  name: string;
  slogan?: string;
  theme: Card['theme'];
  accentColor?: string;
  font: Card['font'];
  level: Card['level'];
  status: CardStatus;
  categories: string[];
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 60) || 'carte'
  );
}

export async function saveCardAction(data: CardPayload): Promise<{ ok: boolean; id?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Session expirée. Veuillez vous reconnecter.' };
  if (!data.name.trim()) return { ok: false, error: 'Le nom de la carte est requis.' };

  const db = getDB();
  const categories = data.categories.map((c) => c.trim()).filter(Boolean);

  if (data.id) {
    const idx = db.cards.findIndex((c) => c.id === data.id);
    if (idx === -1) return { ok: false, error: 'Carte introuvable.' };
    const card = db.cards[idx];
    if (card.ownerId !== user.id && user.role !== 'admin') {
      return { ok: false, error: 'Vous ne pouvez modifier que vos propres cartes.' };
    }
    db.cards[idx] = {
      ...card,
      type: data.type,
      customType: data.customType?.trim() || undefined,
      name: data.name.trim(),
      slogan: data.slogan?.trim() || undefined,
      theme: data.theme,
      accentColor: data.accentColor || undefined,
      font: data.font,
      level: data.level,
      status: data.status,
      categories: categories.length ? categories : card.categories,
      updatedAt: nowISO(),
    };
    saveDB(db);
    revalidatePath('/cartes');
    return { ok: true, id: data.id };
  }

  const id = newId('card');
  const card: Card = {
    id,
    ownerId: user.id,
    type: data.type,
    customType: data.customType?.trim() || undefined,
    name: data.name.trim(),
    slogan: data.slogan?.trim() || undefined,
    theme: data.theme,
    accentColor: data.accentColor || undefined,
    font: data.font,
    level: data.level,
    status: data.status,
    shareSlug: `${slugify(data.name)}-${id.slice(-4)}`,
    categories: categories.length ? categories : ['Entrées', 'Plats', 'Desserts', 'Boissons'],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  db.cards.push(card);
  saveDB(db);
  revalidatePath('/cartes');
  return { ok: true, id };
}

/** Téléverse une photo de couverture et l'associe à une carte. */
export async function uploadCardCoverAction(formData: FormData): Promise<{ ok: boolean; fileId?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Session expirée.' };
  const cardId = String(formData.get('cardId') || '');
  const file = formData.get('cover');
  const db = getDB();
  const card = db.cards.find((c) => c.id === cardId);
  if (!card) return { ok: false, error: 'Carte introuvable.' };
  if (card.ownerId !== user.id && user.role !== 'admin') return { ok: false, error: 'Carte non accessible.' };
  const saved = await saveImageFile(file instanceof File ? file : null, 8);
  if (!saved.ok || !saved.fileId) return { ok: false, error: saved.error };
  card.coverFileId = saved.fileId;
  card.updatedAt = nowISO();
  saveDB(db);
  revalidatePath('/cartes');
  return { ok: true, fileId: saved.fileId };
}

export async function deleteCardAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Session expirée.' };
  const db = getDB();
  const card = db.cards.find((c) => c.id === id);
  if (!card) return { ok: false, error: 'Carte introuvable.' };
  if (card.ownerId !== user.id && user.role !== 'admin') return { ok: false, error: 'Droits insuffisants.' };
  // Supprime aussi les plats rattachés.
  db.cards = db.cards.filter((c) => c.id !== id);
  db.dishes = db.dishes.filter((d) => d.cardId !== id);
  saveDB(db);
  revalidatePath('/cartes');
  return { ok: true };
}
