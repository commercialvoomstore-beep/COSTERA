// COSTERA — Modèle de données (cahier des charges, section 10)
import type { PlanLevel } from './plans';

export type Role = 'admin' | 'gestionnaire' | 'chef';

export type { PlanLevel };

/** Profil public du chef / de l'établissement (section 6). */
export interface ChefProfile {
  /** Nom d'entreprise / d'établissement affiché si mode = business. */
  businessName?: string;
  /** Choix d'affichage : nom personnel ou nom d'entreprise. */
  displayNameMode?: 'personal' | 'business';
  /** Photo / logo (id de fichier privé ou chemin statique). */
  logoFileId?: string;
  bio?: string;
  specialties?: string[];
  city?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  address?: string;
  hours?: string;
  certifications?: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  passwordHash: string;
  createdAt: string;
  /** Forfait actif du compte (défaut : free). */
  plan?: PlanLevel;
  /** Début de l'abonnement courant. */
  planStartedAt?: string;
  /** Fin de l'abonnement courant (absent = pas d'expiration). */
  planExpiresAt?: string;
  /** Profil public (chefs). */
  profile?: ChefProfile;
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
  nutrition?: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    iron?: number; // mg
    calcium?: number; // mg
    potassium?: number; // mg
    vitA?: number; // µg
    vitC?: number; // mg
  };
  /** Allergènes réglementaires présents dans l'ingrédient. */
  allergens?: string[];
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

export interface PlanPricing {
  monthly: number;
  yearly: number;
}

export interface PlanConfig {
  /** Prix mensuel / annuel en FCFA (modifiable par l'admin). */
  prices: { silver: PlanPricing; gold: PlanPricing };
  /** Quota de menus par niveau (-1 = illimité). */
  quotas: Record<PlanLevel, number>;
  /** Tailles maximales vidéo (Mo) par niveau ; 0 = lien externe uniquement. */
  videoMaxMb: Record<PlanLevel, number>;
  /** TVA en % et activation. */
  tvaPct: number;
  tvaEnabled: boolean;
}

export interface Settings {
  orgName: string;
  /** Objectif de food cost (ratio matière sur vente) en %. */
  targetFoodCostPct: number;
  currency: 'XOF';
  country: string;
  /** Configuration des forfaits (prix, quotas, vidéo, TVA). */
  plans?: PlanConfig;
}

/* ------------------------------------------------------------------ */
/* Vidéos explicatives (section 4)                                     */
/* ------------------------------------------------------------------ */

export interface VideoChapter {
  /** Horodatage en secondes. */
  t: number;
  label: string;
}

export interface VideoInfo {
  kind: 'youtube' | 'vimeo' | 'file';
  /** ID extrait pour YouTube / Vimeo. */
  externalId?: string;
  /** URL d'origine (lien externe). */
  url?: string;
  /** Fichier vidéo téléversé (id privé). */
  fileId?: string;
  title?: string;
  durationSec?: number;
  /** Vignette de couverture (id privé ou chemin statique). */
  posterFileId?: string;
  chapters?: VideoChapter[];
}

/* ------------------------------------------------------------------ */
/* Cartes & plats (sections 5 & 1)                                     */
/* ------------------------------------------------------------------ */

export type CardType =
  | 'cuisine'
  | 'boissons'
  | 'desserts'
  | 'petit-dejeuner'
  | 'cocktails-bar'
  | 'menu-enfant'
  | 'menu-degustation'
  | 'evenementielle'
  | 'personnalise';

export type CardThemeId = 'grand-hotel' | 'maquis' | 'bistro' | 'lounge-nuit';
export type CardStatus = 'brouillon' | 'publiee';

export interface Card {
  id: string;
  ownerId: string;
  type: CardType;
  customType?: string;
  name: string;
  slogan?: string;
  /** Photo de couverture HD (id privé ou chemin statique). */
  coverFileId?: string;
  theme: CardThemeId;
  accentColor?: string;
  font: 'classique' | 'moderne' | 'affiche';
  /** Niveau d'accès de la carte elle-même. */
  level: PlanLevel;
  status: CardStatus;
  /** Lien de partage public. */
  shareSlug: string;
  /** Catégories ordonnées (Entrées, Plats…). */
  categories: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Dish {
  id: string;
  cardId: string;
  ownerId: string;
  name: string;
  description?: string;
  /** Prix en FCFA. */
  price: number;
  /** Photo (id privé ou chemin statique). */
  photoFileId?: string;
  category?: string;
  /** Niveau d'accès du plat (free / silver / gold). */
  level: PlanLevel;
  allergens: string[];
  video?: VideoInfo;
  /** Lien vers la fiche technique / food cost existante. */
  recipeId?: string;
  status: 'brouillon' | 'publiee';
  /** Ordre d'affichage dans la carte. */
  sortIndex: number;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* Abonnements & demandes de paiement (section 3)                      */
/* ------------------------------------------------------------------ */

export type PaymentStatus = 'en_attente' | 'validee' | 'refusee' | 'expiree';
export type PaymentPeriod = 'mensuel' | 'annuel';

export interface PaymentRequest {
  id: string;
  /** Référence unique de commande, ex. CST-2026-000123. */
  ref: string;
  userId: string;
  plan: PlanLevel;
  period: PaymentPeriod;
  amountHt: number;
  tvaAmount: number;
  amountTotal: number;
  /** Moyen de paiement choisi (id PAYMENT_METHODS). */
  methodId?: string;
  /** Justificatif téléversé (id de fichier privé). */
  proofFileId?: string;
  proofFileName?: string;
  /** Référence de transaction & numéro utilisé (saisis par l'utilisateur). */
  txReference?: string;
  txNumber?: string;
  status: PaymentStatus;
  createdAt: string;
  submittedAt?: string;
  decidedAt?: string;
  decidedBy?: string;
  refuseReason?: string;
  /** Journal d'audit. */
  audit: { action: string; by?: string; at: string; note?: string }[];
}

export interface Subscription {
  id: string;
  userId: string;
  plan: PlanLevel;
  period: PaymentPeriod;
  amount: number;
  startedAt: string;
  expiresAt?: string;
  paymentRequestId?: string;
  /** Reçu téléchargeable (id de fichier privé généré). */
  receiptFileId?: string;
}

/* ------------------------------------------------------------------ */
/* Notifications in-app (section 3 & 7)                                */
/* ------------------------------------------------------------------ */

export type NotificationKind = 'info' | 'success' | 'warning' | 'payment';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body?: string;
  kind: NotificationKind;
  read: boolean;
  link?: string;
  createdAt: string;
}

