'use client';

// COSTERA — Éditeur de carte : infos, thème, catégories, plats (glisser-
// déposer), aperçu en direct, publication, partage (lien + QR + PDF).
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Copy, Crown, FileText, GripVertical, Pencil, Plus, QrCode, Trash2, UploadCloud } from 'lucide-react';
import { CARD_FONTS, CARD_THEMES, CARD_TYPE_LABELS, PLAN_SHORT, isUnlimited, nextLevel } from '@/lib/plans';
import type { Card, CardType, Dish, PlanLevel } from '@/lib/types';
import { deleteCardAction, saveCardAction, uploadCardCoverAction } from '@/server/actions/cards';
import { deleteDishAction, reorderDishesAction } from '@/server/actions/dishes';
import { CardRender } from './card-render';
import { DishForm } from './dish-form';
import { PlanBadge } from '@/components/plan-ui';
import { useToast } from '@/components/toast';
import { fcfa } from '@/lib/format';

export interface CardEditorProps {
  card: Card | null;
  dishes: Dish[];
  recipes: { id: string; name: string }[];
  videoLimitMb: number;
  plan: PlanLevel;
  quota: { used: number; limit: number; unlimited: boolean };
}

const CARD_TYPES: CardType[] = ['cuisine', 'boissons', 'desserts', 'petit-dejeuner', 'cocktails-bar', 'menu-enfant', 'menu-degustation', 'evenementielle', 'personnalise'];

export function CardEditor({ card, dishes: initialDishes, recipes, videoLimitMb, plan, quota }: CardEditorProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState(card?.name ?? '');
  const [slogan, setSlogan] = useState(card?.slogan ?? '');
  const [type, setType] = useState<CardType>(card?.type ?? 'cuisine');
  const [customType, setCustomType] = useState(card?.customType ?? '');
  const [theme, setTheme] = useState(card?.theme ?? 'grand-hotel');
  const [font, setFont] = useState(card?.font ?? 'classique');
  const [accentColor, setAccentColor] = useState(card?.accentColor ?? '');
  const [level, setLevel] = useState<PlanLevel>(card?.level ?? 'free');
  const [status, setStatus] = useState<'brouillon' | 'publiee'>(card?.status ?? 'brouillon');
  const [categories, setCategories] = useState<string[]>(card?.categories ?? ['Entrées', 'Plats', 'Desserts', 'Boissons']);
  const [newCat, setNewCat] = useState('');

  const [dishes, setDishes] = useState<Dish[]>(initialDishes);
  const [savedCard, setSavedCard] = useState<Card | null>(card);
  const [busy, setBusy] = useState(false);
  const [dishModal, setDishModal] = useState<{ open: boolean; dish?: Dish }>({ open: false });
  const [quotaModal, setQuotaModal] = useState<null | { used: number; limit: number; plan: string }>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  const shareUrl = savedCard && typeof window !== 'undefined' ? `${window.location.origin}/c/${savedCard.shareSlug}` : '';

  const draftCard: Card = {
    id: savedCard?.id ?? 'draft',
    ownerId: savedCard?.ownerId ?? '',
    type,
    customType: customType || undefined,
    name: name || 'Nouvelle carte',
    slogan: slogan || undefined,
    coverFileId: savedCard?.coverFileId,
    theme,
    accentColor: accentColor || undefined,
    font,
    level,
    status,
    shareSlug: savedCard?.shareSlug ?? '',
    categories,
    createdAt: savedCard?.createdAt ?? '',
    updatedAt: savedCard?.updatedAt ?? '',
  };

  async function saveCard(showToast = true): Promise<Card | null> {
    setBusy(true);
    const res = await saveCardAction({
      id: savedCard?.id,
      type,
      customType,
      name,
      slogan,
      theme,
      accentColor,
      font,
      level,
      status,
      categories,
    });
    setBusy(false);
    if (!res.ok || !res.id) {
      if (showToast) toast(res.error ?? 'Enregistrement impossible.', 'error');
      return null;
    }
    // Recharge la carte pour obtenir le slug / id définitifs.
    const full: Card = { ...draftCard, id: res.id, shareSlug: savedCard?.shareSlug ?? '' };
    setSavedCard(full);
    if (showToast) toast('Carte enregistrée.', 'success');
    if (!card && res.id) {
      // Première création : on navigue vers l'URL définitive.
      router.replace(`/cartes/${res.id}`);
    }
    return full;
  }

  async function uploadCover(f: File) {
    if (!savedCard) {
      toast('Enregistrez d’abord la carte.', 'info');
      return;
    }
    const fd = new FormData();
    fd.set('cardId', savedCard.id);
    fd.set('cover', f);
    const res = await uploadCardCoverAction(fd);
    if (res.ok && res.fileId) {
      setSavedCard({ ...savedCard, coverFileId: res.fileId });
      toast('Photo de couverture mise à jour.', 'success');
      router.refresh();
    } else toast(res.error ?? 'Téléversement impossible.', 'error');
  }

  function addCategory() {
    const c = newCat.trim();
    if (!c || categories.includes(c)) return;
    setCategories((x) => [...x, c]);
    setNewCat('');
  }

  async function handleReorder(from: number, to: number) {
    if (from === to) return;
    const list = [...dishes];
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    setDishes(list);
    await reorderDishesAction(draftCard.id, list.map((d) => d.id));
  }

  async function removeDish(d: Dish) {
    const res = await deleteDishAction(d.id);
    if (res.ok) {
      setDishes((x) => x.filter((y) => y.id !== d.id));
      toast('Plat supprimé.', 'info');
    } else toast(res.error ?? 'Suppression impossible.', 'error');
  }

  async function generateQr() {
    setShowQr(true);
    if (qrData) return;
    try {
      const QRCode = (await import('qrcode')).default;
      setQrData(await QRCode.toDataURL(shareUrl, { width: 240, margin: 1 }));
    } catch {
      setQrData(null);
    }
  }

  async function copyShare() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast('Lien de partage copié.', 'success');
    } catch {
      toast(shareUrl, 'info');
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(340px,0.9fr)]">
      {/* Colonne édition */}
      <div className="space-y-5">
        {/* Infos carte */}
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-black uppercase tracking-wide text-body/70">Informations de la carte</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="c-name" className="label">Nom de la carte *</label>
              <input id="c-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Carte du Grand Hôtel" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="c-slogan" className="label">Slogan</label>
              <input id="c-slogan" className="input" value={slogan} onChange={(e) => setSlogan(e.target.value)} placeholder="Ex. Saveurs d'exception" />
            </div>
            <div className="space-y-1">
              <label htmlFor="c-type" className="label">Type de carte</label>
              <select id="c-type" className="input" value={type} onChange={(e) => setType(e.target.value as CardType)}>
                {CARD_TYPES.map((t) => <option key={t} value={t}>{CARD_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            {type === 'personnalise' && (
              <div className="space-y-1">
                <label htmlFor="c-ctype" className="label">Type personnalisé</label>
                <input id="c-ctype" className="input" value={customType} onChange={(e) => setCustomType(e.target.value)} placeholder="Ex. Brunch" />
              </div>
            )}
            <div className="space-y-1">
              <label className="label">Niveau d'accès de la carte</label>
              <div className="flex gap-1.5">
                {(['free', 'silver', 'gold'] as PlanLevel[]).map((l) => (
                  <button key={l} type="button" onClick={() => setLevel(l)}
                    className={`flex-1 rounded-lg border px-2 py-1.5 transition ${level === l ? 'border-royal-600 bg-royal-50 ring-1 ring-royal-600' : 'border-linec'}`}>
                    <PlanBadge plan={l} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="label">Couleur d'accent</label>
              <div className="flex items-center gap-2">
                <input type="color" value={accentColor || '#E2C275'} onChange={(e) => setAccentColor(e.target.value)} className="h-9 w-14 cursor-pointer rounded-lg border border-linec" />
                <input className="input flex-1" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} placeholder="#E2C275 (défaut du thème)" />
              </div>
            </div>
          </div>

          {/* Thème */}
          <div className="mt-4">
            <span className="label">Thème visuel</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CARD_THEMES.map((t) => (
                <button key={t.id} type="button" onClick={() => setTheme(t.id as Card['theme'])}
                  className={`rounded-xl border p-2 text-left transition ${theme === t.id ? 'border-royal-600 ring-1 ring-royal-600' : 'border-linec'}`}>
                  <span className={`block h-8 rounded-lg ${t.bg}`} />
                  <span className="mt-1 block text-[11px] font-medium leading-tight text-body/70">{t.label}</span>
                </button>
              ))}
            </div>
            {plan === 'free' && (
              <p className="mt-2 text-xs text-amber-700">Votre forfait FREE utilise le modèle sobre. Les thèmes raffinés sont inclus dès SILVER.</p>
            )}
          </div>

          {/* Police */}
          <div className="mt-4">
            <span className="label">Police</span>
            <div className="flex gap-2">
              {CARD_FONTS.map((f) => (
                <button key={f.id} type="button" onClick={() => setFont(f.id as Card['font'])}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${font === f.id ? 'border-royal-600 bg-royal-50 text-royal-800 ring-1 ring-royal-600' : 'border-linec text-body/60'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Catégories */}
          <div className="mt-4">
            <span className="label">Catégories (ordre d'affichage)</span>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <span key={c} className="inline-flex items-center gap-1 rounded-full bg-royal-50 px-3 py-1 text-xs font-medium text-royal-700">
                  {c}
                  <button type="button" onClick={() => setCategories((x) => x.filter((y) => y !== c))} aria-label={`Retirer ${c}`} className="hover:text-red-600">×</button>
                </span>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input className="input flex-1" value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Nouvelle catégorie" onKeyDown={(e) => e.key === 'Enter' && addCategory()} />
              <button type="button" onClick={addCategory} className="btn-ghost">Ajouter</button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => { setStatus('brouillon'); saveCard(); }} disabled={busy} className="btn-ghost">Enregistrer en brouillon</button>
            <button type="button" onClick={() => { setStatus('publiee'); saveCard(); }} disabled={busy} className="btn-primary">
              {status === 'publiee' ? 'Enregistrer' : 'Publier'}
            </button>
            {savedCard && (
              <button type="button" onClick={() => { if (confirm('Supprimer cette carte et tous ses plats ?')) deleteCardAction(savedCard.id).then(() => router.push('/cartes')); }} className="btn-ghost text-red-600">
                <Trash2 className="h-4 w-4" /> Supprimer
              </button>
            )}
          </div>
        </div>

        {/* Plats */}
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wide text-body/70">Plats ({dishes.length})</h2>
            <button type="button" onClick={() => setDishModal({ open: true })} className="btn-primary">
              <Plus className="h-4 w-4" /> Ajouter un plat
            </button>
          </div>
          <p className="mb-3 text-xs text-body/45">
            Quota : {quota.unlimited ? `${quota.used} · illimité` : `${quota.used} / ${quota.limit}`} · Glissez-déposez pour réordonner.
          </p>
          <ul className="space-y-2">
            {dishes.sort((a, b) => a.sortIndex - b.sortIndex).map((d, i) => (
              <li key={d.id}
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => { if (dragIndex !== null) handleReorder(dragIndex, i); setDragIndex(null); }}
                className="flex items-center gap-3 rounded-xl border border-linec bg-white p-3 transition hover:border-royal-300">
                <GripVertical className="h-4 w-4 cursor-grab text-body/30" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-body">{d.name} <span className="ml-1 text-xs font-bold text-gold-700 tabular-nums">{fcfa(d.price)}</span></p>
                  <p className="text-xs text-body/45">{d.category ?? '—'} · {d.video ? 'vidéo ✓' : 'sans vidéo'}</p>
                </div>
                <PlanBadge plan={d.level} />
                <button type="button" onClick={() => setDishModal({ open: true, dish: d })} aria-label="Modifier" className="rounded-lg p-2 text-body/50 hover:bg-sand-100 hover:text-royal-700"><Pencil className="h-4 w-4" /></button>
                <button type="button" onClick={() => removeDish(d)} aria-label="Supprimer" className="rounded-lg p-2 text-body/50 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
          {dishes.length === 0 && <p className="rounded-xl border border-dashed border-linec p-6 text-center text-sm text-body/45">Aucun plat. Ajoutez votre premier plat.</p>}
        </div>
      </div>

      {/* Colonne aperçu + partage */}
      <div className="space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wide text-body/70">Aperçu en direct</h2>
            {savedCard && (
              <button type="button" onClick={() => coverInput.current?.click()} className="btn-ghost text-xs"><UploadCloud className="h-3.5 w-3.5" /> Photo de couverture</button>
            )}
          </div>
          <input ref={coverInput} type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); }} />
          <CardRender card={draftCard} dishes={dishes} viewerLevel="gold" showLocks={false} />
        </div>

        {savedCard && status === 'publiee' && (
          <div className="card p-4">
            <h3 className="text-sm font-black uppercase tracking-wide text-body/70">Partage</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/c/${savedCard.shareSlug}`} target="_blank" className="btn-primary">Ouvrir la carte publique</Link>
              <button type="button" onClick={copyShare} className="btn-ghost"><Copy className="h-4 w-4" /> Copier le lien</button>
              <button type="button" onClick={generateQr} className="btn-ghost"><QrCode className="h-4 w-4" /> QR code</button>
              <Link href={`/c/${savedCard.shareSlug}?print=1`} target="_blank" className="btn-ghost"><FileText className="h-4 w-4" /> Export PDF</Link>
            </div>
            {showQr && (
              <div className="mt-3 flex flex-col items-center gap-2">
                {qrData ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrData} alt={`QR code vers ${shareUrl}`} className="h-48 w-48 rounded-xl border border-linec" />
                ) : (
                  <p className="text-xs text-body/45">Génération du QR…</p>
                )}
                <p className="break-all text-center text-xs text-body/45">{shareUrl}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modale plat */}
      {dishModal.open && savedCard && (
        <DishForm
          cardId={savedCard.id}
          dishId={dishModal.dish?.id}
          categories={categories}
          recipes={recipes}
          videoLimitMb={videoLimitMb}
          plan={plan}
          initial={dishModal.dish ? {
            name: dishModal.dish.name, description: dishModal.dish.description, price: dishModal.dish.price,
            category: dishModal.dish.category, level: dishModal.dish.level, allergens: dishModal.dish.allergens,
            recipeId: dishModal.dish.recipeId, video: dishModal.dish.video, status: dishModal.dish.status,
          } : undefined}
          onClose={() => setDishModal({ open: false })}
          onSaved={() => { setDishModal({ open: false }); router.refresh(); }}
          onQuotaExceeded={(info) => { setDishModal({ open: false }); setQuotaModal(info); }}
        />
      )}

      {/* Modale quota atteint */}
      {quotaModal && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-royal-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Limite de forfait atteinte">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-pop">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gold-50 text-gold-600"><Crown className="h-7 w-7" /></span>
            <h3 className="mt-4 font-display text-xl font-bold text-royal-900">Limite de votre forfait atteinte</h3>
            <p className="mt-2 text-sm text-body/60">
              Vous avez atteint la limite de votre forfait <strong>{PLAN_SHORT[plan]}</strong> ({quotaModal.limit} menus).
              Passez à un forfait supérieur pour continuer à créer.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              {nextLevel(plan) && (
                <Link href={`/paiement?plan=${nextLevel(plan)}`} className={nextLevel(plan) === 'gold' ? 'btn-gold justify-center' : 'btn-primary justify-center'}>
                  Passer à {PLAN_SHORT[nextLevel(plan)!]}
                </Link>
              )}
              <Link href="/forfaits" className="btn-ghost justify-center">Voir les forfaits</Link>
              <button type="button" onClick={() => setQuotaModal(null)} className="text-sm text-body/50 hover:text-body">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
