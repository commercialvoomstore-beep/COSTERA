import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PlanSettingsForm } from '@/components/forms/PlanSettingsForm';
import { SettingsForm } from '@/components/forms/SettingsForm';
import { Card, CardHeader, PageHeader } from '@/components/ui';
import { getSessionUserId } from '@/lib/auth';
import { getDB } from '@/server/db';

export const metadata: Metadata = { title: 'Paramètres' };

export default async function SettingsPage() {
  const userId = await getSessionUserId();
  const db = getDB();
  const user = db.users.find((u) => u.id === userId);
  if (!user) redirect('/login');
  if (user.role !== 'admin') redirect('/dashboard');

  return (
    <div>
      <PageHeader title="Paramètres" description="Réglages généraux de la plateforme — réservé à l’administrateur." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Établissement & objectif" description="L’objectif de food cost pilote les alertes et le prix conseillé de toutes les fiches." />
          <div className="p-5">
            <SettingsForm settings={db.settings} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Forfaits & tarification" description="Prix des abonnements, quotas de menus, tailles vidéo et TVA. Ces valeurs pilotent toute la plateforme." />
          <div className="p-5">
            <PlanSettingsForm settings={db.settings} />
          </div>
        </Card>
        <Card>
          <CardHeader title="À propos de COSTERA" />
          <div className="space-y-3 p-5 text-sm text-stone-600">
            <p><span className="font-bold text-ink">Produit :</span> COSTERA — Food Cost, Coût Matière &amp; Recettes.</p>
            <p><span className="font-bold text-ink">Éditeur :</span> VOOMNET FORMATION.</p>
            <p><span className="font-bold text-ink">Version :</span> V1 fonctionnelle — septembre 2026.</p>
            <p><span className="font-bold text-ink">Marché cible :</span> Côte d’Ivoire · Devise : Franc CFA (XOF).</p>
            <p className="rounded-xl bg-sand-100 p-4 text-xs leading-relaxed text-stone-500">
              COSTERA transforme les données d’une cuisine en décisions de gestion concrètes : chaque ingrédient a un prix,
              chaque recette a un coût, chaque menu a une rentabilité.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
