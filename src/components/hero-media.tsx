'use client';

// COSTERA — Arrière-plan vidéo de l'accueil, propre et remplaçable.
// Aucune vidéo n'est inventée : le composant n'affiche la balise <video> que si
// une source réelle est fournie (public/video/hero.mp4 ou NEXT_PUBLIC_HERO_VIDEO).
// Sinon, repli élégant sur la photographie gastronomique officielle.
import { useEffect, useState } from 'react';

export function HeroMedia({ videoUrl, poster }: { videoUrl: string | null; poster: string }) {
  const [reduced, setReduced] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia === 'function') {
      setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
  }, []);

  const showVideo = videoUrl !== null && !reduced && !videoFailed;

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {showVideo ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <video
          className="h-full w-full object-cover"
          src={videoUrl}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVideoFailed(true)}
        />
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={poster} alt="" className="h-full w-full object-cover" />
      )}
      {/* Superposition légère : lisibilité garantie des textes et du logo */}
      <div className="absolute inset-0 bg-gradient-to-r from-ivory via-ivory/90 to-ivory/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-ivory via-transparent to-ivory/60" />
    </div>
  );
}
