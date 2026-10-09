'use server';

import { cookies } from 'next/headers';
import { SESSION_COOKIE, encodeSession, hashPassword, verifyPassword } from '@/lib/auth';
import { getDB, newId, nowISO, saveDB } from '@/server/db';

export async function loginAction(email: unknown, password: unknown): Promise<{ ok: boolean; error?: string }> {
  // Entrées coercées : un corps de requête malformed (proxy, extension,
  // client bogué) ne doit JAMAIS produire une 500 ni une stack exposée.
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const cleanPassword = typeof password === 'string' ? password : '';
  if (!cleanEmail || !cleanPassword) return { ok: false, error: 'Renseignez votre e-mail et votre mot de passe.' };
  const user = getDB().users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!user || !verifyPassword(cleanPassword, user.passwordHash)) {
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

/** Inscription publique : crée un compte « gestionnaire » ou « chef » puis ouvre la session. */
export async function registerAction(input: {
  firstName: string;
  lastName: string;
  email: string;
  profile: 'utilisateur' | 'chef';
  password: string;
}): Promise<{ ok: boolean; error?: string }> {
  // Entrées coercées : aucun champ manquant/null ne doit lever d'exception.
  const safe = input && typeof input === 'object' ? input : ({} as typeof input);
  const firstName = typeof safe.firstName === 'string' ? safe.firstName.trim() : '';
  const lastName = typeof safe.lastName === 'string' ? safe.lastName.trim() : '';
  const email = typeof safe.email === 'string' ? safe.email.trim().toLowerCase() : '';
  const password = typeof safe.password === 'string' ? safe.password : '';
  if (!firstName || !lastName) return { ok: false, error: 'Renseignez votre prénom et votre nom.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Adresse e-mail invalide.' };
  if (!password || password.length < 8) {
    return { ok: false, error: 'Le mot de passe doit contenir au moins 8 caractères.' };
  }
  const db = getDB();
  if (db.users.some((u) => u.email.toLowerCase() === email)) {
    return { ok: false, error: 'Un compte existe déjà avec cette adresse e-mail.' };
  }
  const id = newId('usr');
  db.users.push({
    id,
    name: `${firstName} ${lastName}`,
    email,
    role: safe.profile === 'chef' ? 'chef' : 'gestionnaire',
    passwordHash: hashPassword(password),
    createdAt: nowISO(),
  });
  saveDB(db);
  const store = await cookies();
  store.set(SESSION_COOKIE, encodeSession(id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
  return { ok: true };
}
