// COSTERA — Unités et conversions (cahier des charges, section 6)
import type { Unit } from './types';

export const UNITS: Unit[] = [
  // Masse (base : kilogramme)
  { id: 'kg', label: 'Kilogramme', abbr: 'kg', kind: 'masse', toBase: 1 },
  { id: 'g', label: 'Gramme', abbr: 'g', kind: 'masse', toBase: 0.001 },
  { id: 'mg', label: 'Milligramme', abbr: 'mg', kind: 'masse', toBase: 0.000001 },
  // Volume (base : litre)
  { id: 'l', label: 'Litre', abbr: 'l', kind: 'volume', toBase: 1 },
  { id: 'cl', label: 'Centilitre', abbr: 'cl', kind: 'volume', toBase: 0.01 },
  { id: 'ml', label: 'Millilitre', abbr: 'ml', kind: 'volume', toBase: 0.001 },
  // Pièce
  { id: 'piece', label: 'Pièce', abbr: 'pce', kind: 'piece', toBase: 1 },
  // Conditionnements (pas de conversion inter-conditionnements)
  { id: 'botte', label: 'Botte', abbr: 'botte', kind: 'conditionnement' },
  { id: 'boite', label: 'Boîte', abbr: 'boîte', kind: 'conditionnement' },
  { id: 'sachet', label: 'Sachet', abbr: 'sachet', kind: 'conditionnement' },
  { id: 'cube', label: 'Cube', abbr: 'cube', kind: 'conditionnement' },
];

export function unitById(id: string): Unit | undefined {
  return UNITS.find((u) => u.id === id);
}

export function unitAbbr(id: string): string {
  return unitById(id)?.abbr ?? id;
}

/**
 * Convertit une quantité d'une unité vers une autre.
 * Retourne `null` si la conversion est impossible (dimensions différentes,
 * conditionnements sans équivalence).
 */
export function convert(qty: number, fromId: string, toId: string): number | null {
  if (fromId === toId) return qty;
  const from = unitById(fromId);
  const to = unitById(toId);
  if (!from || !to) return null;
  if (from.kind !== to.kind) return null;
  if (from.toBase === undefined || to.toBase === undefined) return null;
  return (qty * from.toBase) / to.toBase;
}

/** Groupes d'unités pour les listes déroulantes. */
export const UNIT_GROUPS: { label: string; unitIds: string[] }[] = [
  { label: 'Masse', unitIds: ['kg', 'g', 'mg'] },
  { label: 'Volume', unitIds: ['l', 'cl', 'ml'] },
  { label: 'Pièce', unitIds: ['piece'] },
  { label: 'Conditionnement', unitIds: ['botte', 'boite', 'sachet', 'cube'] },
];
