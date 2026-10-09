// COSTERA — Photographies culinaires de la vitrine publique.
// Mapping recette → photo réaliste, avec repli par catégorie puis image par défaut.
import type { RecipeCategory } from './types';

const RECIPE_IMAGES: Record<string, string> = {
  'rec-attieke-poisson': '/dishes/attieke-poisson.jpg',
  'rec-garba': '/dishes/garba.jpg',
  'rec-kedjenou': '/dishes/kedjenou.jpg',
  'rec-alloco': '/dishes/alloco.jpg',
  'rec-sauce-graine': '/dishes/sauce-graine.jpg',
  'rec-sauce-claire': '/dishes/sauce-graine.jpg',
  'rec-poulet-braise': '/dishes/poulet-braise.jpg',
  'rec-tchep': '/dishes/poulet-braise.jpg',
  'rec-placali': '/dishes/sauce-graine.jpg',
  'rec-wassa-wassa': '/dishes/poulet-braise.jpg',
  'rec-degue': '/dishes/degue.jpg',
  'rec-bissap': '/dishes/bissap.jpg',
  'rec-salade-avocat': '/dishes/alloco.jpg',
  'rec-gateau-gingembre': '/dishes/degue.jpg',
};

const CATEGORY_IMAGES: Record<RecipeCategory, string> = {
  Entrées: '/dishes/alloco.jpg',
  Plats: '/dishes/attieke-poisson.jpg',
  Accompagnements: '/dishes/alloco.jpg',
  Desserts: '/dishes/degue.jpg',
  Boissons: '/dishes/bissap.jpg',
};

export function recipeImage(recipeId: string, category: RecipeCategory): string {
  return RECIPE_IMAGES[recipeId] ?? CATEGORY_IMAGES[category] ?? '/dishes/hero-table.jpg';
}

export const HERO_IMAGE = '/dishes/hero-table.jpg';
