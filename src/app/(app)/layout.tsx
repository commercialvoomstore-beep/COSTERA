import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { NotificationBell } from '@/components/notification-bell';
import { Sidebar } from '@/components/sidebar';
import { ToastProvider } from '@/components/toast';
import { officialLogoDisplaySrc } from '@/components/logo';
import { cookies } from 'next/headers';
import { getSessionUserId, SESSION_COOKIE } from '@/lib/auth';
import { getDB } from '@/server/db';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const userId = await getSessionUserId();
  if (!userId) {
    // Un cookie de session présent mais invalide/expiré mérite un message
    // explicite au lieu d'un retour silencieux au formulaire.
    const raw = (await cookies()).get(SESSION_COOKIE)?.value;
    if (raw) redirect('/login?erreur=session');
    redirect('/login');
  }
  const db = getDB();
  const user = db.users.find((u) => u.id === userId);
  if (!user) redirect('/login?erreur=session');

  const notifications = db.notifications
    .filter((n) => n.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 20);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-sand-50">
        <Sidebar
          user={{ name: user.name, email: user.email, role: user.role, plan: user.plan ?? 'free' }}
          logoSrc={officialLogoDisplaySrc()}
        />
        <main className="lg:pl-64">
          <div className="sticky top-0 z-20 flex items-center justify-end border-b border-linec/60 bg-sand-50/85 px-4 py-2 backdrop-blur lg:px-6">
            <NotificationBell notifications={notifications} />
          </div>
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}
