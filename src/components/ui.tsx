// COSTERA — Composants UI réutilisables
import Link from 'next/link';
import type { ReactNode } from 'react';

export function Logo({ dark = false, small = false }: { dark?: boolean; small?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`grid place-items-center rounded-lg bg-brand-600 font-black text-white ${small ? 'h-7 w-7 text-sm' : 'h-9 w-9 text-base'}`}>
        C
      </span>
      <span className={`font-black tracking-tight ${small ? 'text-base' : 'text-lg'} ${dark ? 'text-white' : 'text-ink'}`}>
        COSTERA
      </span>
    </span>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-stone-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function CardHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 px-5 py-4">
      <div>
        <h3 className="text-sm font-bold text-ink">{title}</h3>
        {description ? <p className="mt-0.5 text-xs text-stone-500">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}

const BADGE_TONES = {
  green: 'bg-forest-50 text-forest-700 ring-forest-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  brand: 'bg-brand-50 text-brand-700 ring-brand-600/20',
  neutral: 'bg-stone-100 text-stone-600 ring-stone-500/20',
  ink: 'bg-ink text-white ring-ink',
} as const;

export function Badge({ tone = 'neutral', children }: { tone?: keyof typeof BADGE_TONES; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${BADGE_TONES[tone]}`}>
      {children}
    </span>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <span className="label">{label}</span>
      {children}
      {hint ? <p className="mt-1 text-xs text-stone-400">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      {icon ? <div className="text-stone-300">{icon}</div> : null}
      <p className="text-base font-bold text-ink">{title}</p>
      {text ? <p className="max-w-sm text-sm text-stone-500">{text}</p> : null}
      {action}
    </div>
  );
}

export function LinkButton({ href, variant = 'primary', children }: { href: string; variant?: 'primary' | 'ghost' | 'dark'; children: ReactNode }) {
  const cls = variant === 'primary' ? 'btn-primary' : variant === 'dark' ? 'btn-dark' : 'btn-ghost';
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export function StatusBadge({ status }: { status: 'active' | 'brouillon' | 'archivee' }) {
  if (status === 'active') return <Badge tone="green">Active</Badge>;
  if (status === 'brouillon') return <Badge tone="amber">Brouillon</Badge>;
  return <Badge tone="neutral">Archivée</Badge>;
}

export function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
      {error}
    </div>
  );
}

export function SuccessNote({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-forest-200 bg-forest-50 px-4 py-3 text-sm font-medium text-forest-800">{children}</div>;
}
