'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import type { RecipeCategory } from '@/lib/types';
import { saveMenuAction } from '@/server/actions/menus';
import { ErrorNote, Field } from '../ui';

export interface MenuFormRecipe {
  id: string;
  name: string;
  category: RecipeCategory;
}

export interface MenuFormInitial {
  id: string;
  name: string;
  description?: string;
  sections: { id: string; title: string; recipeIds: string[] }[];
  published?: boolean;
}

interface SectionState {
  key: string;
  title: string;
  recipeIds: string[];
}

let secKey = 0;

export function MenuForm({ recipes, initial, onClose }: { recipes: MenuFormRecipe[]; initial?: MenuFormInitial; onClose?: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [published, setPublished] = useState(initial?.published ?? false);
  const [sections, setSections] = useState<SectionState[]>(
    initial?.sections.length
      ? initial.sections.map((s) => ({ key: s.id, title: s.title, recipeIds: [...s.recipeIds] }))
      : [{ key: `sec-${secKey++}`, title: 'Plats', recipeIds: [] }]
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await saveMenuAction({
      id: initial?.id,
      name,
      description: description || undefined,
      sections: sections.map((s) => ({ title: s.title, recipeIds: s.recipeIds })),
      published,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? 'Enregistrement impossible.');
      return;
    }
    const id = initial?.id ?? res.id;
    onClose?.();
    router.push(`/menus/${id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Nom du menu">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Déjeuner du Maquis" required />
      </Field>
      <Field label="Description (facultatif)">
        <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Formule midi, menu de réception…" />
      </Field>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-linec bg-ivory px-4 py-3">
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="mt-0.5 h-4 w-4 accent-royal-600" />
        <span>
          <span className="block text-sm font-semibold text-body">Publier sur la vitrine « Découvrir les menus »</span>
          <span className="block text-xs text-body/55">Par défaut un menu reste strictement privé. La publication est réservée aux contenus que vous souhaitez montrer au public.</span>
        </span>
      </label>

      <div className="space-y-4">
        {sections.map((sec, idx) => (
          <div key={sec.key} className="rounded-xl border border-stone-200 p-4">
            <div className="mb-3 flex items-center gap-2">
              <input
                className="input flex-1 font-semibold"
                value={sec.title}
                onChange={(e) => setSections((prev) => prev.map((s) => (s.key === sec.key ? { ...s, title: e.target.value } : s)))}
                placeholder={`Section ${idx + 1} (ex. Entrées)`}
              />
              <button
                type="button"
                onClick={() => setSections((prev) => prev.filter((s) => s.key !== sec.key))}
                className="rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Supprimer la section"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recipes.map((r) => {
                const active = sec.recipeIds.includes(r.id);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() =>
                      setSections((prev) =>
                        prev.map((s) =>
                          s.key === sec.key
                            ? { ...s, recipeIds: active ? s.recipeIds.filter((x) => x !== r.id) : [...s.recipeIds, r.id] }
                            : s
                        )
                      )
                    }
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      active ? 'border-brand-600 bg-brand-600 text-white' : 'border-stone-300 bg-white text-stone-600 hover:border-brand-400'
                    }`}
                  >
                    {r.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setSections((prev) => [...prev, { key: `sec-${secKey++}`, title: '', recipeIds: [] }])}
        className="btn-ghost px-3 py-1.5 text-xs"
      >
        <Plus className="h-3.5 w-3.5" />
        Ajouter une section
      </button>

      <ErrorNote error={error} />
      <div className="flex justify-end gap-2">
        {onClose ? (
          <button type="button" onClick={onClose} className="btn-ghost">
            Annuler
          </button>
        ) : null}
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? 'Enregistrement…' : initial ? 'Enregistrer le menu' : 'Créer le menu'}
        </button>
      </div>
    </form>
  );
}
