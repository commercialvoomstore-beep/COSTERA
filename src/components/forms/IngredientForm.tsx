'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { INGREDIENT_CATEGORIES, type IngredientCategory } from '@/lib/types';
import { UNIT_GROUPS, UNITS, unitAbbr } from '@/lib/units';
import { createIngredientAction, updateIngredientAction } from '@/server/actions/ingredients';
import { ErrorNote, Field } from '../ui';

export interface IngredientInitial {
  id: string;
  name: string;
  category: IngredientCategory;
  unitId: string;
  price: number;
  supplier?: string;
  lossPct: number;
}

export function IngredientForm({ initial, onClose }: { initial?: IngredientInitial; onClose?: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState<IngredientCategory>(initial?.category ?? 'Légumes & tubercules');
  const [unitId, setUnitId] = useState(initial?.unitId ?? 'kg');
  const [price, setPrice] = useState(initial ? String(initial.price) : '');
  const [supplier, setSupplier] = useState(initial?.supplier ?? '');
  const [lossPct, setLossPct] = useState(String(initial?.lossPct ?? 0));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      name,
      category,
      unitId,
      price: parseFloat(price),
      supplier: supplier || undefined,
      lossPct: parseFloat(lossPct) || 0,
    };
    const res = initial
      ? await updateIngredientAction(initial.id, payload)
      : await createIngredientAction(payload);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? 'Enregistrement impossible.');
      return;
    }
    router.refresh();
    onClose?.();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Nom de l’ingrédient">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Attiéké" required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Catégorie">
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value as IngredientCategory)}>
            {INGREDIENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Unité d’achat">
          <select className="input" value={unitId} onChange={(e) => setUnitId(e.target.value)}>
            {UNIT_GROUPS.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.unitIds.map((uid) => (
                  <option key={uid} value={uid}>{UNITS.find((u) => u.id === uid)?.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={`Prix d’achat (${unitAbbr(unitId)})`} hint="Montant en FCFA.">
          <input className="input" type="number" min="1" step="1" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1500" required />
        </Field>
        <Field label="Taux de perte (%)" hint="Épluchage, parage, cuisson…">
          <input className="input" type="number" min="0" max="95" step="1" value={lossPct} onChange={(e) => setLossPct(e.target.value)} />
        </Field>
      </div>
      <Field label="Fournisseur (facultatif)">
        <input className="input" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Ex. Marché d’Adjamé" />
      </Field>
      <ErrorNote error={error} />
      <div className="flex justify-end gap-2">
        {onClose ? (
          <button type="button" onClick={onClose} className="btn-ghost">
            Annuler
          </button>
        ) : null}
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? 'Enregistrement…' : initial ? 'Enregistrer les modifications' : 'Créer l’ingrédient'}
        </button>
      </div>
    </form>
  );
}
