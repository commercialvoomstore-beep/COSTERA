// COSTERA — Formatage (devise FCFA / XOF, dates, pourcentages)

const xofFmt = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

const numFmt = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 });
const numFmt1 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

/** Montant en FCFA, ex. « 1 500 F CFA ». */
export function fcfa(n: number): string {
  return xofFmt.format(Math.round(Number.isFinite(n) ? n : 0));
}

/** Montant FCFA sans le sigle, ex. « 1 500 ». */
export function fcfaNum(n: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(Number.isFinite(n) ? n : 0));
}

/** Pourcentage, ex. « 34,5 % ». */
export function pct(n: number | null, digits: 0 | 1 | 2 = 1): string {
  if (n === null || !Number.isFinite(n)) return '—';
  const fmt = digits === 0 ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }) : digits === 1 ? numFmt1 : numFmt;
  return `${fmt.format(n)} %`;
}

/** Nombre générique (quantités). */
export function num(n: number): string {
  return numFmt.format(n);
}

/** Coefficient multiplicateur, ex. « × 2,86 ». */
export function coef(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return '—';
  return `× ${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(n)}`;
}

/** Date ISO → « 09 oct. 2026 ». */
export function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Date du jour au format ISO yyyy-mm-dd (heure locale). */
export function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** ISO yyyy-mm-dd (il y a n jours). */
export function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
