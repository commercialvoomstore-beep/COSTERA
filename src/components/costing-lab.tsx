'use client';

// COSTERA — CostingLab : le laboratoire de calcul de la fiche technique.
// Jauge de food cost à aiguille, simulateur de prix en temps réel,
// comparateur avant/après (rendement & prix d'achat), compteurs animés,
// mode pédagogique « Comment c'est calculé ? » et export CSV.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, GraduationCap, Info } from 'lucide-react';
import {
  foodCostPct,
  grossMargin,
  markRate,
  marginRate,
  priceFromTargetCost,
  roundCommercial,
  yieldCorrectedPrice,
} from '@/lib/costing-engine';
import { fcfa, pct } from '@/lib/format';

/* Compteur qui défile vers la valeur */
export function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current;
    const to = value;
    prev.current = value;
    if (from === to) return;
    const start = performance.now();
    const dur = 500;
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className="tabular-nums">{format(Math.round(display))}</span>;
}

/* Info-bulle pédagogique */
function Formula({ label, children }: { label: string; children: string }) {
  return (
    <span className="group relative inline-flex">
      <Info size={13} className="cursor-help text-stone-400 transition-colors hover:text-royal-600" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-xl bg-royal-950 px-3 py-2 text-[11px] font-medium leading-relaxed text-ivory opacity-0 shadow-pop transition-opacity duration-200 group-hover:opacity-100">
        <span className="mb-0.5 block font-bold text-gold-300">{label}</span>
        {children}
      </span>
    </span>
  );
}

/* Jauge semi-circulaire à aiguille */
export function FoodCostGauge({ value, target }: { value: number | null; target: number }) {
  const v = value ?? 0;
  const angle = Math.min(60, Math.max(-60, ((v - 30) / 30) * 60)); // -60°..+60°, centré sur 30 %
  const status =
    value === null
      ? { txt: 'Renseignez un prix de vente', color: '#a8a29e' }
      : v < 30
        ? { txt: 'Excellent — rentabilité confortable', color: '#3f9142' }
        : v < 35
          ? { txt: 'Bon — dans l’objectif', color: '#C8A45D' }
          : v < 40
            ? { txt: 'À surveiller de près', color: '#D98245' }
            : { txt: 'Rentabilité en danger', color: '#C0392B' };
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 118" className="w-52" role="img" aria-label={`Food cost ${value === null ? 'inconnu' : pct(value)}`}>
        {[
          { from: -60, to: 0, color: '#3f9142' }, // < 30 %
          { from: 0, to: 10, color: '#C8A45D' }, // 30-35 %
          { from: 10, to: 20, color: '#D98245' }, // 35-40 %
          { from: 20, to: 60, color: '#C0392B' }, // > 40 %
        ].map((z, i) => (
          <path
            key={i}
            d={arcPath(z.from, z.to)}
            stroke={z.color}
            strokeWidth="14"
            fill="none"
            strokeLinecap="butt"
            opacity="0.9"
          />
        ))}
        <g
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: '100px 100px',
            transition: 'transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <line x1="100" y1="100" x2="100" y2="26" stroke="#1A1A2E" strokeWidth="4" strokeLinecap="round" />
          <circle cx="100" cy="100" r="7" fill="#1A1A2E" />
        </g>
      </svg>
      <p className="mt-1 text-sm font-bold" style={{ color: status.color }}>
        {value === null ? '—' : pct(value, 2)}
      </p>
      <p className="text-xs font-medium text-stone-500">{status.txt}</p>
      <p className="mt-0.5 text-[10px] text-stone-400">Objectif maison : {target} %</p>
    </div>
  );
}

function arcPath(fromDeg: number, toDeg: number): string {
  const r = 78;
  const a1 = ((fromDeg - 90) * Math.PI) / 180;
  const a2 = ((toDeg - 90) * Math.PI) / 180;
  const x1 = 100 + r * Math.cos(a1);
  const y1 = 100 + r * Math.sin(a1);
  const x2 = 100 + r * Math.cos(a2);
  const y2 = 100 + r * Math.sin(a2);
  return `M ${x1} ${y1} A ${r} ${r} 0 ${toDeg - fromDeg > 180 ? 1 : 0} 1 ${x2} ${y2}`;
}

export interface CostingLabProps {
  perPortion: number;
  salePrice: number;
  targetPct: number;
  lines: { name: string; qtyLabel: string; cost: number }[];
  recipeName: string;
}

export function CostingLab({ perPortion, salePrice, targetPct, lines, recipeName }: CostingLabProps) {
  const [edu, setEdu] = useState(false);
  const [simPrice, setSimPrice] = useState(salePrice || roundCommercial(perPortion * 3, 50));
  const [cmpPrice, setCmpPrice] = useState(3000);
  const [cmpYieldBefore, setCmpYieldBefore] = useState(100);
  const [cmpYieldAfter, setCmpYieldAfter] = useState(80);

  const simFoodCost = foodCostPct(perPortion, simPrice);
  const simMargin = grossMargin(simPrice, perPortion);
  const simMark = markRate(simMargin, simPrice);

  const before = yieldCorrectedPrice(cmpPrice, cmpYieldBefore);
  const after = yieldCorrectedPrice(cmpPrice, cmpYieldAfter);

  const curve = useMemo(() => {
    // courbe de rentabilité : marge en fonction du prix (pédagogique)
    const pts: string[] = [];
    const min = Math.max(25, Math.ceil((perPortion * 1.1) / 25) * 25);
    const max = Math.max(min + 500, Math.ceil((perPortion * 6) / 25) * 25);
    for (let i = 0; i <= 40; i++) {
      const p = min + ((max - min) * i) / 40;
      const m = grossMargin(p, perPortion);
      const x = 10 + (i / 40) * 280;
      const y = 90 - Math.min(80, (m / (max - perPortion)) * 80);
      pts.push(`${x},${y}`);
    }
    return pts.join(' ');
  }, [perPortion]);

  function exportCsv() {
    const rows = [
      ['Ingrédient', 'Quantité', 'Coût (FCFA)'],
      ...lines.map((l) => [l.name, l.qtyLabel, String(Math.round(l.cost))]),
      ['TOTAL', '', String(Math.round(lines.reduce((s, l) => s + l.cost, 0)))],
    ];
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `costera-${recipeName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <section className="mt-8 grid gap-5 lg:grid-cols-3" aria-label="Laboratoire de calcul">
      {/* Jauge */}
      <div className="card p-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wide text-stone-600">Jauge de food cost</h2>
          <Formula label="Comment c'est calculé ?">
            Food Cost % = coût matière par portion ÷ prix de vente × 100. Ex. : 3 000 ÷ 10 000 × 100 = 30 %.
          </Formula>
        </div>
        <FoodCostGauge value={foodCostPct(perPortion, salePrice)} target={targetPct} />
        {edu && (
          <p className="mt-3 rounded-xl bg-gold-50 px-3 py-2 text-[11px] leading-relaxed text-gold-900">
            Mode école : un food cost sous 30 % laisse une marge confortable ; au-delà de 40 %, la
            rentabilité du plat est en danger.
          </p>
        )}
      </div>

      {/* Simulateur de prix */}
      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wide text-stone-600">Simulateur de prix</h2>
          <Formula label="Comment c'est calculé ?">
            Prix conseillé = coût matière ÷ food cost cible. Ex. : 3 000 ÷ 0,30 = 10 000 FCFA (arrondi au
            multiple de 25/50).
          </Formula>
        </div>
        <label htmlFor="sim-price" className="text-xs font-semibold text-stone-500">
          Prix de vente simulé : <span className="font-black text-royal-800">{fcfa(simPrice)}</span>
        </label>
        <input
          id="sim-price"
          type="range"
          min={Math.max(25, Math.ceil((perPortion * 1.2) / 25) * 25)}
          max={Math.max(500, Math.ceil((perPortion * 6) / 25) * 25)}
          step={25}
          value={simPrice}
          onChange={(e) => setSimPrice(Number(e.target.value))}
          className="sim-range mt-2 w-full"
        />
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-royal-50 px-2 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-royal-500">Food cost</p>
            <p className="text-sm font-black text-royal-800">
              <AnimatedNumber value={simFoodCost ?? 0} format={(n) => `${n} %`} />
            </p>
          </div>
          <div className="rounded-xl bg-gold-50 px-2 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gold-700">Marge</p>
            <p className="text-sm font-black text-gold-800">
              <AnimatedNumber value={simMargin} format={(n) => fcfa(n)} />
            </p>
          </div>
          <div className="rounded-xl bg-royal-50 px-2 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-royal-500">Marque</p>
            <p className="text-sm font-black text-royal-800">
              <AnimatedNumber value={simMark ?? 0} format={(n) => `${n} %`} />
            </p>
          </div>
        </div>
        <svg viewBox="0 0 300 100" className="mt-3 w-full" role="img" aria-label="Courbe de rentabilité">
          <polyline points={curve} fill="none" stroke="#5B2D9E" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="10" y1="90" x2="290" y2="90" stroke="#EAE6EF" strokeWidth="1.5" />
        </svg>
        <p className="text-[10px] text-stone-400">Courbe : marge brute selon le prix de vente.</p>
        <p className="mt-2 text-[11px] font-semibold text-stone-500">
          Prix conseillé ({targetPct} %) :{' '}
          <span className="text-royal-800">{fcfa(roundCommercial(priceFromTargetCost(perPortion, targetPct), 25))}</span>
        </p>
      </div>

      {/* Comparateur avant / après */}
      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wide text-stone-600">Comparateur rendement</h2>
          <Formula label="Comment c'est calculé ?">
            Prix utilisable = prix d'achat ÷ rendement. Ex. : 3 000 ÷ 0,80 = 3 750 FCFA/kg utilisable.
          </Formula>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label htmlFor="cmp-price" className="text-[10px] font-bold uppercase text-stone-500">Prix achat</label>
            <input id="cmp-price" type="number" min={0} step={25} className="input mt-1" value={cmpPrice} onChange={(e) => setCmpPrice(Number(e.target.value))} />
          </div>
          <div>
            <label htmlFor="cmp-before" className="text-[10px] font-bold uppercase text-stone-500">Rend. avant %</label>
            <input id="cmp-before" type="number" min={1} max={100} className="input mt-1" value={cmpYieldBefore} onChange={(e) => setCmpYieldBefore(Number(e.target.value))} />
          </div>
          <div>
            <label htmlFor="cmp-after" className="text-[10px] font-bold uppercase text-stone-500">Rend. après %</label>
            <input id="cmp-after" type="number" min={1} max={100} className="input mt-1" value={cmpYieldAfter} onChange={(e) => setCmpYieldAfter(Number(e.target.value))} />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-center gap-3 text-center">
          <div className="rounded-2xl bg-stone-100 px-4 py-3">
            <p className="text-[10px] font-bold uppercase text-stone-500">Avant</p>
            <p className="text-lg font-black text-stone-700 tabular-nums">{fcfa(before)}</p>
          </div>
          <span className="text-xl font-black text-gold-600">→</span>
          <div className="rounded-2xl bg-royal-900 px-4 py-3">
            <p className="text-[10px] font-bold uppercase text-gold-300">Après</p>
            <p className="text-lg font-black text-white tabular-nums">{fcfa(after)}</p>
          </div>
        </div>
        <p className="mt-3 text-center text-xs font-semibold text-stone-500">
          {after > before ? `Surcoût de ${fcfa(after - before)} par unité utilisable` : 'Aucun surcoût'}
        </p>
      </div>

      {/* Barre pédagogique + export */}
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4 lg:col-span-3">
        <button
          type="button"
          onClick={() => setEdu((v) => !v)}
          aria-pressed={edu}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all duration-300 ${
            edu ? 'bg-royal-900 text-gold-300' : 'bg-royal-50 text-royal-700 hover:bg-royal-100'
          }`}
        >
          <GraduationCap size={15} />
          Mode pédagogique {edu ? 'activé' : 'désactivé'}
        </button>
        <button type="button" onClick={exportCsv} className="auth-btn-gold">
          <Download size={15} />
          Exporter CSV
        </button>
      </div>
    </section>
  );
}
