'use server';

import { revalidatePath } from 'next/cache';
import type { Menu } from '@/lib/types';
import { assertRole } from '@/server/currentUser';
import { getDB, newId, nowISO, saveDB } from '@/server/db';

export interface MenuPayload {
  id?: string;
  name: string;
  description?: string;
  sections: { title: string; recipeIds: string[] }[];
}

export async function saveMenuAction(data: MenuPayload): Promise<{ ok: boolean; id?: string; error?: string }> {
  const guard = await assertRole('admin', 'gestionnaire');
  if (!guard.ok) return guard;
  if (!data.name.trim()) return { ok: false, error: 'Le nom du menu est requis.' };
  const sections = data.sections.filter((s) => s.title.trim());
  if (!sections.length) return { ok: false, error: 'Ajoutez au moins une section au menu.' };
  const db = getDB();
  const recipeIds = new Set(db.recipes.map((r) => r.id));
  for (const s of sections) {
    for (const rid of s.recipeIds) {
      if (!recipeIds.has(rid)) return { ok: false, error: 'Une recette sélectionnée n’existe plus.' };
    }
  }

  if (data.id) {
    const idx = db.menus.findIndex((m) => m.id === data.id);
    if (idx === -1) return { ok: false, error: 'Menu introuvable.' };
    const updated: Menu = {
      ...db.menus[idx],
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      sections: sections.map((s) => ({
        id: db.menus[idx].sections.find((x) => x.title === s.title)?.id ?? newId('sec'),
        title: s.title.trim(),
        recipeIds: [...new Set(s.recipeIds)],
      })),
      updatedAt: nowISO(),
    };
    const menus = [...db.menus];
    menus[idx] = updated;
    saveDB({ ...db, menus });
    return { ok: true, id: data.id };
  }

  const id = newId('menu');
  const menu: Menu = {
    id,
    name: data.name.trim(),
    description: data.description?.trim() || undefined,
    sections: sections.map((s) => ({ id: newId('sec'), title: s.title.trim(), recipeIds: [...new Set(s.recipeIds)] })),
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  saveDB({ ...db, menus: [...db.menus, menu] });
  revalidatePath('/menus', 'layout');
  return { ok: true, id };
}

export async function deleteMenuAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const guard = await assertRole('admin', 'gestionnaire');
  if (!guard.ok) return guard;
  const db = getDB();
  saveDB({ ...db, menus: db.menus.filter((m) => m.id !== id) });
  revalidatePath('/menus', 'layout');
  return { ok: true };
}
