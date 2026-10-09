// COSTERA — Modèle de données (cahier des charges, section 10)

export type Role = 'admin' | 'gestionnaire' | 'chef';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  passwordHash: string;
  createdAt: string;
}

export type UnitKind = 'masse' | 'volume' | 'piece' | 'conditionnement';

export interface Unit {
  id: string;
  label: string;
  abbr: string;
  kind: UnitKind;
  /** Facteur de conversion vers l'unité de base de la dimension (kg, l, pièce). */
  toBase?: number;
}

export interface PriceEntry {
  price: number;
  date: string; // ISO yyyy-mm-dd
  note?: string;
}

export const INGREDIENT_CATEGORIES = [
  'Viandes & volailles',
  'Poissons & fruits de mer',
  'Féculents & céréales',
  'Légumes & tubercules',
  'Fruits',
  'Œufs & produits laitiers',
  'Huiles & matières grasses',
  'Épices & condiments',
  'Boissons',
  'Autres',
] as const;

export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number];

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  /** Unité d'achat. */
  unitId: string;
  /** Prix actuel par unité d'achat, en FCFA. */
  price: number;
  supplier?: string;
  /** Taux de perte (épluchage, cuisson…) en %. */
  lossPct: number;
  /** Historique de prix trié par date croissante. */
  history: PriceEntry[];
  /** Valeurs nutritionnelles pour 100 g d'ingrédient. */
  nutrition?: { kcal: number; protein: number; carbs: number; fat: number };
  /** Grammes par unité de base (pièce, botte, boîte, litre…) si différent de 1000. */
  baseUnitGrams?: number;
  createdAt: string;
  updatedAt: string;
}

export const RECIPE_CATEGORIES = [
  'Entrées',
  'Plats',
  'Accompagnements',
  'Desserts',
  'Boissons',
] as const;

export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number];

export type RecipeStatus = 'active' | 'brouillon' | 'archivee';

export interface RecipeLine {
  id: string;
  ingredientId: string;
  qty: number;
  unitId: string;
  note?: string;
}

export interface Recipe {
  id: string;
  name: string;
  category: RecipeCategory;
  /** Nombre de portions (rendement). */
  portions: number;
  /** Prix de vente TTC à la portion, en FCFA. */
  salePrice: number;
  status: RecipeStatus;
  lines: RecipeLine[];
  steps: string[];
  notes?: string;
  /** Description complète pour la vitrine publique. */
  description?: string;
  /** Temps de cuisson total en minutes. */
  cookTimeMin?: number;
  /** Chef auteur de la recette. */
  chef?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MenuSection {
  id: string;
  title: string;
  recipeIds: string[];
}

export interface Menu {
  id: string;
  name: string;
  description?: string;
  sections: MenuSection[];
  /**
   * Visibilité sur la vitrine publique « Découvrir les menus ».
   * Strictement privé par défaut : seul un menu explicitement publié apparaît.
   */
  published?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  orgName: string;
  /** Objectif de food cost (ratio matière sur vente) en %. */
  targetFoodCostPct: number;
  currency: 'XOF';
  country: string;
}
