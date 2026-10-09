'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { IngredientForm, type IngredientInitial } from './forms/IngredientForm';
import { Modal } from './modal';

export function IngredientEditModal({ initial }: { initial: IngredientInitial }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-ghost">
        <Pencil className="h-4 w-4" />
        Modifier
      </button>
      <Modal open={open} title={`Modifier « ${initial.name} »`} onClose={() => setOpen(false)}>
        <IngredientForm initial={initial} onClose={() => setOpen(false)} />
      </Modal>
    </>
  );
}
