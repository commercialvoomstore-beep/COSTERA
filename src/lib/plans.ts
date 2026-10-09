// COSTERA — Forfaits FREE / SILVER / GOLD : niveaux d'accès, quotas,
// règles d'accès au contenu et moyens de paiement.
//
// Les valeurs numériques (prix, quotas, tailles vidéo) sont des DÉFAUTS
// utilisés uniquement au seed. À l'exécution, tout est lu depuis
// `settings` (modifiable par l'admin dans les paramètres).

export type PlanLevel = 'free' | 'silver' | 'gold';

/** Ordre hiérarchique : plus le rang est haut, plus l'accès est large. */
export const PLAN_RANK: Record<PlanLevel, number> = { free: 0, silver: 1, gold: 2 };

export const PLAN_ORDER: PlanLevel[] = ['free', 'silver', 'gold'];

export const PLAN_LABELS: Record<PlanLevel, string> = {
  free: 'FREE COSTERA',
  silver: 'SILVER COSTERA',
  gold: 'GOLD COSTERA',
};

export const PLAN_SHORT: Record<PlanLevel, string> = {
  free: 'FREE',
  silver: 'SILVER',
  gold: 'GOLD',
};

/** Libellé du niveau requis affiché sur un contenu verrouillé. */
export function requiredLevelLabel(content: PlanLevel): string {
  return PLAN_SHORT[content];
}

/**
 * Règle d'accès : un compte voit les contenus de son niveau ET des niveaux
 * inférieurs. `account` est le niveau EFFECTIF du compte (déjà résolu :
 * expiration, admin…). Retourne true si le contenu est accessible.
 */
export function canAccessLevel(account: PlanLevel, content: PlanLevel): boolean {
  return PLAN_RANK[account] >= PLAN_RANK[content];
}

/** Le niveau immédiatement supérieur (pour « Débloquer avec X »), ou null. */
export function nextLevel(current: PlanLevel): PlanLevel | null {
  const idx = PLAN_ORDER.indexOf(current);
  return idx >= 0 && idx < PLAN_ORDER.length - 1 ? PLAN_ORDER[idx + 1] : null;
}

/**
 * Niveau minimal nécessaire pour débloquer un contenu donné (pour le bouton
 * « Débloquer avec SILVER / GOLD »). C'est simplement le niveau du contenu,
 * sauf si le compte est déjà au-dessus (alors accessible → null).
 */
export function unlockLevelFor(account: PlanLevel, content: PlanLevel): PlanLevel | null {
  if (canAccessLevel(account, content)) return null;
  return content;
}

/* ------------------------------------------------------------------ */
/* Défauts de configuration (seed). L'exécution lit `settings`.        */
/* ------------------------------------------------------------------ */

export const DEFAULT_QUOTAS: Record<PlanLevel, number> = {
  free: 5,
  silver: 10,
  gold: -1, // -1 = illimité
};

/** Valeur sentinel pour « illimité ». */
export const UNLIMITED = -1;

export const DEFAULT_PRICES_FCFA = {
  silver: { monthly: 15000, yearly: 150000 },
  gold: { monthly: 35000, yearly: 350000 },
} as const;

export const DEFAULT_VIDEO_LIMITS = {
  freeMaxMb: 0, // FREE : lien externe uniquement
  silverMaxMb: 100,
  goldMaxMb: 500,
} as const;

export const DEFAULT_TVA_PCT = 18;

/** Quota de menus pour un niveau donné (lit settings si fourni). */
export function quotaFor(level: PlanLevel, quotas?: Partial<Record<PlanLevel, number>>): number {
  const q = quotas?.[level];
  if (typeof q === 'number') return q;
  return DEFAULT_QUOTAS[level];
}

export function isUnlimited(quota: number): boolean {
  return quota === UNLIMITED || quota < 0;
}

/* ------------------------------------------------------------------ */
/* Moyens de paiement (contexte Côte d'Ivoire)                          */
/* ------------------------------------------------------------------ */

export interface PaymentMethod {
  id: string;
  label: string;
  kind: 'mobile' | 'bancaire' | 'carte';
  /** Numéro marchand / RIB affiché dans les instructions. */
  merchant?: string;
  instructions: string;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'orange-money',
    label: 'Orange Money',
    kind: 'mobile',
    merchant: '+225 07 00 00 00 00',
    instructions:
      'Composez #144# ou utilisez l’application Orange Money. Envoyez le montant exact au numéro marchand ci-dessus en indiquant la référence de commande.',
  },
  {
    id: 'mtn-momo',
    label: 'MTN MoMo',
    kind: 'mobile',
    merchant: '+225 05 00 00 00 00',
    instructions:
      'Composez *133# ou utilisez l’application MTN MoMo. Transférez le montant exact vers le numéro marchand en précisant la référence.',
  },
  {
    id: 'moov-money',
    label: 'Moov Money',
    kind: 'mobile',
    merchant: '+225 01 00 00 00 00',
    instructions:
      'Composez *155# ou utilisez Moov Money. Envoyez le montant exact au numéro marchand avec la référence de commande.',
  },
  {
    id: 'wave',
    label: 'Wave',
    kind: 'mobile',
    merchant: '+225 07 11 22 33 44',
    instructions:
      'Ouvrez l’application Wave, choisissez « Envoyer », saisissez le numéro marchand et le montant exact, puis indiquez la référence.',
  },
  {
    id: 'virement',
    label: 'Virement bancaire',
    kind: 'bancaire',
    merchant: 'RIB : CI059 01234 5678 9012 3456 789 · Banque VOOMNET',
    instructions:
      'Effectuez un virement du montant exact vers le RIB ci-dessus. Indiquez la référence de commande en motif du virement, puis téléversez l’avis d’opération.',
  },
  {
    id: 'carte',
    label: 'Carte bancaire',
    kind: 'carte',
    instructions:
      'Le paiement par carte sera disponible dès qu’une passerelle sera configurée par l’administrateur. En attendant, choisissez un autre moyen.',
  },
];

export function paymentMethodById(id: string): PaymentMethod | undefined {
  return PAYMENT_METHODS.find((m) => m.id === id);
}

/* ------------------------------------------------------------------ */
/* Thèmes et polices des cartes                                        */
/* ------------------------------------------------------------------ */

export const CARD_TYPE_LABELS: Record<string, string> = {
  cuisine: 'Cuisine / Plats',
  boissons: 'Boissons',
  desserts: 'Desserts',
  'petit-dejeuner': 'Petit-déjeuner',
  'cocktails-bar': 'Cocktails & bar',
  'menu-enfant': 'Menu enfant',
  'menu-degustation': 'Menu dégustation',
  evenementielle: 'Carte événementielle',
  personnalise: 'Type personnalisé',
};

export interface CardThemeDef {
  id: string;
  label: string;
  /** Classes utilitaires appliquées au rendu de la carte. */
  bg: string;
  ink: string;
  accent: string;
}

export const CARD_THEMES: CardThemeDef[] = [
  { id: 'grand-hotel', label: 'Grand Hôtel violet et or', bg: 'bg-[#241238]', ink: 'text-[#F8F4EB]', accent: '#E2C275' },
  { id: 'maquis', label: 'Maquis ivoirien chaleureux', bg: 'bg-[#3a2410]', ink: 'text-[#FBEEDD]', accent: '#D98245' },
  { id: 'bistro', label: 'Bistro moderne', bg: 'bg-[#101418]', ink: 'text-[#F2F4F6]', accent: '#9ad1c9' },
  { id: 'lounge-nuit', label: 'Lounge nuit', bg: 'bg-[#120a2a]', ink: 'text-[#E8E4F8]', accent: '#B89AE8' },
];

export const CARD_FONTS = [
  { id: 'classique', label: 'Classique (Playfair)' },
  { id: 'moderne', label: 'Moderne (Inter)' },
  { id: 'affiche', label: 'Affiche (Cormorant)' },
] as const;

export type CardFontId = (typeof CARD_FONTS)[number]['id'];

/* ------------------------------------------------------------------ */
/* Résolution de la configuration (défauts + overrides admin)          */
/* ------------------------------------------------------------------ */

import type { PlanConfig, Settings, User } from './types';

/**
 * Construit la configuration effective des forfaits en fusionnant les
 * valeurs par défaut avec celles saisies par l'admin dans `settings`.
 */
export function resolvePlanConfig(settings?: Pick<Settings, 'plans'> | null): PlanConfig {
  const p = settings?.plans;
  return {
    prices: {
      silver: {
        monthly: p?.prices?.silver?.monthly ?? DEFAULT_PRICES_FCFA.silver.monthly,
        yearly: p?.prices?.silver?.yearly ?? DEFAULT_PRICES_FCFA.silver.yearly,
      },
      gold: {
        monthly: p?.prices?.gold?.monthly ?? DEFAULT_PRICES_FCFA.gold.monthly,
        yearly: p?.prices?.gold?.yearly ?? DEFAULT_PRICES_FCFA.gold.yearly,
      },
    },
    quotas: {
      free: p?.quotas?.free ?? DEFAULT_QUOTAS.free,
      silver: p?.quotas?.silver ?? DEFAULT_QUOTAS.silver,
      gold: p?.quotas?.gold ?? DEFAULT_QUOTAS.gold,
    },
    videoMaxMb: {
      free: p?.videoMaxMb?.free ?? DEFAULT_VIDEO_LIMITS.freeMaxMb,
      silver: p?.videoMaxMb?.silver ?? DEFAULT_VIDEO_LIMITS.silverMaxMb,
      gold: p?.videoMaxMb?.gold ?? DEFAULT_VIDEO_LIMITS.goldMaxMb,
    },
    tvaPct: p?.tvaPct ?? DEFAULT_TVA_PCT,
    tvaEnabled: p?.tvaEnabled ?? true,
  };
}

/**
 * Niveau EFFECTIF d'un compte :
 * - un administrateur agit toujours comme GOLD ;
 * - un abonnement expiré retombe à FREE ;
 * - sinon le forfait enregistré.
 */
export function effectivePlan(user: Pick<User, 'role' | 'plan' | 'planExpiresAt'>, now: Date = new Date()): PlanLevel {
  if (user.role === 'admin') return 'gold';
  if (user.plan && user.plan !== 'free' && user.planExpiresAt) {
    if (new Date(user.planExpiresAt).getTime() < now.getTime()) return 'free';
  }
  return user.plan ?? 'free';
}

export function planIsExpired(user: Pick<User, 'plan' | 'planExpiresAt'>, now: Date = new Date()): boolean {
  if (!user.plan || user.plan === 'free' || !user.planExpiresAt) return false;
  return new Date(user.planExpiresAt).getTime() < now.getTime();
}
