'use client';

/**
 * Dernier filet : si le layout racine lui-même échoue, Next rend ce
 * composant SANS la feuille de style globale — styles en ligne sobres
 * reprenant l'identité COSTERA (fond ivoire, violet royal).
 */
export default function GlobalError({ error }: { error: Error; reset: () => void }) {
  console.error('[COSTERA] erreur globale', error);
  return (
    <html lang="fr">
      <body style={{ margin: 0, background: '#FAF8F5', color: '#34313B', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: 24 }}>
          <div style={{ maxWidth: 420, textAlign: 'center', background: '#fff', border: '1px solid #EAE6EF', borderRadius: 16, padding: 32, boxShadow: '0 14px 34px -10px rgb(34 16 56 / 0.22)' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#b08a43' }}>
              COSTERA
            </p>
            <h1 style={{ margin: '12px 0 8px', fontFamily: 'Georgia, serif', fontSize: 22, color: '#391c5b' }}>
              Une erreur inattendue est survenue
            </h1>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'rgb(52 49 59 / 0.6)' }}>
              Vos données restent intactes. Rechargez la page pour reprendre la connexion.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                marginTop: 20,
                padding: '10px 20px',
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                background: 'linear-gradient(180deg, #6B3BB5, #54258A)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Recharger la page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
