// Helper interne (non exposé) : utilisateur courant côté serveur.
import { getSessionUserId } from '@/lib/auth';
import type { Role, User } from '@/lib/types';
import { getDB } from './db';

export async function getCurrentUser(): Promise<User | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return getDB().users.find((u) => u.id === userId) ?? null;
}

export async function assertRole(...allowed: Role[]): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Session expirée. Veuillez vous reconnecter.' };
  if (!allowed.includes(user.role)) return { ok: false, error: 'Accès refusé : droits insuffisants.' };
  return { ok: true, user };
}
