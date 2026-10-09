import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { UpdateRoleSelect } from '@/components/team-client';
import { UserForm } from '@/components/forms/UserForm';
import { Badge, Card, CardHeader, PageHeader } from '@/components/ui';
import { getSessionUserId } from '@/lib/auth';
import { fmtDate } from '@/lib/format';
import { ROLE_LABELS } from '@/lib/roles';
import { getDB } from '@/server/db';

export const metadata: Metadata = { title: 'Équipe' };

export default async function TeamPage() {
  const userId = await getSessionUserId();
  const db = getDB();
  const user = db.users.find((u) => u.id === userId);
  if (!user) redirect('/login');
  if (user.role !== 'admin') redirect('/dashboard');

  return (
    <div>
      <PageHeader title="Équipe & rôles" description="Gérez les comptes et les droits d’accès : administrateur, gestionnaire, chef de cuisine." />
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader title={`Membres (${db.users.length})`} description="Le rôle détermine les actions possibles sur la plateforme." />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="th">Membre</th>
                  <th className="th">Rôle</th>
                  <th className="th">Créé le</th>
                  <th className="th" />
                </tr>
              </thead>
              <tbody>
                {db.users.map((u) => (
                  <tr key={u.id} className="border-b border-stone-50">
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-forest-800 text-sm font-bold text-white">
                          {u.name.slice(0, 1)}
                        </span>
                        <div>
                          <p className="font-semibold text-ink">
                            {u.name} {u.id === user.id ? <Badge tone="brand">vous</Badge> : null}
                          </p>
                          <p className="text-xs text-stone-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="td">
                      <UpdateRoleSelect userId={u.id} role={u.role} isSelf={u.id === user.id} />
                    </td>
                    <td className="td text-xs text-stone-400">{fmtDate(u.createdAt)}</td>
                    <td className="td" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Ajouter un membre" />
            <div className="p-5">
              <UserForm />
            </div>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Droits par rôle</p>
            <ul className="mt-3 space-y-2 text-sm text-stone-600">
              <li><Badge tone="ink">{ROLE_LABELS.admin}</Badge> <span className="ml-1 text-xs">tout, y compris paramètres et équipe</span></li>
              <li><Badge tone="brand">{ROLE_LABELS.gestionnaire}</Badge> <span className="ml-1 text-xs">ingrédients, recettes, menus, prix</span></li>
              <li><Badge tone="green">{ROLE_LABELS.chef}</Badge> <span className="ml-1 text-xs">fiches techniques, saisie des prix</span></li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
