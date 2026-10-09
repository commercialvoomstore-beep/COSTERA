'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Carrot,
  ChefHat,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { logoutAction } from '@/server/actions/auth';
import type { Role } from '@/lib/types';
import { Logo } from './ui';

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: Role[];
}

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/ingredients', label: 'Ingrédients', icon: Carrot },
  { href: '/recettes', label: 'Recettes', icon: ChefHat },
  { href: '/menus', label: 'Menus', icon: UtensilsCrossed },
  { href: '/equipe', label: 'Équipe', icon: Users, roles: ['admin'] },
  { href: '/parametres', label: 'Paramètres', icon: Settings, roles: ['admin'] },
];

export function Sidebar({ user }: { user: { name: string; email: string; role: Role } }) {
  const pathname = usePathname();
  const router = useRouter();
  const items = NAV.filter((n) => !n.roles || n.roles.includes(user.role));

  async function onLogout() {
    await logoutAction();
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      {/* Sidebar bureau */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-ink text-stone-300 lg:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <Link href="/dashboard">
            <Logo dark />
          </Link>
          <p className="mt-1.5 text-[11px] font-medium uppercase tracking-widest text-stone-500">Food cost &amp; coût matière</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active ? 'bg-brand-600 text-white shadow-sm' : 'text-stone-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-forest-800 text-sm font-bold text-white">
              {user.name.slice(0, 1)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user.name}</p>
              <p className="truncate text-xs text-stone-500">{user.email}</p>
            </div>
          </div>
          <button onClick={onLogout} className="btn w-full border border-white/15 bg-transparent text-stone-300 hover:bg-white/5 hover:text-white">
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Barre mobile */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/dashboard">
            <Logo dark small />
          </Link>
          <button onClick={onLogout} className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-stone-300 hover:bg-white/5">
            <LogOut className="h-4 w-4" />
            Quitter
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  active ? 'bg-brand-600 text-white' : 'bg-white/5 text-stone-300'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
    </>
  );
}
