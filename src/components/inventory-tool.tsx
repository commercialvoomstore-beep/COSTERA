'use client';

// COSTERA — Outil « Inventaire & consommation » : consommation réelle
// (stock initial + achats − stock final) et écart vs consommation théorique,
// calculés en direct pendant la saisie.
import { useState } from 'react';
import { inventoryVariance, realConsumption } from '@/lib/costing-engine';
import { fcfaNum } from '@/lib/format';

export interface InventoryRow {
  ingredientId: string;
  name: string;
  unitLabel: string;
  theoretical: number;
  initial?: number;
  purchases?: number;
  finalStock?: number;
}

export function InventoryTool({ rows }: { rows: InventoryRow[] }) {
  const [vals, setVals] = useState<Record<string, { i: number; p: number; f: number }>>(() =>
    Object.fromEntries(
      rows.map((r) => [r.ingredientId, { i: r.initial ?? 0, p: r.purchases ?? 0, f: r.finalStock ?? 0 }]),
    ),
  );

  const set = (id: string, k: 'i' | 'p' | 'f', v: number) =>
    setVals((s) => ({ ...s, [id]: { ...s[id], [k]: v } }));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px]">
        <thead>
          <tr className="border-b border-stone-100 text-left">
            <th className="th">Ingrédient</th>
            <th className="th">Stock initial</th>
            <th className="th">Achats</th>
            <th className="th">Stock final</th>
            <th className="th">Consommation réelle</th>
            <th className="th">Théorique</th>
            <th className="th">Écart</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const v = vals[r.ingredientId];
            const real = realConsumption(v.i, v.p, v.f);
            const ecart = inventoryVariance(real, r.theoretical);
            const bad = Math.abs(ecart) > r.theoretical * 0.1;
            return (
              <tr key={r.ingredientId} className="border-b border-stone-50">
                <td className="td">
                  <span className="font-semibold text-ink">{r.name}</span>
                  <span className="block text-[11px] text-stone-400">{r.unitLabel}</span>
                </td>
                {(['i', 'p', 'f'] as const).map((k) => (
                  <td key={k} className="td">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      aria-label={`${r.name} — ${k === 'i' ? 'stock initial' : k === 'p' ? 'achats' : 'stock final'}`}
                      className="input w-24 py-1 tabular-nums"
                      value={v[k]}
                      onChange={(e) => set(r.ingredientId, k, Number(e.target.value))}
                    />
                  </td>
                ))}
                <td className="td font-bold text-ink tabular-nums">{fcfaNum(real)} {r.unitLabel}</td>
                <td className="td text-stone-500 tabular-nums">{fcfaNum(r.theoretical)} {r.unitLabel}</td>
                <td className={`td font-bold tabular-nums ${bad ? 'text-red-600' : 'text-forest-700'}`}>
                  {ecart >= 0 ? '+' : '−'}{fcfaNum(Math.abs(ecart))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-3 text-[11px] text-stone-400">
        Consommation réelle = stock initial + achats − stock final. Un écart supérieur à 10 % du théorique
        signale des pertes, des portions non conformes ou des sorties non tracées.
      </p>
    </div>
  );
}
