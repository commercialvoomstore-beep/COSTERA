// COSTERA — Moteur de calcul (fonctions pures, testables).
// Toutes les formules du cahier des charges « moteur de calcul » :
// matières premières, rendement & pertes, food cost, prix de vente,
// marge & rentabilité, TVA, nutrition, allergènes, ingénierie de menu,
// inventaire & consommation, alertes prix.
import type { Ingredient, Recipe } from './types';
import { unitById } from './units';

/* ------------------------------------------------------------------ */
/* 3.1 Matières premières                                              */
/* ------------------------------------------------------------------ */

/** Grammes pour une quantité dans une unité donnée (kg→1000, l→densité, pièce…). */
export function qtyToGrams(qty: number, unitId: string, ing?: Ingredient): number {
  const unit = unitById(unitId);
  if (!unit || !Number.isFinite(qty)) return 0;
  if (unit.kind === 'masse') return qty * (unit.toBase ?? 1) * 1000;
  const perBase = ing?.baseUnitGrams ?? 1000;
  return qty * (unit.toBase ?? 1) * perBase;
}

/** Coût ingrédient = quantité × prix unitaire (ex. 0,5 kg × 800 = 400 FCFA). */
export function ingredientCost(qty: number, unitPrice: number): number {
  if (!Number.isFinite(qty) || qty < 0 || !Number.isFinite(unitPrice) || unitPrice < 0) return 0;
  return qty * unitPrice;
}

/** Coût d'une ligne en FCFA avec conversion d'unité vers l'unité d'achat. */
export function lineCostFCFA(
  qty: number,
  lineUnitId: string,
  ing: Ingredient,
  opts?: { useYieldCorrection?: boolean },
): number {
  const converted = convertQty(qty, lineUnitId, ing.unitId);
  const q = converted ?? qty;
  const price = opts?.useYieldCorrection
    ? yieldCorrectedPrice(ing.price, yieldFromLoss(ing.lossPct))
    : ing.price;
  return ingredientCost(q, price);
}

/** Conversion simple entre unités de même dimension (g↔kg, ml↔l, pièce). */
export function convertQty(qty: number, fromId: string, toId: string): number | null {
  if (fromId === toId) return qty;
  const from = unitById(fromId);
  const to = unitById(toId);
  if (!from || !to || from.kind !== to.kind) return null;
  if (from.toBase === undefined || to.toBase === undefined) return null;
  return (qty * from.toBase) / to.toBase;
}

/** Coût total recette = Σ coûts ingrédients. */
export function recipeTotalCost(
  recipe: Pick<Recipe, 'lines'>,
  ingredientById: Map<string, Ingredient>,
  opts?: { useYieldCorrection?: boolean },
): number {
  return recipe.lines.reduce((sum, line) => {
    const ing = ingredientById.get(line.ingredientId);
    if (!ing) return sum;
    return sum + lineCostFCFA(line.qty, line.unitId, ing, opts);
  }, 0);
}

/** Coût par portion = coût total ÷ portions. */
export function costPerPortion(totalCost: number, portions: number): number {
  const p = Math.max(1, portions || 1);
  return totalCost / p;
}

/* ------------------------------------------------------------------ */
/* 3.2 Rendement & pertes                                              */
/* ------------------------------------------------------------------ */

/** Rendement % = poids net ÷ poids brut × 100. */
export function yieldPct(grossWeight: number, netWeight: number): number {
  if (grossWeight <= 0) return 0;
  return (netWeight / grossWeight) * 100;
}

/** Perte % = poids perdu ÷ poids brut × 100. */
export function lossPct(grossWeight: number, lostWeight: number): number {
  if (grossWeight <= 0) return 0;
  return (lostWeight / grossWeight) * 100;
}

/** Rendement déduit du taux de perte stocké (lossPct 20 → rendement 80). */
export function yieldFromLoss(loss: number): number {
  return Math.max(1, 100 - (loss || 0));
}

/** Prix d'achat réel utilisable = prix ÷ rendement (3 000 ÷ 0,80 = 3 750). */
export function yieldCorrectedPrice(price: number, yieldPercent: number): number {
  const y = (yieldPercent || 0) / 100;
  if (y <= 0) return price;
  return price / y;
}

/* ------------------------------------------------------------------ */
/* 3.3 Food cost                                                       */
/* ------------------------------------------------------------------ */

/** Food Cost % = coût matière ÷ prix de vente × 100 (3 000 ÷ 10 000 = 30 %). */
export function foodCostPct(matterCost: number, salePrice: number): number | null {
  if (salePrice <= 0) return null;
  return (matterCost / salePrice) * 100;
}

/** Food Cost en valeur = prix de vente × Food Cost %. */
export function foodCostValue(salePrice: number, pct: number): number {
  return (salePrice * pct) / 100;
}

/* ------------------------------------------------------------------ */
/* 3.4 Prix de vente                                                   */
/* ------------------------------------------------------------------ */

/** Prix de vente = coût matière ÷ food cost cible (3 000 ÷ 0,30 = 10 000). */
export function priceFromTargetCost(matterCost: number, targetPct: number): number {
  const t = (targetPct || 0) / 100;
  if (t <= 0) return 0;
  return matterCost / t;
}

/** Arrondi commercial au multiple choisi (25 ou 50 FCFA par défaut). */
export function roundCommercial(value: number, step: 25 | 50 | 100 = 25): number {
  return Math.round(value / step) * step;
}

/* ------------------------------------------------------------------ */
/* 3.5 Marge & rentabilité                                             */
/* ------------------------------------------------------------------ */

/** Marge brute = prix de vente − coût matière (10 000 − 3 000 = 7 000). */
export function grossMargin(salePrice: number, matterCost: number): number {
  return salePrice - matterCost;
}

/** Taux de marge = marge ÷ coût d'achat × 100 (7 000 ÷ 3 000 = 233,33 %). */
export function marginRate(margin: number, matterCost: number): number | null {
  if (matterCost <= 0) return null;
  return (margin / matterCost) * 100;
}

/** Taux de marque = marge ÷ prix de vente × 100 (7 000 ÷ 10 000 = 70 %). */
export function markRate(margin: number, salePrice: number): number | null {
  if (salePrice <= 0) return null;
  return (margin / salePrice) * 100;
}

/** Prix HT depuis un TTC (TVA 18 % CI) — désactivable via le paramètre rate. */
export function priceExVat(ttc: number, vatRatePct = 18): number {
  if (vatRatePct <= 0) return ttc;
  return ttc / (1 + vatRatePct / 100);
}

/** Montant de TVA contenu dans un prix TTC. */
export function vatAmount(ttc: number, vatRatePct = 18): number {
  return ttc - priceExVat(ttc, vatRatePct);
}

/** Coût de revient = matières + main-d'œuvre + charges (champs optionnels). */
export function fullCost(matterCost: number, laborCost = 0, overheadCost = 0): number {
  return matterCost + (laborCost || 0) + (overheadCost || 0);
}

/* ------------------------------------------------------------------ */
/* 3.7 Allergènes                                                      */
/* ------------------------------------------------------------------ */

export const ALLERGENS = [
  'gluten',
  'arachides',
  'poisson',
  'crustacés',
  'œufs',
  'lait',
  'soja',
  'fruits à coque',
  'céleri',
  'moutarde',
  'sésame',
  'sulfites',
  'lupin',
  'mollusques',
] as const;

export type Allergen = (typeof ALLERGENS)[number];

/** La recette hérite de l'union des allergènes de ses ingrédients. */
export function recipeAllergens(
  recipe: Pick<Recipe, 'lines'>,
  ingredientById: Map<string, Ingredient>,
): Allergen[] {
  const set = new Set<Allergen>();
  for (const line of recipe.lines) {
    const ing = ingredientById.get(line.ingredientId);
    for (const a of ing?.allergens ?? []) set.add(a as Allergen);
  }
  return ALLERGENS.filter((a) => set.has(a));
}

/* ------------------------------------------------------------------ */
/* 3.8 Analyse du menu (ingénierie de menu)                            */
/* ------------------------------------------------------------------ */

export type MenuEngineeringClass = 'star' | 'vache-a-lait' | 'enigme' | 'poids-mort';

export const MENU_ENGINEERING_LABELS: Record<MenuEngineeringClass, string> = {
  star: 'Star',
  'vache-a-lait': 'Vache à lait',
  enigme: 'Énigme',
  'poids-mort': 'Poids mort',
};

/**
 * Classe un plat selon popularité (part des ventes) × rentabilité (marge).
 * Seuil popularité : 70 % de la moyenne (méthode classique) ; seuil marge :
 * marge moyenne de la carte.
 */
export function menuEngineering(
  items: { id: string; sold: number; margin: number }[],
): Record<string, MenuEngineeringClass> {
  const out: Record<string, MenuEngineeringClass> = {};
  if (items.length === 0) return out;
  const totalSold = items.reduce((s, i) => s + i.sold, 0);
  const avgShare = totalSold > 0 ? (1 / items.length) * 0.7 : 0;
  const avgMargin = items.reduce((s, i) => s + i.margin, 0) / items.length;
  for (const it of items) {
    const popular = totalSold > 0 && it.sold / totalSold >= avgShare;
    const profitable = it.margin >= avgMargin;
    out[it.id] = popular
      ? profitable
        ? 'star'
        : 'vache-a-lait'
      : profitable
        ? 'enigme'
        : 'poids-mort';
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* 3.8 Inventaire & consommation                                       */
/* ------------------------------------------------------------------ */

/** Consommation réelle = stock initial + achats − stock final. */
export function realConsumption(initialStock: number, purchases: number, finalStock: number): number {
  return initialStock + purchases - finalStock;
}

/** Écart d'inventaire = consommation réelle − consommation théorique. */
export function inventoryVariance(real: number, theoretical: number): number {
  return real - theoretical;
}

/* ------------------------------------------------------------------ */
/* 3.8 Alertes prix                                                    */
/* ------------------------------------------------------------------ */

/** true si le prix a augmenté de plus du seuil (5 % par défaut). */
export function priceIncreaseAlert(previous: number, current: number, thresholdPct = 5): boolean {
  if (previous <= 0) return false;
  return ((current - previous) / previous) * 100 > thresholdPct;
}
