import {
  BookOpen,
  Percent,
  Salad,
  ShieldCheck,
  TrendingUp,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';

/**
 * Données de la section « FONCTIONNALITÉS : Tout ce qu'il faut pour piloter
 * votre cuisine ». Les 6 cartes conservent leurs titres, textes et icônes
 * d'origine ; chaque carte reçoit en plus une image de fond (révélée au
 * survol) et un texte alternatif descriptif en français.
 *
 * `image` est un chemin sans extension : le composant charge
 * `${image}.webp` (source) avec `${image}.jpg` en secours.
 */
export type FeatureItem = {
  title: string;
  text: string;
  icon: LucideIcon;
  image: string;
  imageAlt: string;
  href: string;
};

export const FEATURES: FeatureItem[] = [
  {
    icon: Percent,
    title: 'Food cost & coût matière',
    text: 'Chaque fiche technique calcule automatiquement son coût matière, son ratio matière sur vente, sa marge et son coefficient multiplicateur.',
    image: '/images/features/feature-foodcost',
    imageAlt:
      'Mains d’un chef ivoirien pesant des ingrédients frais sur une balance de cuisine : tomates, piments et oignons, avec calculatrice et carnet',
    href: '/decouvrir',
  },
  {
    icon: BookOpen,
    title: 'Fiches techniques structurées',
    text: 'Ingrédients, quantités, unités, taux de perte, progression en étapes et rendement : vos recettes deviennent des documents de gestion.',
    image: '/images/features/feature-fiches',
    imageAlt:
      'Chef africain en veste blanche annotant une fiche technique sur une tablette dans une cuisine de restaurant à Abidjan',
    href: '/decouvrir',
  },
  {
    icon: TrendingUp,
    title: 'Suivi des prix d’achat',
    text: 'Historique de prix par ingrédient, fournisseurs, variations et alertes : le marché ne vous surprend plus jamais.',
    image: '/images/features/feature-prix',
    imageAlt:
      'Étal coloré d’un marché d’Abidjan : tomates, aubergines, poissons frais et bananes plantains, avec une vendeuse ivoirienne souriante',
    href: '/decouvrir',
  },
  {
    icon: UtensilsCrossed,
    title: 'Menus rentables',
    text: 'Composez vos menus par sections, publiez-les sur la vitrine et visualisez la rentabilité plat par plat.',
    image: '/images/features/feature-menus',
    imageAlt:
      'Plat gastronomique ivoirien dressé avec élégance : poisson braisé, attiéké, alloco et sauce tomate sur une assiette sombre',
    href: '/decouvrir',
  },
  {
    icon: Salad,
    title: 'Pensé pour la cuisine ivoirienne',
    text: 'Attiéké, garba, kedjenou, sauce graine, placali… avec les unités locales : botte, cube, boîte, pièce, et le franc CFA comme devise native.',
    image: '/images/features/feature-ivoirienne',
    imageAlt:
      'Marmite de kédjénou fumante entourée de sauce graine, foutou et placali dans une cuisine traditionnelle ivoirienne',
    href: '/decouvrir',
  },
  {
    icon: ShieldCheck,
    title: 'Rôles & droits d’accès',
    text: 'Administrateur, gestionnaire, chef de cuisine : chacun agit dans son périmètre, la direction garde la main sur les paramètres.',
    image: '/images/features/feature-roles',
    imageAlt:
      'Brigade de cuisine africaine en vestes blanches travaillant ensemble dans la cuisine d’un grand hôtel',
    href: '/decouvrir',
  },
];
