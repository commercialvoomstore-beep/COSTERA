// COSTERA — Persistance JSON locale (démo V1, section 8 du cahier des charges)
// La base est initialisée automatiquement avec les données de démonstration.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import type { Ingredient, Menu, Recipe, Settings, User } from '@/lib/types';
import { buildSeed } from './seed';

const DATA_DIR = path.join(process.cwd(), 'data');

export interface DB {
  users: User[];
  ingredients: Ingredient[];
  recipes: Recipe[];
  menus: Menu[];
  settings: Settings;
}

function file(name: keyof DB): string {
  return path.join(DATA_DIR, `${name}.json`);
}

let cache: DB | null = null;

export function getDB(): DB {
  if (cache) return cache;
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(file('users'))) {
    const seed = buildSeed();
    (Object.keys(seed) as (keyof DB)[]).forEach((key) => {
      writeFileSync(file(key), JSON.stringify(seed[key], null, 2), 'utf8');
    });
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
  cache = {
    users: JSON.parse(readFileSync(file('users'), 'utf8')) as User[],
    ingredients: JSON.parse(readFileSync(file('ingredients'), 'utf8')) as Ingredient[],
    recipes: JSON.parse(readFileSync(file('recipes'), 'utf8')) as Recipe[],
    menus,
    settings: JSON.parse(readFileSync(file('settings'), 'utf8')) as Settings,
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
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}
