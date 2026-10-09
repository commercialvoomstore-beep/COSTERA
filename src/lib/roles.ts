// COSTERA — Rôles et droits d'accès (cahier des charges, section 4)
import type { Role } from './types';

export type Capability =
  | 'manageIngredients' // créer / modifier / supprimer des ingrédients
  | 'updatePrices' // saisir un nouveau prix d'achat
  | 'manageRecipes' // CRUD fiches techniques
  | 'manageMenus' // CRUD menus
  | 'manageSettings' // paramètres de la plateforme
  | 'manageTeam'; // gestion des utilisateurs

const MATRIX: Record<Role, Capability[]> = {
  admin: ['manageIngredients', 'updatePrices', 'manageRecipes', 'manageMenus', 'manageSettings', 'manageTeam'],
  gestionnaire: ['manageIngredients', 'updatePrices', 'manageRecipes', 'manageMenus'],
  chef: ['updatePrices', 'manageRecipes'],
};

export function can(role: Role, capability: Capability): boolean {
  return MATRIX[role].includes(capability);
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrateur',
  gestionnaire: 'Gestionnaire',
  chef: 'Chef de cuisine',
};
