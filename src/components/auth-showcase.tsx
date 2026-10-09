'use client';

// COSTERA — Colonne immersive des pages Connexion / Inscription :
// carrousel plein cadre (5 s, fondu enchaîné, indicateurs), logo en haut à
// gauche, « Retour au site » en haut à droite, slogan serif + sous-ligne
// décorée en bas. Sur mobile : bandeau de 220 px au-dessus du formulaire.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BrandLogoClient } from './logo-client';

const SLIDES = [
  {
    img: '/images/hero-1.jpg',
    slogan: 'L’excellence culinaire, pilotée au franc près.',
    sub: 'Le feu, le geste précis, les coûts maîtrisés.',
  },
  {
    img: '/images/hero-2.jpg',
    slogan: 'L’art de recevoir se transmet.',
    sub: 'Hôtellerie • Restauration • Excellence.',
  },
  {
    img: '/images/hero-3.jpg',
    slogan: 'Maîtrisez vos coûts, sublimez vos saveurs.',
    sub: 'Chaque sauce, chaque franc, au compte.',
  },
  {
    img: '/images/hero-4.jpg',
    slogan: 'Du marché d’Abidjan à l’assiette, chaque franc compte.',
    sub: 'Le service d’exception, cœur ivoirien.',
  },
  {
    img: '/images/hero-5.jpg',
    slogan: 'La cuisine ivoirienne mérite une gestion d’exception.',
    sub: 'Bar, salle, cuisine : pilotez tout.',
  },
  {
    img: '/images/hero-6.jpg',
    slogan: 'Des suites impeccables, des comptes impeccables.',
    sub: 'L’excellence hôtelière, au franc près.',
  },
];

export function AuthShowcase({ logoSrc }: { logoSrc: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => setIndex((v) => (v + 1) % SLIDES.length), 5000);
    return () => window.clearInterval(t);
  }, []);

  const slide = SLIDES[index];

  return (
    <div className="relative h-[220px] w-full overflow-hidden bg-royal-950 lg:h-full">
      {/* Images en fondu enchaîné */}
      {SLIDES.map((s, i) => (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          key={s.img}
          src={s.img}
          alt=""
          loading={i === 0 ? 'eager' : 'lazy'}
          aria-hidden={i !== index}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-in-out ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
      {/* Dégradé sombre bas + voile léger */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-royal-950/85 via-royal-950/20 to-royal-950/30" />

      {/* Haut : logo + retour */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5 sm:p-7">
        <Link href="/" aria-label="COSTERA — retour à l’accueil">
          <BrandLogoClient src={logoSrc} fallback="/logo-costera.svg" size={46} onDark />
        </Link>
        <Link
          href="/"
          className="nav-link inline-flex items-center gap-1.5 rounded-full bg-royal-950/40 px-3.5 py-1.5 text-xs font-semibold text-ivory backdrop-blur-sm transition-colors hover:text-gold-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour au site
        </Link>
      </div>

      {/* Bas : slogan + sous-ligne + indicateurs */}
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
        <div key={index} className="auth-swap">
          <h2 className="font-display max-w-md text-xl font-semibold leading-snug text-white drop-shadow sm:text-2xl lg:text-[1.7rem]">
            {slide.slogan}
          </h2>
          <div className="mt-3 flex items-center gap-3">
            <span className="h-px w-8 bg-gold-400" />
            <p className="text-xs font-medium tracking-wide text-ivory/85">{slide.sub}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1.5" role="tablist" aria-label="Images de présentation">
            {SLIDES.map((s, i) => (
              <button
                key={s.img}
                type="button"
                aria-label={`Image ${i + 1}`}
                aria-selected={i === index}
                role="tab"
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === index ? 'w-6 bg-gold-400' : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
          <p className="hidden text-[10px] text-ivory/55 sm:block">
            © 2026 COSTERA — VOOMNET FORMATION · Côte d’Ivoire ·
          </p>
        </div>
      </div>
    </div>
  );
}
