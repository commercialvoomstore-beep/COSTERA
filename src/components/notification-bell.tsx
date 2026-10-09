'use client';

// COSTERA — Cloche de notifications dans l'en-tête.
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck } from 'lucide-react';
import type { AppNotification } from '@/lib/types';
import { markAllNotificationsReadAction, markNotificationReadAction } from '@/server/actions/notifications';

export function NotificationBell({ notifications }: { notifications: AppNotification[] }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(notifications);
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const unread = items.filter((n) => !n.read).length;

  useEffect(() => setItems(notifications), [notifications]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  async function openItem(n: AppNotification) {
    if (!n.read) {
      setItems((x) => x.map((y) => (y.id === n.id ? { ...y, read: true } : y)));
      await markNotificationReadAction(n.id);
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  async function markAll() {
    setItems((x) => x.map((y) => ({ ...y, read: true })));
    await markAllNotificationsReadAction();
  }

  const dot: Record<string, string> = {
    success: 'bg-forest-500',
    warning: 'bg-amber-500',
    payment: 'bg-gold-500',
    info: 'bg-royal-400',
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread ? ` : ${unread} non lues` : ''}`}
        aria-expanded={open}
        className="relative grid h-9 w-9 place-items-center rounded-full text-royal-100/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
      >
        <Bell className="h-4.5 w-4.5 h-[18px] w-[18px]" aria-hidden />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-gold-400 px-1 text-[9px] font-black text-royal-950">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="glass absolute right-0 top-11 z-50 w-[320px] rounded-2xl shadow-pop ring-1 ring-body/10">
          <div className="flex items-center justify-between border-b border-body/10 px-4 py-2.5">
            <p className="text-sm font-bold text-royal-900">Notifications</p>
            {unread > 0 && (
              <button type="button" onClick={markAll} className="inline-flex items-center gap-1 text-[11px] font-semibold text-royal-600 hover:text-royal-800">
                <CheckCheck className="h-3.5 w-3.5" /> Tout lire
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {items.length === 0 && <p className="px-4 py-6 text-center text-sm text-body/50">Aucune notification.</p>}
            {items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => openItem(n)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-royal-50/60 ${!n.read ? 'bg-royal-50/40' : ''}`}
              >
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot[n.kind] ?? 'bg-royal-300'}`} aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-body">{n.title}</span>
                  {n.body ? <span className="mt-0.5 block text-xs text-body/55 line-clamp-2">{n.body}</span> : null}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
