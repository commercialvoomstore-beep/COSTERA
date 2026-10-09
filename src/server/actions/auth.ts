'use server';

import { cookies } from 'next/headers';
import { SESSION_COOKIE, encodeSession, verifyPassword } from '@/lib/auth';
import { getDB } from '@/server/db';

export async function loginAction(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !password) return { ok: false, error: 'Renseignez votre e-mail et votre mot de passe.' };
  const user = getDB().users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { ok: false, error: 'Identifiants incorrects. Vérifiez votre e-mail et votre mot de passe.' };
  }
  const store = await cookies();
  store.set(SESSION_COOKIE, encodeSession(user.id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
