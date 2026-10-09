'use server';

import { revalidatePath } from 'next/cache';
import { hashPassword } from '@/lib/auth';
import type { Role, User } from '@/lib/types';
import { assertRole, getCurrentUser } from '@/server/currentUser';
import { getDB, newId, nowISO, saveDB } from '@/server/db';

export interface UserPayload {
  name: string;
  email: string;
  role: Role;
  password: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createUserAction(data: UserPayload): Promise<{ ok: boolean; id?: string; error?: string }> {
  const guard = await assertRole('admin');
  if (!guard.ok) return guard;
  if (!data.name.trim()) return { ok: false, error: 'Le nom complet est requis.' };
  if (!EMAIL_RE.test(data.email.trim())) return { ok: false, error: 'Adresse e-mail invalide.' };
  if (data.password.length < 6) return { ok: false, error: 'Le mot de passe doit contenir au moins 6 caractères.' };
  if (!['admin', 'gestionnaire', 'chef'].includes(data.role)) return { ok: false, error: 'Rôle invalide.' };
  const db = getDB();
  const email = data.email.trim().toLowerCase();
  if (db.users.some((u) => u.email.toLowerCase() === email)) {
    return { ok: false, error: 'Un compte existe déjà avec cette adresse e-mail.' };
  }
  const id = newId('usr');
  const user: User = {
    id,
    name: data.name.trim(),
    email,
    role: data.role,
    passwordHash: hashPassword(data.password),
    createdAt: nowISO(),
  };
  saveDB({ ...db, users: [...db.users, user] });
  revalidatePath('/equipe', 'page');
  return { ok: true, id };
}

export async function updateUserRoleAction(id: string, role: Role): Promise<{ ok: boolean; error?: string }> {
  const guard = await assertRole('admin');
  if (!guard.ok) return guard;
  const me = await getCurrentUser();
  if (me?.id === id) return { ok: false, error: 'Vous ne pouvez pas modifier votre propre rôle.' };
  if (!['admin', 'gestionnaire', 'chef'].includes(role)) return { ok: false, error: 'Rôle invalide.' };
  const db = getDB();
  const idx = db.users.findIndex((u) => u.id === id);
  if (idx === -1) return { ok: false, error: 'Utilisateur introuvable.' };
  const users = [...db.users];
  users[idx] = { ...users[idx], role };
  saveDB({ ...db, users });
  revalidatePath('/equipe', 'page');
  return { ok: true };
}

export async function deleteUserAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const guard = await assertRole('admin');
  if (!guard.ok) return guard;
  const me = await getCurrentUser();
  if (me?.id === id) return { ok: false, error: 'Vous ne pouvez pas supprimer votre propre compte.' };
  const db = getDB();
  saveDB({ ...db, users: db.users.filter((u) => u.id !== id) });
  revalidatePath('/equipe', 'page');
  return { ok: true };
}
