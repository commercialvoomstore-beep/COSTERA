'use client';

import { ErrorPanel } from '@/components/error-panel';

/** Boundary des pages publiques (connexion, inscription, vitrine…). */
export default function PublicError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  console.error('[COSTERA] erreur page publique', error);
  return (
    <ErrorPanel
      title="Cette page n’a pas pu s’afficher"
      message="Réessayez : si le problème persiste, rechargez la page."
      onRetry={reset}
    />
  );
}
