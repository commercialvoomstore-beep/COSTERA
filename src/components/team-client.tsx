'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROLE_LABELS } from '@/lib/roles';
import type { Role } from '@/lib/types';
import { deleteUserAction, updateUserRoleAction } from '@/server/actions/users';
import { DeleteUserButton } from './delete-buttons';

export function UpdateRoleSelect({ userId, role, isSelf }: { userId: string; role: Role; isSelf: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setBusy(true);
    await updateUserRoleAction(userId, e.target.value as Role);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select className="input w-auto py-1.5 text-xs" value={role} disabled={isSelf || busy} onChange={onChange}>
        <option value="admin">{ROLE_LABELS.admin}</option>
        <option value="gestionnaire">{ROLE_LABELS.gestionnaire}</option>
        <option value="chef">{ROLE_LABELS.chef}</option>
      </select>
      {!isSelf ? <DeleteUserButton id={userId} /> : null}
    </div>
  );
}
