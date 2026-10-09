import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Sparkline } from '@/components/charts';
import { DeleteIngredientButton } from '@/components/delete-buttons';
import { PriceForm } from '@/components/forms/PriceForm';
import { IngredientEditModal } from '@/components/ingredient-edit-modal';
import { Badge, Card, CardHeader } from '@/components/ui';
import { getSessionUserId } from '@/lib/auth';
import { fcfa, fmtDate, num, pct } from '@/lib/format';
import { priceDeltaPct } from '@/lib/foodcost';
import { can } from '@/lib/roles';
import { unitAbbr } from '@/lib/units';
import { getDB } from '@/server/db';

export const metadata: Metadata = { title: 'Ingrédient' };

export default async function IngredientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDB();
  const userId = await getSessionUserId();
  const user = db.users.find((u) => u.id === userId);
  const ing = db.ingredients.find((i) => i.id === id);
  if (!ing || !user) notFound();

  const usedBy = db.recipes.filter((r) => r.lines.some((l) => l.ingredientId === ing.id));
  const canManage = can(user.role, 'manageIngredients');
  const canUpdatePrice = can(user.role, 'updatePrices');
  const h = ing.history;
  const delta = h.length >= 2 ? priceDeltaPct(h[h.length - 2].price, h[h.length - 1].price) : null;
  const historyDesc = [...h].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <Link href="/ingredients" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-ink">
        ← Tous les ingrédients
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink">{ing.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone="brand">{ing.category}</Badge>
            <Badge tone="neutral">Unité d’achat : {unitAbbr(ing.unitId)}</Badge>
            {ing.lossPct > 0 ? <Badge tone="amber">Perte {ing.lossPct} %</Badge> : null}
            {ing.supplier ? <Badge tone="neutral">{ing.supplier}</Badge> : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canManage ? (
            <>
              <ModalWithForm ing={ing} />
              <DeleteIngredientButton id={ing.id} />
            </>
          ) : null}
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Prix actuel</p>
          <p className="mt-1 text-3xl font-black text-ink">
            {fcfa(ing.price)}
            <span className="text-base font-semibold text-stone-400"> / {unitAbbr(ing.unitId)}</span>
          </p>
          {delta !== null ? (
            <p className={`mt-1 text-xs font-bold ${delta > 0 ? 'text-red-600' : delta < 0 ? 'text-forest-700' : 'text-stone-400'}`}>
              {Math.abs(delta) < 0.05 ? 'Prix stable' : `${delta > 0 ? '+' : ''}${pct(delta)} vs prix précédent`}
            </p>
          ) : null}
        </Card>
        <Card className="p-5 sm:col-span-2">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">Tendance du prix d’achat</p>
          <Sparkline data={h.map((e) => e.price)} stroke="#C8A45D" />
          <p className="mt-1 text-xs text-stone-400">
            {h.length} relevé(s) — de {fcfa(Math.min(...h.map((e) => e.price)))} à {fcfa(Math.max(...h.map((e) => e.price)))}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Historique des prix" description="Chaque relevé alimente le coût matière des fiches techniques." />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-100">
                    <th className="th">Date</th>
                    <th className="th">Prix</th>
                    <th className="th">Variation</th>
                    <th className="th">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {historyDesc.map((entry, i) => {
                    const prev = historyDesc[i + 1];
                    const d = prev ? priceDeltaPct(prev.price, entry.price) : null;
                    return (
                      <tr key={`${entry.date}-${i}`} className="border-b border-stone-50">
                        <td className="td text-stone-500">{fmtDate(entry.date)}</td>
                        <td className="td font-semibold text-ink">{fcfa(entry.price)}</td>
                        <td className="td">
                          {d === null ? (
                            <span className="text-xs text-stone-300">—</span>
                          ) : Math.abs(d) < 0.05 ? (
                            <span className="text-xs text-stone-400">stable</span>
                          ) : (
                            <span className={`text-xs font-bold ${d > 0 ? 'text-red-600' : 'text-forest-700'}`}>
                              {d > 0 ? '+' : ''}
                              {pct(d)}
                            </span>
                          )}
                        </td>
                        <td className="td text-xs text-stone-400">{entry.note ?? ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {canUpdatePrice ? (
            <Card>
              <CardHeader title="Saisir un nouveau prix" description="Le prix actuel de la fiche est mis à jour et l’historique complété." />
              <div className="p-5">
                <PriceForm ingredientId={ing.id} unitAbbr={unitAbbr(ing.unitId)} />
              </div>
            </Card>
          ) : null}

          <Card>
            <CardHeader
              title={`Utilisé dans ${usedBy.length} recette(s)`}
              actions={
                <Link href="/recettes" className="text-xs font-bold text-brand-600 hover:text-brand-700">
                  Toutes les recettes →
                </Link>
              }
            />
            <div className="p-5">
              {usedBy.length === 0 ? (
                <p className="text-sm text-stone-400">Cet ingrédient n’entre dans aucune fiche technique.</p>
              ) : (
                <ul className="space-y-2">
                  {usedBy.map((r) => {
                    const l = r.lines.find((x) => x.ingredientId === ing.id)!;
                    return (
                      <li key={r.id}>
                        <Link href={`/recettes/${r.id}`} className="flex items-center justify-between rounded-xl border border-stone-100 px-3.5 py-2.5 transition hover:border-brand-200 hover:bg-brand-50/40">
                          <span className="text-sm font-semibold text-ink">{r.name}</span>
                          <span className="text-xs text-stone-500">
                            {num(l.qty)} {unitAbbr(l.unitId)}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ModalWithForm({ ing }: { ing: NonNullable<ReturnType<typeof getDB>['ingredients'][number]> }) {
  return (
    <IngredientEditModal
      initial={{
        id: ing.id,
        name: ing.name,
        category: ing.category,
        unitId: ing.unitId,
        price: ing.price,
        supplier: ing.supplier,
        lossPct: ing.lossPct,
      }}
    />
  );
}
