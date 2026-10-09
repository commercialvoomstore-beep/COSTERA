import type { Metadata } from 'next';
import { ProfileManager } from '@/components/profile/profile-manager';
import { PageHeader } from '@/components/ui';
import { getSessionUserId } from '@/lib/auth';
import { getDB } from '@/server/db';
import { userLevel } from '@/server/planService';

export const metadata: Metadata = { title: 'Mon profil' };

export default async function ProfilPage() {
  const db = getDB();
  const userId = await getSessionUserId();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return null;

  return (
    <div>
      <PageHeader
        title="Mon profil"
        description="Vos informations publiques, la sécurité de votre compte et la gestion de votre abonnement."
      />
      <ProfileManager user={{ name: user.name, email: user.email, profile: user.profile }} plan={userLevel(user)} />
    </div>
  );
}
