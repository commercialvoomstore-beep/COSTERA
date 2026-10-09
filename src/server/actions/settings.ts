'use server';

import { revalidatePath } from 'next/cache';
import { assertRole } from '@/server/currentUser';
import { getDB, saveDB } from '@/server/db';

export interface SettingsPayload {
  orgName: string;
  targetFoodCostPct: number;
  country: string;
}

export async function updateSettingsAction(data: SettingsPayload): Promise<{ ok: boolean; error?: string }> {
  const guard = await assertRole('admin');
  if (!guard.ok) return guard;
  if (!data.orgName.trim()) return { ok: false, error: 'Le nom de l’établissement est requis.' };
  if (!Number.isFinite(data.targetFoodCostPct) || data.targetFoodCostPct < 5 || data.targetFoodCostPct > 90) {
    return { ok: false, error: 'L’objectif de food cost doit être compris entre 5 et 90 %.' };
  }
  const db = getDB();
  saveDB({
    ...db,
    settings: {
      ...db.settings,
      orgName: data.orgName.trim(),
      targetFoodCostPct: data.targetFoodCostPct,
      country: data.country.trim() || db.settings.country,
    },
  });
  revalidatePath('/', 'layout');
  return { ok: true };
}
