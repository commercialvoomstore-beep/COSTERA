import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { Sidebar } from '@/components/sidebar';
import { officialLogoDisplaySrc } from '@/components/logo';
import { getSessionUserId } from '@/lib/auth';
import { getDB } from '@/server/db';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const userId = await getSessionUserId();
  if (!userId) redirect('/login');
  const user = getDB().users.find((u) => u.id === userId);
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-sand-50">
      <Sidebar user={{ name: user.name, email: user.email, role: user.role }} logoSrc={officialLogoDisplaySrc()} />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
      </main>
    </div>
  );
}
