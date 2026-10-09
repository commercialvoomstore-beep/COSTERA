'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FeatureCard } from './FeatureCard';
import { FEATURES } from './feature-data';

/** Délai d'apparition décalé entre deux cartes (ms). */
const STAGGER_MS = 80;

/**
 * Grille 3 × 2 des fonctionnalités (3 colonnes desktop, 2 tablette, 1 mobile).
 * Gère l'apparition en fondu+translation décalée de 80 ms (IntersectionObserver)
 * et l'activation tactile carte par carte.
 * Repli sans JS / sans IntersectionObserver : cartes visibles, aucun effet.
 */
export function FeaturesGrid() {
  const gridRef = useRef<HTMLDivElement>(null);
  const [jsOn, setJsOn] = useState(false);
  const [touchActive, setTouchActive] = useState<number | null>(null);

  // Marque la grille « JS actif » avant le premier rendu peint :
  // sans JS, les cartes restent visibles sans effet d'entrée.
  useEffect(() => {
    setJsOn(true);
  }, []);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || !jsOn) return;
    const cells = Array.from(grid.querySelectorAll<HTMLElement>('.fc-cell'));
    if (cells.length === 0) return;

    const reveal = () => {
      cells.forEach((cell, i) => {
        // Délai décalé via variable CSS : la règle d'atténuation au survol
        // peut imposer transition-delay: 0ms (priorité sur la variable).
        cell.style.setProperty('--fc-d', `${i * STAGGER_MS}ms`);
        cell.classList.add('is-visible');
      });
      // Une fois l'entrée jouée, retire les délais pour que l'atténuation
      // des autres cartes au survol reste parfaitement réactive.
      const total = cells.length * STAGGER_MS + 900;
      window.setTimeout(() => {
        cells.forEach((cell) => {
          cell.style.removeProperty('--fc-d');
        });
      }, total);
    };

    if (typeof IntersectionObserver === 'undefined') {
      reveal();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          reveal();
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(grid);
    return () => io.disconnect();
  }, [jsOn]);

  // Tactile : un appui hors d'une carte active la désactive.
  useEffect(() => {
    if (touchActive === null) return;
    const onDocClick = (e: MouseEvent) => {
      const grid = gridRef.current;
      if (grid && !grid.contains(e.target as Node)) setTouchActive(null);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [touchActive]);

  const handleTouchActivate = useCallback((index: number | null) => {
    setTouchActive(index);
  }, []);

  return (
    <div
      ref={gridRef}
      data-js={jsOn ? 'on' : undefined}
      className="fc-grid grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      {FEATURES.map((item, i) => (
        <FeatureCard
          key={item.title}
          item={item}
          index={i}
          touchActive={touchActive}
          onTouchActivate={handleTouchActivate}
        />
      ))}
    </div>
  );
}
