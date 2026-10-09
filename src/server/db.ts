// COSTERA — Persistance JSON locale (démo V1, section 8 du cahier des charges)
// La base est initialisée automatiquement avec les données de démonstration.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import type {
  AppNotification,
  Card,
  Dish,
  Ingredient,
  Menu,
  PaymentRequest,
  Recipe,
  Settings,
  Subscription,
  User,
} from '@/lib/types';
import { buildSeed } from './seed';

const DATA_DIR = path.join(process.cwd(), 'data');
/** Espace PRIVÉ des fichiers téléversés (justificatifs, vidéos, images). */
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

export interface DB {
  users: User[];
  ingredients: Ingredient[];
  recipes: Recipe[];
  menus: Menu[];
  settings: Settings;
  cards: Card[];
  dishes: Dish[];
  subscriptions: Subscription[];
  paymentRequests: PaymentRequest[];
  notifications: AppNotification[];
}

function file(name: keyof DB): string {
  return path.join(DATA_DIR, `${name}.json`);
}

function readOrEmpty<T>(name: keyof DB): T[] {
  if (!existsSync(file(name))) return [];
  try {
    const raw = JSON.parse(readFileSync(file(name), 'utf8'));
    return Array.isArray(raw) ? (raw as T[]) : [];
  } catch {
    return [];
  }
}

let cache: DB | null = null;

export function getDB(): DB {
  if (cache) return cache;
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });
  if (!existsSync(file('users'))) {
    const seed = buildSeed();
    (Object.keys(seed) as (keyof typeof seed)[]).forEach((key) => {
      writeFileSync(file(key), JSON.stringify(seed[key], null, 2), 'utf8');
    });
    // Les collections apparues après le seed initial démarrent vides.
    for (const empty of ['cards', 'dishes', 'subscriptions', 'paymentRequests', 'notifications'] as const) {
      if (!existsSync(file(empty))) writeFileSync(file(empty), '[]', 'utf8');
    }
  }
  const menus = JSON.parse(readFileSync(file('menus'), 'utf8')) as Menu[];
  // Migration douce (jamais de réinitialisation) : les menus de démonstration
  // historiques sont visibles sur la vitrine ; tout autre menu reste privé.
  let migrated = false;
  for (const m of menus) {
    if (m.published === undefined && (m.id === 'menu-dejeuner' || m.id === 'menu-gala')) {
      m.published = true;
      migrated = true;
    }
  }

  const users = JSON.parse(readFileSync(file('users'), 'utf8')) as User[];
  // Migration douce : tout compte sans forfait passe à FREE (jamais destructif).
  for (const u of users) {
    if (!u.plan) u.plan = 'free';
  }

  const settings = JSON.parse(readFileSync(file('settings'), 'utf8')) as Settings;

  cache = {
    users,
    ingredients: JSON.parse(readFileSync(file('ingredients'), 'utf8')) as Ingredient[],
    recipes: JSON.parse(readFileSync(file('recipes'), 'utf8')) as Recipe[],
    menus,
    settings,
    cards: readOrEmpty<Card>('cards'),
    dishes: readOrEmpty<Dish>('dishes'),
    subscriptions: readOrEmpty<Subscription>('subscriptions'),
    paymentRequests: readOrEmpty<PaymentRequest>('paymentRequests'),
    notifications: readOrEmpty<AppNotification>('notifications'),
  };
  if (migrated) writeFileSync(file('menus'), JSON.stringify(menus, null, 2), 'utf8');
  return cache;
}

export function saveDB(next: DB): void {
  cache = next;
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(file('users'), JSON.stringify(next.users, null, 2), 'utf8');
  writeFileSync(file('ingredients'), JSON.stringify(next.ingredients, null, 2), 'utf8');
  writeFileSync(file('recipes'), JSON.stringify(next.recipes, null, 2), 'utf8');
  writeFileSync(file('menus'), JSON.stringify(next.menus, null, 2), 'utf8');
  writeFileSync(file('settings'), JSON.stringify(next.settings, null, 2), 'utf8');
  writeFileSync(file('cards'), JSON.stringify(next.cards, null, 2), 'utf8');
  writeFileSync(file('dishes'), JSON.stringify(next.dishes, null, 2), 'utf8');
  writeFileSync(file('subscriptions'), JSON.stringify(next.subscriptions, null, 2), 'utf8');
  writeFileSync(file('paymentRequests'), JSON.stringify(next.paymentRequests, null, 2), 'utf8');
  writeFileSync(file('notifications'), JSON.stringify(next.notifications, null, 2), 'utf8');
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

/* ------------------------------------------------------------------ */
/* Stockage privé des fichiers téléversés                              */
/* ------------------------------------------------------------------ */

const SAFE_NAME = /^[a-zA-Z0-9._-]+$/;

/**
 * Enregistre un fichier dans l'espace privé et retourne son id (nom de
 * fichier sûr). Le dossier est HORS de /public : jamais servi tel quel.
 */
export function saveUpload(subdir: string, fileName: string, buffer: Buffer): string {
  const dir = path.join(UPLOADS_DIR, subdir);
  mkdirSync(dir, { recursive: true });
  const ext = path.extname(fileName).toLowerCase();
  const id = `${newId('f')}${ext}`;
  writeFileSync(path.join(dir, id), buffer);
  return `${subdir}/${id}`;
}

/** Résout un id de fichier privé en chemin absolu, ou null si invalide. */
export function resolveUploadPath(fileId: string): string | null {
  if (!fileId) return null;
  // Empêche toute traversée de chemin (..).
  if (fileId.includes('..') || fileId.includes('\\')) return null;
  const parts = fileId.split('/');
  if (parts.length !== 2 || !SAFE_NAME.test(parts[0]) || !SAFE_NAME.test(parts[1])) return null;
  const full = path.join(UPLOADS_DIR, parts[0], parts[1]);
  if (!full.startsWith(UPLOADS_DIR)) return null;
  return existsSync(full) ? full : null;
}
