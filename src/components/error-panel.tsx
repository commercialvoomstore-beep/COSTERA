'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

/**
 * Panneau de récupération affiché par les boundaries d'erreur :
 * garantit qu'aucune défaillance de rendu ne laisse un écran blanc.
 * Design COSTERA conservé (carte, boutons, serif, violet/or).
 */
export function ErrorPanel({
  title = 'Une erreur est survenue',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 py-16">
      <div className="card w-full max-w-md p-8 text-center" role="alert">
        <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-royal-50 text-royal-700 ring-1 ring-inset ring-royal-600/15">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="font-display text-xl font-bold text-royal-900">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-body/60">{message}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {onRetry ? (
            <button type="button" onClick={onRetry} className="btn-primary">
              Réessayer
            </button>
          ) : null}
          <button type="button" onClick={() => window.location.reload()} className="btn-ghost">
            Recharger la page
          </button>
          <Link href="/login" className="btn-ghost">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
