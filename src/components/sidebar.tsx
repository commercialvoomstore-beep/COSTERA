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
import { BrandLogoClient } from './logo-client';

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

export function Sidebar({ user, logoKind }: { user: { name: string; email: string; role: Role }; logoKind: 'png' | 'svg' }) {
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
      {/* Sidebar bureau — violet royal identitaire */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-gradient-to-b from-royal-950 via-royal-900 to-royal-950 text-royal-100 lg:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <Link href="/dashboard" aria-label="Tableau de bord COSTERA">
            <BrandLogoClient kind={logoKind} size={52} onDark />
          </Link>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-400/90">Food cost &amp; coût matière</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Navigation de l’espace de travail">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60 ${
                  active
                    ? 'bg-gradient-to-r from-royal-600 to-royal-700 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.15),0_6px_14px_-6px_rgb(0_0_0/0.5)] ring-1 ring-inset ring-gold-500/30'
                    : 'text-royal-100/75 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`h-[18px] w-[18px] ${active ? 'text-gold-300' : ''}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-b from-gold-300 to-gold-500 text-sm font-bold text-royal-950">
              {user.name.slice(0, 1)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user.name}</p>
              <p className="truncate text-xs text-royal-100/50">{user.email}</p>
            </div>
          </div>
          <button onClick={onLogout} className="btn-on-dark w-full">
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Barre mobile */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-royal-950 lg:hidden">
        <div className="flex items-center justify-between px-4 py-2.5">
          <Link href="/dashboard" aria-label="Tableau de bord COSTERA">
            <BrandLogoClient kind={logoKind} size={40} onDark />
          </Link>
          <button onClick={onLogout} className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-royal-100/80 transition hover:bg-white/5 hover:text-white">
            <LogOut className="h-4 w-4" />
            Quitter
          </button>
        </div>
        <nav className="flex gap-1.5 overflow-x-auto px-3 pb-3" aria-label="Navigation mobile">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  active ? 'bg-royal-600 text-white ring-1 ring-inset ring-gold-500/40' : 'bg-white/5 text-royal-100/75'
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
