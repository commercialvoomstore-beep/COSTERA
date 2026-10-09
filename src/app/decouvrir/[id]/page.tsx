import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, UtensilsCrossed } from 'lucide-react';
import { PublicHeader } from '@/components/public-header';
import { Badge } from '@/components/ui';
import { fcfa } from '@/lib/format';
import { recipeImage } from '@/lib/dish-images';
import { getDB } from '@/server/db';

export const metadata: Metadata = { title: 'Menu' };

export default function PublicMenuPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <PublicMenuInner params={params} />
  );
}

async function PublicMenuInner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDB();
  const menu = db.menus.find((m) => m.id === id);
  // Sécurité : un menu non publié n'est jamais exposé au public.
  if (!menu || menu.published !== true) notFound();
  const recipeById = new Map(db.recipes.map((r) => [r.id, r]));

  return (
    <main className="min-h-screen bg-ivory">
      <PublicHeader />
      <div className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6">
        <Link href="/decouvrir" className="nav-link mb-6 inline-flex items-center gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" />
          Tous les menus
        </Link>

        <header className="mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-600">Menu publié</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-royal-800 sm:text-4xl">{menu.name}</h1>
          {menu.description ? <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-body/60">{menu.description}</p> : null}
          <div className="mx-auto mt-5 h-px w-40 bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
        </header>

        <div className="space-y-10">
          {menu.sections.map((sec) => {
            const dishes = sec.recipeIds.map((rid) => recipeById.get(rid)).filter((r) => r !== undefined);
            if (dishes.length === 0) return null;
            return (
              <section key={sec.id}>
                <div className="mb-5 flex items-center gap-4">
                  <h2 className="font-display text-xl font-bold text-royal-700">{sec.title}</h2>
                  <span className="h-px flex-1 bg-linec" />
                  <UtensilsCrossed className="h-4 w-4 text-gold-500" />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  {dishes.map((r) => (
                    <article key={r.id} className="card card-hover overflow-hidden">
                      <div className="img-zoom aspect-[16/10]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={recipeImage(r.id, r.category)} alt={r.name} loading="lazy" className="h-full w-full object-cover" />
                      </div>
                      <div className="flex items-start justify-between gap-3 p-5">
                        <div>
                          <h3 className="font-display text-base font-bold text-body">{r.name}</h3>
                          <div className="mt-2">
                            <Badge tone="brand">{r.category}</Badge>
                          </div>
                        </div>
                        <p className="shrink-0 text-sm font-bold text-royal-700">{r.salePrice > 0 ? fcfa(r.salePrice) : '—'}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-14 text-center">
          <p className="text-xs text-body/45">Prix TTC en francs CFA (XOF) — Côte d’Ivoire.</p>
          <Link href="/login" className="btn-primary mt-4">
            Créer mon menu avec COSTERA
          </Link>
        </div>
      </div>
    </main>
  );
}
