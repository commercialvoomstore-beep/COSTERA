'use server';

import { revalidatePath } from 'next/cache';
import type { PlanConfig } from '@/lib/types';
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

/** Mise à jour de la configuration des forfaits (prix, quotas, vidéo, TVA). */
export async function updatePlanConfigAction(cfg: PlanConfig): Promise<{ ok: boolean; error?: string }> {
  const guard = await assertRole('admin');
  if (!guard.ok) return guard;

  const pos = (n: number) => Number.isFinite(n) && n >= 0;
  if (!pos(cfg.prices.silver.monthly) || !pos(cfg.prices.gold.monthly)) {
    return { ok: false, error: 'Les prix mensuels doivent être des montants positifs.' };
  }
  if (!pos(cfg.prices.silver.yearly) || !pos(cfg.prices.gold.yearly)) {
    return { ok: false, error: 'Les prix annuels doivent être des montants positifs.' };
  }
  if (cfg.quotas.free < 0 || cfg.quotas.silver < 0) {
    return { ok: false, error: 'Les quotas FREE et SILVER doivent être positifs (-1 = illimité).' };
  }
  if (!pos(cfg.videoMaxMb.free) || !pos(cfg.videoMaxMb.silver) || !pos(cfg.videoMaxMb.gold)) {
    return { ok: false, error: 'Les tailles vidéo doivent être des valeurs positives (0 = lien externe uniquement).' };
  }
  if (!Number.isFinite(cfg.tvaPct) || cfg.tvaPct < 0 || cfg.tvaPct > 50) {
    return { ok: false, error: 'La TVA doit être comprise entre 0 et 50 %.' };
  }

  const db = getDB();
  saveDB({ ...db, settings: { ...db.settings, plans: cfg } });
  revalidatePath('/', 'layout');
  revalidatePath('/forfaits');
  return { ok: true };
}
