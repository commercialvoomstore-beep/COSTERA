'use client';

// COSTERA — Éditeur de fiche technique : calcul du coût matière en temps réel
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Plus, Save, Sparkles, Trash2 } from 'lucide-react';
import { pct, fcfa, num, coef } from '@/lib/format';
import { ratioStatus, suggestedPrice } from '@/lib/foodcost';
import { RECIPE_CATEGORIES, type RecipeCategory, type RecipeStatus } from '@/lib/types';
import { UNIT_GROUPS, UNITS, convert, unitAbbr } from '@/lib/units';
import { saveRecipeAction } from '@/server/actions/recipes';
import { Badge, ErrorNote, Field } from '../ui';

export interface RecipeFormIngredient {
  id: string;
  name: string;
  unitId: string;
  price: number;
  lossPct: number;
}

export interface RecipeFormInitial {
  id: string;
  name: string;
  category: RecipeCategory;
  portions: number;
  salePrice: number;
  status: RecipeStatus;
  notes?: string;
  steps: string[];
  lines: { id: string; ingredientId: string; qty: number; unitId: string; note?: string }[];
}

interface LineState {
  key: string;
  ingredientId: string;
  qty: string;
  unitId: string;
  note: string;
}

let lineKey = 0;

export function RecipeForm({ ingredients, initial, targetPct }: { ingredients: RecipeFormIngredient[]; initial?: RecipeFormInitial; targetPct: number }) {
  const router = useRouter();
  const ingMap = useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients]);

  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState<RecipeCategory>(initial?.category ?? 'Plats');
  const [status, setStatus] = useState<RecipeStatus>(initial?.status ?? 'active');
  const [portions, setPortions] = useState(String(initial?.portions ?? 1));
  const [salePrice, setSalePrice] = useState(initial?.salePrice ? String(initial.salePrice) : '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [steps, setSteps] = useState<string[]>(initial?.steps?.length ? initial.steps : ['']);
  const [lines, setLines] = useState<LineState[]>(
    initial?.lines.length
      ? initial.lines.map((l) => ({ key: l.id, ingredientId: l.ingredientId, qty: String(l.qty), unitId: l.unitId, note: l.note ?? '' }))
      : [{ key: `new-${lineKey++}`, ingredientId: ingredients[0]?.id ?? '', qty: '', unitId: ingredients[0]?.unitId ?? 'kg', note: '' }]
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const computed = useMemo(() => {
    let total = 0;
    let conversionWarning = false;
    const detail = lines.map((l) => {
      const ing = l.ingredientId ? ingMap.get(l.ingredientId) : undefined;
      const qty = parseFloat(l.qty);
      if (!ing || !Number.isFinite(qty) || qty <= 0) return null;
      const convertedQty = convert(qty, l.unitId, ing.unitId);
      if (convertedQty === null) conversionWarning = true;
      const q = convertedQty ?? qty;
      const cost = q * ing.price * (1 + ing.lossPct / 100);
      total += cost;
      return { cost, qtyBase: q, converted: convertedQty !== null, ing };
    });
    const p = Math.max(1, parseInt(portions, 10) || 1);
    const perPortion = total / p;
    const price = parseFloat(salePrice);
    const priceOk = Number.isFinite(price) && price > 0;
    return {
      total,
      perPortion,
      detail,
      conversionWarning,
      foodCostPct: priceOk ? (perPortion / price) * 100 : null,
      margin: priceOk ? price - perPortion : null,
      coefficient: priceOk && perPortion > 0 ? price / perPortion : null,
    };
  }, [lines, portions, salePrice, ingMap]);

  function updateLine(key: string, patch: Partial<LineState>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, { key: `new-${lineKey++}`, ingredientId: ingredients[0]?.id ?? '', qty: '', unitId: ingredients[0]?.unitId ?? 'kg', note: '' }]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const validLines = lines.filter((l) => l.ingredientId && parseFloat(l.qty) > 0);
    const res = await saveRecipeAction({
      id: initial?.id,
      name,
      category,
      portions: parseInt(portions, 10) || 1,
      salePrice: parseFloat(salePrice) || 0,
      status,
      lines: validLines.map((l) => ({ ingredientId: l.ingredientId, qty: parseFloat(l.qty), unitId: l.unitId, note: l.note || undefined })),
      steps,
      notes: notes || undefined,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? 'Enregistrement impossible.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const id = initial?.id ?? res.id;
    router.push(`/recettes/${id}`);
    router.refresh();
  }

  const statusTone = ratioStatus(computed.foodCostPct, targetPct);
  const recommended = suggestedPrice(computed.perPortion, targetPct);

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <ErrorNote error={error} />

        {/* Identité */}
        <section className="card p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-stone-500">1 · Identité de la recette</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Nom de la recette">
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Kedjenou de poulet" required />
              </Field>
            </div>
            <Field label="Catégorie">
              <select className="input" value={category} onChange={(e) => setCategory(e.target.value as RecipeCategory)}>
                {RECIPE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Statut">
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value as RecipeStatus)}>
                <option value="active">Active (à la carte)</option>
                <option value="brouillon">Brouillon</option>
                <option value="archivee">Archivée</option>
              </select>
            </Field>
            <Field label="Nombre de portions" hint="Rendement de la recette.">
              <input className="input" type="number" min="1" step="1" value={portions} onChange={(e) => setPortions(e.target.value)} required />
            </Field>
            <Field label="Prix de vente / portion (FCFA)">
              <input className="input" type="number" min="0" step="25" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="3500" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Notes (facultatif)">
                <textarea className="input min-h-[64px]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Allergènes, variante, dressage…" />
              </Field>
            </div>
          </div>
        </section>

        {/* Ingrédients */}
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">2 · Ingrédients</h2>
            <button type="button" onClick={addLine} className="btn-ghost px-3 py-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Ajouter une ligne
            </button>
          </div>
          {computed.conversionWarning ? (
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Une ligne mélange des dimensions incompatibles (ex. pièce ↔ kg) : la quantité est alors comptée telle quelle dans l’unité d’achat.
            </div>
          ) : null}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="th pl-0">Ingrédient</th>
                  <th className="th w-24">Qté</th>
                  <th className="th w-28">Unité</th>
                  <th className="th">Coût</th>
                  <th className="th w-10" />
                </tr>
              </thead>
              <tbody>
                {lines.map((l, idx) => {
                  const d = computed.detail[idx];
                  return (
                    <tr key={l.key} className="border-b border-stone-50">
                      <td className="td pl-0">
                        <select
                          className="input"
                          value={l.ingredientId}
                          onChange={(e) => {
                            const ing = ingMap.get(e.target.value);
                            updateLine(l.key, { ingredientId: e.target.value, unitId: ing?.unitId ?? l.unitId });
                          }}
                        >
                          <option value="">— Choisir —</option>
                          {ingredients.map((i) => (
                            <option key={i.id} value={i.id}>{i.name}</option>
                          ))}
                        </select>
                        <input
                          className="mt-1 input py-1 text-xs text-stone-500"
                          value={l.note}
                          onChange={(e) => updateLine(l.key, { note: e.target.value })}
                          placeholder="Note (ex. découpé en dés)"
                        />
                      </td>
                      <td className="td">
                        <input className="input" type="number" min="0" step="any" value={l.qty} onChange={(e) => updateLine(l.key, { qty: e.target.value })} placeholder="0" />
                      </td>
                      <td className="td">
                        <select className="input" value={l.unitId} onChange={(e) => updateLine(l.key, { unitId: e.target.value })}>
                          {UNIT_GROUPS.map((g) => (
                            <optgroup key={g.label} label={g.label}>
                              {g.unitIds.map((uid) => (
                                <option key={uid} value={uid}>{unitAbbr(uid)}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </td>
                      <td className="td whitespace-nowrap">
                        {d ? (
                          <div>
                            <span className="font-semibold text-ink">{fcfa(d.cost)}</span>
                            <p className="text-[11px] text-stone-400">
                              {num(d.qtyBase)} {unitAbbr(d.ing.unitId)} · {fcfa(d.ing.price)}/{unitAbbr(d.ing.unitId)}
                              {d.ing.lossPct > 0 ? ` · perte ${d.ing.lossPct} %` : ''}
                            </p>
                          </div>
                        ) : (
                          <span className="text-stone-300">—</span>
                        )}
                      </td>
                      <td className="td">
                        <button
                          type="button"
                          onClick={() => setLines((prev) => prev.filter((x) => x.key !== l.key))}
                          className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
                          aria-label="Supprimer la ligne"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {lines.length === 0 ? <p className="py-6 text-center text-sm text-stone-400">Aucun ingrédient — cliquez sur « Ajouter une ligne ».</p> : null}
        </section>

        {/* Progression */}
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">3 · Progression (étapes)</h2>
            <button type="button" onClick={() => setSteps((prev) => [...prev, ''])} className="btn-ghost px-3 py-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Ajouter une étape
            </button>
          </div>
          <ol className="space-y-2">
            {steps.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-2 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sand-100 text-xs font-bold text-stone-500">{i + 1}</span>
                <input className="input" value={s} onChange={(e) => setSteps((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))} placeholder={`Étape ${i + 1}`} />
                <button
                  type="button"
                  onClick={() => setSteps((prev) => prev.filter((_, j) => j !== i))}
                  className="mt-1.5 rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Supprimer l’étape"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* Panneau de synthèse */}
      <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-stone-500">Coût matière</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-stone-500">Coût total ({Math.max(1, parseInt(portions, 10) || 1)} portions)</dt>
              <dd className="font-bold text-ink">{fcfa(computed.total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Coût / portion</dt>
              <dd className="text-lg font-black text-ink">{fcfa(computed.perPortion)}</dd>
            </div>
            <div className="border-t border-stone-100 pt-3" />
            <div className="flex justify-between">
              <dt className="text-stone-500">Prix de vente / portion</dt>
              <dd className="font-bold text-ink">{salePrice ? fcfa(parseFloat(salePrice) || 0) : '—'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-stone-500">Food cost</dt>
              <dd>
                {computed.foodCostPct !== null ? (
                  <Badge tone={statusTone === 'good' ? 'green' : statusTone === 'warn' ? 'amber' : 'red'}>{pct(computed.foodCostPct)}</Badge>
                ) : (
                  <span className="text-stone-400">—</span>
                )}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Marge / portion</dt>
              <dd className={`font-bold ${computed.margin !== null && computed.margin < 0 ? 'text-red-600' : 'text-forest-700'}`}>
                {computed.margin !== null ? fcfa(computed.margin) : '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Coefficient</dt>
              <dd className="font-bold text-ink">{coef(computed.coefficient)}</dd>
            </div>
          </dl>
          <div className="mt-4 rounded-xl bg-sand-100 p-3 text-xs text-stone-600">
            <p className="font-semibold text-stone-700">Prix conseillé (objectif {targetPct} %) : {recommended ? fcfa(recommended) : '—'}</p>
            <button
              type="button"
              disabled={!recommended}
              onClick={() => setSalePrice(String(recommended))}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Appliquer le prix conseillé
            </button>
          </div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full py-3">
          <Save className="h-4 w-4" />
          {saving ? 'Enregistrement…' : initial ? 'Enregistrer la fiche technique' : 'Créer la fiche technique'}
        </button>
      </aside>
    </form>
  );
}
