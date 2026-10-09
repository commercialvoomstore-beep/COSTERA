'use server';

// COSTERA — Notifications in-app : marquage lu / tout lu.
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/server/currentUser';
import { getDB, saveDB } from '@/server/db';

export async function markNotificationReadAction(id: string): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  const db = getDB();
  const n = db.notifications.find((x) => x.id === id && x.userId === user.id);
  if (n) {
    n.read = true;
    saveDB(db);
    revalidatePath('/', 'layout');
  }
  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  const db = getDB();
  let changed = false;
  for (const n of db.notifications) {
    if (n.userId === user.id && !n.read) {
      n.read = true;
      changed = true;
    }
  }
  if (changed) {
    saveDB(db);
    revalidatePath('/', 'layout');
  }
  return { ok: true };
}
