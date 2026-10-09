// COSTERA — Règles métier et calculs (cahier des charges, section 5)
import type { Ingredient, Recipe, RecipeLine } from './types';
import { convert } from './units';

export interface LineCost {
  lineId: string;
  /** Quantité convertie dans l'unité d'achat de l'ingrédient. */
  qtyInPurchaseUnit: number;
  /** Coût de la ligne, perte incluse, en FCFA. */
  cost: number;
  /** true si la conversion d'unité a pu être appliquée. */
  converted: boolean;
  /** true si la quantité est exploitable. */
  valid: boolean;
}

/**
 * Coût d'une ligne de fiche technique :
 * quantité convertie en unité d'achat × prix unitaire × (1 + taux de perte).
 */
export function costOfLine(line: RecipeLine, ing: Ingredient): LineCost {
  const valid = Number.isFinite(line.qty) && line.qty > 0;
  if (!valid) return { lineId: line.id, qtyInPurchaseUnit: 0, cost: 0, converted: false, valid: false };
  const convertedQty = convert(line.qty, line.unitId, ing.unitId);
  const qtyBase = convertedQty ?? line.qty;
  const cost = qtyBase * ing.price * (1 + (ing.lossPct || 0) / 100);
  return { lineId: line.id, qtyInPurchaseUnit: qtyBase, cost, converted: convertedQty !== null, valid: true };
}

export interface RecipeCost {
  /** Coût matière total de la recette (toutes portions), FCFA. */
  total: number;
  /** Coût matière par portion, FCFA. */
  perPortion: number;
  lines: LineCost[];
  /** Food cost % = coût matière / prix de vente. null si prix = 0. */
  foodCostPct: number | null;
  /** Marge brute par portion, FCFA. */
  margin: number;
  /** Coefficient multiplicateur = prix de vente / coût matière. */
  coefficient: number | null;
  /** true si au moins une ligne n'a pas pu être convertie proprement. */
  hasConversionWarning: boolean;
}

export function costOfRecipe(recipe: Recipe, ingredientsById: Map<string, Ingredient>): RecipeCost {
  const lines: LineCost[] = [];
  let hasConversionWarning = false;
  for (const line of recipe.lines) {
    const ing = ingredientsById.get(line.ingredientId);
    if (!ing) continue;
    const lc = costOfLine(line, ing);
    lines.push(lc);
    if (lc.valid && !lc.converted) hasConversionWarning = true;
  }
  const total = lines.reduce((s, l) => s + l.cost, 0);
  const portions = Math.max(1, recipe.portions || 1);
  const perPortion = total / portions;
  const price = recipe.salePrice || 0;
  return {
    total,
    perPortion,
    lines,
    foodCostPct: price > 0 ? (perPortion / price) * 100 : null,
    margin: price - perPortion,
    coefficient: perPortion > 0 && price > 0 ? price / perPortion : null,
    hasConversionWarning,
  };
}

/**
 * Prix de vente conseillé pour respecter l'objectif de food cost :
 * prix = coût matière / objectif. Arrondi au multiple de 25 FCFA supérieur.
 */
export function suggestedPrice(costPerPortion: number, targetFoodCostPct: number): number {
  if (targetFoodCostPct <= 0 || costPerPortion <= 0) return 0;
  const raw = (costPerPortion * 100) / targetFoodCostPct;
  return Math.ceil(raw / 25) * 25;
}

export type RatioStatus = 'good' | 'warn' | 'bad' | 'na';

/** Statut du food cost par rapport à l'objectif (marge de tolérance de 8 points). */
export function ratioStatus(foodCostPct: number | null, targetPct: number): RatioStatus {
  if (foodCostPct === null) return 'na';
  if (foodCostPct <= targetPct) return 'good';
  if (foodCostPct <= targetPct + 8) return 'warn';
  return 'bad';
}

/** Variation en % entre deux prix. */
export function priceDeltaPct(previous: number, current: number): number {
  if (previous <= 0) return 0;
  return ((current - previous) / previous) * 100;
}
