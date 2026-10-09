'use client';

import { ErrorPanel } from '@/components/error-panel';

/**
 * Boundary du segment applicatif : toute erreur de rendu d'une page
 * protégée (données manquantes, exception serveur sérialisée…) affiche
 * ce panneau de récupération au lieu d'un écran blanc.
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // Journalisation réelle côté client pour le diagnostic (pas de masquage).
  console.error('[COSTERA] erreur applicative', error);
  return (
    <ErrorPanel
      title="Le chargement de votre espace a échoué"
      message="Vos données restent intactes. Réessayez : si le problème persiste, rechargez la page ou reconnectez-vous."
      onRetry={reset}
    />
  );
}
