'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { MenuForm, type MenuFormInitial, type MenuFormRecipe } from './forms/MenuForm';
import { Modal } from './modal';

export function MenuEditModal({ initial, recipes }: { initial: MenuFormInitial; recipes: MenuFormRecipe[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-ghost">
        <Pencil className="h-4 w-4" />
        Modifier
      </button>
      <Modal open={open} title={`Modifier « ${initial.name} »`} onClose={() => setOpen(false)}>
        <MenuForm recipes={recipes} initial={initial} onClose={() => setOpen(false)} />
      </Modal>
    </>
  );
}
