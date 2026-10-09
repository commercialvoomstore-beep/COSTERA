// COSTERA — Service forfaits & quotas : règles appliquées CÔTÉ SERVEUR.
import { effectivePlan, isUnlimited, quotaFor, resolvePlanConfig } from '@/lib/plans';
import type { PlanLevel, Settings, User } from '@/lib/types';
import type { DB } from './db';
import { newId, nowISO } from './db';

/** Niveau effectif d'un utilisateur (admin = gold, expiration gérée). */
export function userLevel(user: User): PlanLevel {
  return effectivePlan(user);
}

/** Nombre de plats/menus créés par un utilisateur (soumis au quota). */
export function countUserDishes(db: DB, userId: string): number {
  return db.dishes.filter((d) => d.ownerId === userId).length;
}

export interface QuotaCheck {
  ok: boolean;
  used: number;
  limit: number;
  unlimited: boolean;
  plan: PlanLevel;
  reason?: string;
}

/**
 * Vérifie CÔTÉ SERVEUR si l'utilisateur peut créer un menu/plat de plus.
 * Retourne ok=false avec un message clair si le quota est atteint.
 */
export function checkDishQuota(db: DB, user: User, settings: Settings): QuotaCheck {
  const plan = userLevel(user);
  const cfg = resolvePlanConfig(settings);
  const limit = quotaFor(plan, cfg.quotas);
  const used = countUserDishes(db, user.id);
  const unlimited = isUnlimited(limit);
  if (unlimited) return { ok: true, used, limit, unlimited, plan };
  if (used >= limit) {
    return {
      ok: false,
      used,
      limit,
      unlimited,
      plan,
      reason: `Vous avez atteint la limite de votre forfait ${plan.toUpperCase()} (${limit} menus).`,
    };
  }
  return { ok: true, used, limit, unlimited, plan };
}

/** Référence de commande unique, ex. CST-2026-000123. */
export function nextOrderRef(db: DB): string {
  const year = new Date().getFullYear();
  const count = db.paymentRequests.length + 1;
  return `CST-${year}-${String(count).padStart(6, '0')}`;
}

/** Nombre de demandes encore en attente pour un compte (anti-spam). */
export function pendingRequestsFor(db: DB, userId: string): number {
  return db.paymentRequests.filter((r) => r.userId === userId && r.status === 'en_attente').length;
}

/** Limite de demandes en attente par compte. */
export const MAX_PENDING_REQUESTS = 3;

/** Date de fin d'abonnement selon la période. */
export function computeExpiry(period: 'mensuel' | 'annuel', from: Date = new Date()): string {
  const d = new Date(from);
  if (period === 'annuel') d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

/** Crée une notification in-app. */
export function pushNotification(
  db: DB,
  userId: string,
  title: string,
  opts: { body?: string; kind?: 'info' | 'success' | 'warning' | 'payment'; link?: string } = {},
): void {
  db.notifications.push({
    id: newId('ntf'),
    userId,
    title,
    body: opts.body,
    kind: opts.kind ?? 'info',
    read: false,
    link: opts.link,
    createdAt: nowISO(),
  });
}
