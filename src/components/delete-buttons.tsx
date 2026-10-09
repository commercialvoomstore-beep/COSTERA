'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { deleteIngredientAction } from '@/server/actions/ingredients';
import { deleteRecipeAction } from '@/server/actions/recipes';
import { deleteMenuAction } from '@/server/actions/menus';
import { deleteUserAction } from '@/server/actions/users';
import { ErrorNote } from './ui';

function useConfirmDelete(action: (id: string) => Promise<{ ok: boolean; error?: string }>, id: string, confirmText: string, redirect?: string) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!window.confirm(confirmText)) return;
    setBusy(true);
    const res = await action(id);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? 'La suppression a échoué.');
      return;
    }
    if (redirect) router.push(redirect);
    router.refresh();
  }

  return { run, error, busy };
}

export function DeleteIngredientButton({ id }: { id: string }) {
  const { run, error, busy } = useConfirmDelete(
    deleteIngredientAction,
    id,
    'Supprimer cet ingrédient ? Cette action est définitive.'
  );
  return (
    <div className="space-y-2">
      <button onClick={run} disabled={busy} className="btn-danger">
        <Trash2 className="h-4 w-4" />
        Supprimer l’ingrédient
      </button>
      <ErrorNote error={error} />
    </div>
  );
}

export function DeleteRecipeButton({ id }: { id: string }) {
  const { run, error, busy } = useConfirmDelete(deleteRecipeAction, id, 'Supprimer cette fiche technique ? Cette action est définitive.', '/recettes');
  return (
    <div className="space-y-2">
      <button onClick={run} disabled={busy} className="btn-danger">
        <Trash2 className="h-4 w-4" />
        Supprimer
      </button>
      <ErrorNote error={error} />
    </div>
  );
}

export function DeleteMenuButton({ id }: { id: string }) {
  const { run, error, busy } = useConfirmDelete(deleteMenuAction, id, 'Supprimer ce menu ? Cette action est définitive.', '/menus');
  return (
    <div className="space-y-2">
      <button onClick={run} disabled={busy} className="btn-danger">
        <Trash2 className="h-4 w-4" />
        Supprimer
      </button>
      <ErrorNote error={error} />
    </div>
  );
}

export function DeleteUserButton({ id }: { id: string }) {
  const { run, error, busy } = useConfirmDelete(deleteUserAction, id, 'Supprimer ce compte utilisateur ?');
  return (
    <div className="space-y-1">
      <button onClick={run} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
        <Trash2 className="h-3.5 w-3.5" />
        Supprimer
      </button>
      <ErrorNote error={error} />
    </div>
  );
}
