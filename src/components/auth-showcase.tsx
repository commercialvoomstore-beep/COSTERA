'use client';

// COSTERA — Colonne immersive des pages Connexion / Inscription.
// Le rendu est délégué au composant isolé HeroCarousel (fondu enchaîné +
// zoom avant cinématographique, slogans synchronisés, indicateurs minutés).
import { HeroCarousel, HERO_SLIDES } from './hero-carousel';

export function AuthShowcase({ logoSrc }: { logoSrc: string }) {
  return <HeroCarousel slides={HERO_SLIDES} logoSrc={logoSrc} />;
}
