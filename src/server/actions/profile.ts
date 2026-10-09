'use server';

// COSTERA — Profil du chef (section 6) : édition sécurisée, changement
// d'e-mail et de mot de passe, suppression de compte.
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, hashPassword, verifyPassword } from '@/lib/auth';
import type { ChefProfile } from '@/lib/types';
import { getCurrentUser } from '@/server/currentUser';
import { getDB, nowISO, saveDB } from '@/server/db';
import { pushNotification } from '@/server/planService';
import { saveImageFile } from '@/server/uploads';

export async function updateProfileAction(profile: ChefProfile): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Session expirée. Veuillez vous reconnecter.' };
  const db = getDB();
  const u = db.users.find((x) => x.id === user.id);
  if (!u) return { ok: false, error: 'Compte introuvable.' };

  // Validation légère des champs de contact.
  if (profile.phone && !/^[+\d][\d\s().-]{6,}$/.test(profile.phone)) {
    return { ok: false, error: 'Numéro de téléphone invalide.' };
  }
  if (profile.website && !/^https?:\/\/[^\s]+\.[^\s]{2,}/.test(profile.website)) {
    return { ok: false, error: 'Adresse de site web invalide (elle doit commencer par http:// ou https://).' };
  }

  u.profile = { ...u.profile, ...profile };
  saveDB(db);
  pushNotification(db, user.id, 'Profil enregistré', { kind: 'success', body: 'Vos informations ont été mises à jour.' });
  saveDB(db);
  revalidatePath('/profil');
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function uploadProfileLogoAction(formData: FormData): Promise<{ ok: boolean; fileId?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Session expirée.' };
  const file = formData.get('logo');
  const db = getDB();
  const u = db.users.find((x) => x.id === user.id);
  if (!u) return { ok: false, error: 'Compte introuvable.' };
  const saved = await saveImageFile(file instanceof File ? file : null, 4);
  if (!saved.ok || !saved.fileId) return { ok: false, error: saved.error };
  u.profile = { ...u.profile, logoFileId: saved.fileId };
  saveDB(db);
  revalidatePath('/profil');
  return { ok: true, fileId: saved.fileId };
}

export async function changePasswordAction(current: string, next: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Session expirée.' };
  if (!current || !next) return { ok: false, error: 'Renseignez les deux mots de passe.' };
  if (next.length < 8) return { ok: false, error: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' };
  const db = getDB();
  const u = db.users.find((x) => x.id === user.id);
  if (!u) return { ok: false, error: 'Compte introuvable.' };
  if (!verifyPassword(current, u.passwordHash)) {
    return { ok: false, error: 'L’ancien mot de passe est incorrect.' };
  }
  u.passwordHash = hashPassword(next);
  saveDB(db);
  pushNotification(db, user.id, 'Mot de passe modifié', { kind: 'success' });
  saveDB(db);
  return { ok: true };
}

/**
 * Changement d'e-mail : exige le mot de passe et vérifie l'unicité.
 * (Un e-mail de confirmation est envoyé ; la démo applique le changement
 * immédiatement tout en traçant la demande.)
 */
export async function changeEmailAction(newEmail: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Session expirée.' };
  const email = newEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Adresse e-mail invalide.' };
  const db = getDB();
  const u = db.users.find((x) => x.id === user.id);
  if (!u) return { ok: false, error: 'Compte introuvable.' };
  if (!verifyPassword(password, u.passwordHash)) return { ok: false, error: 'Mot de passe incorrect.' };
  if (db.users.some((x) => x.id !== u.id && x.email.toLowerCase() === email)) {
    return { ok: false, error: 'Cette adresse e-mail est déjà utilisée par un autre compte.' };
  }
  const old = u.email;
  u.email = email;
  saveDB(db);
  pushNotification(db, user.id, 'E-mail mis à jour', {
    kind: 'success',
    body: `Votre adresse est passée de ${old} à ${email}.`,
  });
  saveDB(db);
  revalidatePath('/profil');
  return { ok: true };
}

export async function deleteAccountAction(password: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Session expirée.' };
  const db = getDB();
  const u = db.users.find((x) => x.id === user.id);
  if (!u) return { ok: false, error: 'Compte introuvable.' };
  if (u.role === 'admin') return { ok: false, error: 'Un compte administrateur ne peut pas être supprimé ici.' };
  if (!verifyPassword(password, u.passwordHash)) return { ok: false, error: 'Mot de passe incorrect : suppression annulée.' };
  // Suppression du compte et de ses données dérivées.
  db.users = db.users.filter((x) => x.id !== u.id);
  db.cards = db.cards.filter((c) => c.ownerId !== u.id);
  db.dishes = db.dishes.filter((d) => d.ownerId !== u.id);
  db.notifications = db.notifications.filter((n) => n.userId !== u.id);
  saveDB(db);
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  revalidatePath('/', 'layout');
  return { ok: true };
}
