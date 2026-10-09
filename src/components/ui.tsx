// COSTERA — Composants UI réutilisables (design system unique)
import Link from 'next/link';
import type { ReactNode } from 'react';

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-royal-900">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm text-body/55">{description}</p> : null}
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
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-linec px-5 py-4">
      <div>
        <h3 className="text-sm font-bold text-body">{title}</h3>
        {description ? <p className="mt-0.5 text-xs text-body/50">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}

const BADGE_TONES = {
  green: 'bg-forest-50 text-forest-700 ring-forest-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  brand: 'bg-royal-50 text-royal-700 ring-royal-600/20',
  gold: 'bg-gold-50 text-gold-700 ring-gold-600/25',
  neutral: 'bg-sand-100 text-body/60 ring-body/10',
  ink: 'bg-royal-900 text-white ring-royal-900',
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
      {hint ? <p className="mt-1 text-xs text-body/40">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {icon ? <div className="text-royal-200">{icon}</div> : null}
      <p className="font-display text-base font-bold text-body">{title}</p>
      {text ? <p className="max-w-sm text-sm text-body/55">{text}</p> : null}
      {action}
    </div>
  );
}

export function LinkButton({ href, variant = 'primary', children }: { href: string; variant?: 'primary' | 'ghost' | 'gold'; children: ReactNode }) {
  const cls = variant === 'primary' ? 'btn-primary' : variant === 'gold' ? 'btn-gold' : 'btn-ghost';
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
