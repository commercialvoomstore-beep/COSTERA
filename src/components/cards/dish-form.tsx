'use client';

// COSTERA — Formulaire plat/menu : infos, niveau d'accès, allergènes, photo,
// vidéo (lien externe ou fichier selon le forfait), lien fiche technique.
import { useEffect, useRef, useState } from 'react';
import { UploadCloud, Video, X } from 'lucide-react';
import { ALLERGENS } from '@/lib/costing-engine';
import { fcfa } from '@/lib/format';
import type { PlanLevel, Recipe, VideoChapter, VideoInfo } from '@/lib/types';
import { saveDishAction } from '@/server/actions/dishes';
import { uploadDishPhotoAction } from '@/server/actions/dishes';
import { uploadVideoFileAction } from '@/server/actions/videos';
import { PlanBadge } from '@/components/plan-ui';
import { useToast } from '@/components/toast';
import Link from 'next/link';

export interface DishFormProps {
  cardId: string;
  dishId?: string;
  categories: string[];
  recipes: { id: string; name: string }[];
  videoLimitMb: number; // 0 = lien externe uniquement
  plan: PlanLevel;
  initial?: {
    name: string; description?: string; price: number; category?: string; level: PlanLevel;
    allergens: string[]; recipeId?: string; video?: VideoInfo; status: 'brouillon' | 'publiee';
  };
  onClose: () => void;
  onSaved: () => void;
  onQuotaExceeded: (info: { used: number; limit: number; plan: string }) => void;
}

function parseTime(s: string): number {
  const m = s.match(/^(?:(\d+):)?(\d{1,2})$/);
  if (!m) return 0;
  return (Number(m[1] ?? 0) * 60) + Number(m[2]);
}

export function DishForm({ cardId, dishId, categories, recipes, videoLimitMb, plan, initial, onClose, onSaved, onQuotaExceeded }: DishFormProps) {
  const { toast } = useToast();
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [price, setPrice] = useState(initial?.price ?? 0);
  const [category, setCategory] = useState(initial?.category ?? categories[0] ?? '');
  const [level, setLevel] = useState<PlanLevel>(initial?.level ?? 'free');
  const [allergens, setAllergens] = useState<string[]>(initial?.allergens ?? []);
  const [recipeId, setRecipeId] = useState(initial?.recipeId ?? '');
  const [status, setStatus] = useState<'brouillon' | 'publiee'>(initial?.status ?? 'publiee');

  const [videoMode, setVideoMode] = useState<'none' | 'external' | 'file'>(initial?.video ? (initial.video.kind === 'file' ? 'file' : 'external') : 'none');
  const [videoUrl, setVideoUrl] = useState(initial?.video?.url ?? '');
  const [videoTitle, setVideoTitle] = useState(initial?.video?.title ?? '');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [chapters, setChapters] = useState<VideoChapter[]>(initial?.video?.chapters ?? []);
  const [newChapTime, setNewChapTime] = useState('');
  const [newChapLabel, setNewChapLabel] = useState('');

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (photoPreview) URL.revokeObjectURL(photoPreview); }, [photoPreview]);

  function toggleAllergen(a: string) {
    setAllergens((x) => (x.includes(a) ? x.filter((y) => y !== a) : [...x, a]));
  }

  function addChapter() {
    if (!newChapLabel.trim()) return;
    setChapters((c) => [...c, { t: parseTime(newChapTime), label: newChapLabel.trim() }].sort((a, b) => a.t - b.t));
    setNewChapTime('');
    setNewChapLabel('');
  }

  async function submit() {
    setError(null);
    if (!name.trim()) { setError('Le nom du plat est requis.'); return; }
    if (!Number.isFinite(price) || price < 0) { setError('Prix invalide.'); return; }

    // Construire la vidéo selon le mode.
    let video: VideoInfo | undefined = initial?.video;
    setBusy(true);
    try {
      if (videoMode === 'none') {
        video = undefined;
      } else if (videoMode === 'external') {
        const v = videoUrl.trim();
        if (!v) { setError('Collez un lien YouTube ou Vimeo.'); setBusy(false); return; }
        const parsed = v.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{6,20})/) ||
          v.match(/vimeo\.com\/(?:video\/)?(\d{6,12})/);
        if (!parsed) { setError('Lien vidéo non reconnu (YouTube ou Vimeo uniquement).'); setBusy(false); return; }
        video = {
          kind: /vimeo/.test(v) ? 'vimeo' : 'youtube',
          externalId: parsed[1],
          url: v,
          title: videoTitle.trim() || undefined,
          chapters,
        };
      } else if (videoMode === 'file') {
        if (videoLimitMb <= 0) {
          setError('Votre forfait permet uniquement les liens externes. Passez à SILVER pour téléverser une vidéo.');
          setBusy(false); return;
        }
        if (!videoFile) { setError('Choisissez un fichier vidéo (MP4 ou WebM).'); setBusy(false); return; }
        const fd = new FormData();
        fd.set('video', videoFile);
        fd.set('title', videoTitle);
        const up = await uploadVideoFileAction(fd);
        if (!up.ok || !up.video) { setError(up.error ?? 'Téléversement vidéo impossible.'); setBusy(false); return; }
        video = { ...up.video, chapters };
      }

      const res = await saveDishAction({
        id: dishId,
        cardId,
        name: name.trim(),
        description: description.trim() || undefined,
        price,
        category: category || undefined,
        level,
        allergens,
        recipeId: recipeId || undefined,
        status,
        video,
      });

      if (!res.ok) {
        if (res.quotaExceeded) {
          onQuotaExceeded({ used: res.used ?? 0, limit: res.limit ?? 0, plan: res.plan ?? plan });
          setBusy(false);
          return;
        }
        setError(res.error ?? 'Enregistrement impossible.');
        setBusy(false);
        return;
      }

      const savedId = res.id ?? dishId!;
      if (photo) {
        const pfd = new FormData();
        pfd.set('dishId', savedId);
        pfd.set('photo', photo);
        const up = await uploadDishPhotoAction(pfd);
        if (!up.ok) toast(`Plat enregistré, mais photo refusée : ${up.error}`, 'error');
      }
      toast('Plat enregistré.', 'success');
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center bg-royal-950/60 backdrop-blur-sm lg:items-center lg:p-8" role="dialog" aria-modal="true" aria-label="Plat">
      <div className="menu-panel relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl lg:rounded-3xl">
        <div className="flex items-center justify-between border-b border-linec px-6 py-4">
          <h3 className="font-display text-lg font-bold text-royal-900">{dishId ? 'Modifier le plat' : 'Ajouter un plat'}</h3>
          <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-full bg-sand-100 p-2 text-body/60 hover:bg-sand-200"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="d-name" className="label">Nom du plat *</label>
              <input id="d-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label htmlFor="d-price" className="label">Prix (FCFA) *</label>
              <input id="d-price" type="number" min={0} step={25} className="input tabular-nums" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <label htmlFor="d-cat" className="label">Catégorie</label>
              <select id="d-cat" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="d-desc" className="label">Description</label>
              <textarea id="d-desc" rows={2} className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          {/* Niveau d'accès */}
          <div>
            <span className="label">Niveau d'accès du plat</span>
            <div className="flex gap-2">
              {(['free', 'silver', 'gold'] as PlanLevel[]).map((l) => (
                <button key={l} type="button" onClick={() => setLevel(l)}
                  className={`flex-1 rounded-xl border px-3 py-2 transition ${level === l ? 'border-royal-600 bg-royal-50 ring-1 ring-royal-600' : 'border-linec hover:border-royal-300'}`}>
                  <PlanBadge plan={l} />
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-body/40">Les comptes d'un niveau inférieur verront ce plat verrouillé.</p>
          </div>

          {/* Allergènes */}
          <div>
            <span className="label">Allergènes</span>
            <div className="flex flex-wrap gap-1.5">
              {ALLERGENS.map((a) => (
                <button key={a} type="button" onClick={() => toggleAllergen(a)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${allergens.includes(a) ? 'bg-royal-700 text-white' : 'bg-sand-100 text-body/60 hover:bg-sand-200'}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Lien fiche technique */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="d-rec" className="label">Fiche technique (food cost)</label>
              <select id="d-rec" className="input" value={recipeId} onChange={(e) => setRecipeId(e.target.value)}>
                <option value="">— Aucune —</option>
                {recipes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="d-status" className="label">Statut</label>
              <select id="d-status" className="input" value={status} onChange={(e) => setStatus(e.target.value as 'brouillon' | 'publiee')}>
                <option value="publiee">Publié</option>
                <option value="brouillon">Brouillon</option>
              </select>
            </div>
          </div>

          {/* Photo */}
          <div>
            <span className="label">Photo du plat</span>
            <div className="flex items-center gap-3">
              {photoPreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="" className="h-16 w-16 rounded-xl object-cover" />
              )}
              <button type="button" onClick={() => photoInput.current?.click()} className="btn-ghost"><UploadCloud className="h-4 w-4" /> Choisir une image</button>
              <input ref={photoInput} type="file" accept="image/*" className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setPhoto(f);
                  if (photoPreview) URL.revokeObjectURL(photoPreview);
                  setPhotoPreview(f ? URL.createObjectURL(f) : null);
                }} />
            </div>
          </div>

          {/* Vidéo */}
          <div className="rounded-2xl border border-linec p-4">
            <div className="flex items-center justify-between">
              <span className="label flex items-center gap-1.5"><Video className="h-4 w-4 text-royal-600" /> Vidéo explicative</span>
              <span className="text-[11px] text-body/40">
                {videoLimitMb > 0 ? `Fichiers jusqu'à ${videoLimitMb} Mo` : 'Liens externes uniquement (forfait FREE)'}
              </span>
            </div>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => setVideoMode('none')} className={`rounded-full px-3 py-1 text-xs font-semibold ${videoMode === 'none' ? 'bg-royal-700 text-white' : 'bg-sand-100 text-body/60'}`}>Aucune</button>
              <button type="button" onClick={() => setVideoMode('external')} className={`rounded-full px-3 py-1 text-xs font-semibold ${videoMode === 'external' ? 'bg-royal-700 text-white' : 'bg-sand-100 text-body/60'}`}>Lien externe</button>
              <button type="button" onClick={() => setVideoMode('file')} disabled={videoLimitMb <= 0}
                className={`rounded-full px-3 py-1 text-xs font-semibold disabled:opacity-40 ${videoMode === 'file' ? 'bg-royal-700 text-white' : 'bg-sand-100 text-body/60'}`}>
                Fichier
              </button>
            </div>

            {videoMode === 'external' && (
              <input className="input mt-3" placeholder="https://www.youtube.com/watch?v=…" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
            )}
            {videoMode === 'file' && (
              <div className="mt-3 flex items-center gap-2">
                <button type="button" onClick={() => videoInput.current?.click()} className="btn-ghost"><UploadCloud className="h-4 w-4" /> Choisir MP4 / WebM</button>
                {videoFile && <span className="text-xs text-body/60">{videoFile.name} · {(videoFile.size / 1024 / 1024).toFixed(1)} Mo</span>}
                <input ref={videoInput} type="file" accept="video/mp4,video/webm" className="sr-only" onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)} />
              </div>
            )}
            {videoMode !== 'none' && (
              <div className="mt-3 space-y-1">
                <label className="label">Titre de la vidéo</label>
                <input className="input" value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} placeholder="Ex. Comment réaliser ce plat" />
              </div>
            )}

            {videoMode !== 'none' && (
              <div className="mt-3">
                <span className="label">Étapes clés (horodatage cliquable)</span>
                {chapters.map((c, i) => (
                  <div key={i} className="mt-1 flex items-center gap-2 text-xs">
                    <span className="w-14 rounded bg-sand-100 px-2 py-1 text-center tabular-nums">{String(Math.floor(c.t / 60)).padStart(2, '0')}:{String(c.t % 60).padStart(2, '0')}</span>
                    <span className="flex-1 truncate">{c.label}</span>
                    <button type="button" onClick={() => setChapters((x) => x.filter((_, j) => j !== i))} aria-label="Retirer" className="text-body/40 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
                <div className="mt-2 flex items-center gap-2">
                  <input className="input w-20 text-center tabular-nums" placeholder="mm:ss" value={newChapTime} onChange={(e) => setNewChapTime(e.target.value)} />
                  <input className="input flex-1" placeholder="Ex. Préparer la sauce" value={newChapLabel} onChange={(e) => setNewChapLabel(e.target.value)} />
                  <button type="button" onClick={addChapter} className="btn-ghost">Ajouter</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-linec px-6 py-4">
          <button type="button" onClick={onClose} className="btn-ghost">Annuler</button>
          <button type="button" onClick={submit} disabled={busy} className="btn-primary disabled:opacity-50">
            {busy ? 'Enregistrement…' : dishId ? 'Enregistrer' : 'Ajouter le plat'}
          </button>
        </div>
      </div>
    </div>
  );
}
