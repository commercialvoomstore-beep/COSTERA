import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicCardView } from '@/components/cards/public-card-view';
import { Logo } from '@/components/logo';
import { getSessionUserId } from '@/lib/auth';
import { getDB } from '@/server/db';
import { userLevel } from '@/server/planService';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const card = getDB().cards.find((c) => c.shareSlug === slug);
  return { title: card ? card.name : 'Carte' };
}

export default async function PublicCardPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const db = getDB();

  const card = db.cards.find((c) => c.shareSlug === slug);
  if (!card || card.status !== 'publiee') notFound();

  const userId = await getSessionUserId();
  const user = userId ? db.users.find((u) => u.id === userId) : null;
  const isOwner = Boolean(user && (user.id === card.ownerId || user.role === 'admin'));
  const viewerLevel = user ? userLevel(user) : 'free';

  const dishes = db.dishes.filter((d) => d.cardId === card.id && d.status === 'publiee');
  const owner = db.users.find((u) => u.id === card.ownerId);

  return (
    <main className="min-h-screen bg-gradient-to-b from-sand-50 to-sand-100 pb-16">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <Link href="/" aria-label="COSTERA — accueil"><Logo size={42} /></Link>
        {!isOwner && (
          <Link href="/login" className="btn-ghost">Se connecter</Link>
        )}
      </header>

      <div className="mx-auto max-w-3xl px-4">
        <PublicCardView card={card} dishes={dishes} viewerLevel={viewerLevel} isOwner={isOwner} autoPrint={sp.print === '1'} />
      </div>

      {owner?.profile?.businessName && (
        <p className="mt-8 text-center text-xs text-body/45">Une carte de {owner.profile.businessName}</p>
      )}
    </main>
  );
}
