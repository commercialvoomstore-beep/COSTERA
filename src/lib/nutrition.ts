// COSTERA — Carte nutritionnelle calculée automatiquement depuis les
// ingrédients de la recette (valeurs pour 100 g + conversions d'unités).
import type { Ingredient, Recipe } from './types';
import { unitById } from './units';

export interface NutritionTotal {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Grammes totaux d'ingrédients par portion. */
  gramsPerPortion: number;
}

/** Grammes d'un ingrédient pour une quantité donnée dans une unité donnée. */
function lineGrams(qty: number, unitId: string, ing: Ingredient): number {
  const unit = unitById(unitId);
  if (!unit) return 0;
  if (unit.kind === 'masse') {
    // toBase ramène au kg
    return qty * (unit.toBase ?? 1) * 1000;
  }
  const perBase = ing.baseUnitGrams ?? 1000;
  return qty * (unit.toBase ?? 1) * perBase;
}

/** Nutrition totale de la recette, ramenée À LA PORTION. */
export function computeNutrition(recipe: Recipe, ingredientById: Map<string, Ingredient>): NutritionTotal {
  const total = { kcal: 0, protein: 0, carbs: 0, fat: 0, grams: 0 };
  for (const line of recipe.lines) {
    const ing = ingredientById.get(line.ingredientId);
    if (!ing?.nutrition) continue;
    const grams = lineGrams(line.qty, line.unitId, ing);
    const f = grams / 100;
    total.kcal += ing.nutrition.kcal * f;
    total.protein += ing.nutrition.protein * f;
    total.carbs += ing.nutrition.carbs * f;
    total.fat += ing.nutrition.fat * f;
    total.grams += grams;
  }
  const portions = Math.max(1, recipe.portions);
  return {
    kcal: Math.round(total.kcal / portions),
    protein: Math.round(total.protein / portions),
    carbs: Math.round(total.carbs / portions),
    fat: Math.round(total.fat / portions),
    gramsPerPortion: Math.round(total.grams / portions),
  };
}
