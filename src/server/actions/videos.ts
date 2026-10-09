'use server';

// COSTERA — Téléversement de la vidéo explicative d'un plat (section 4).
// FREE = lien externe uniquement ; SILVER / GOLD = fichier téléversé, avec
// une taille maximale propre à chaque forfait (paramétrable). Les helpers
// d'extraction d'ID externes vivent dans src/lib/video.ts.
import { resolvePlanConfig } from '@/lib/plans';
import type { VideoInfo } from '@/lib/types';
import { getCurrentUser } from '@/server/currentUser';
import { getDB } from '@/server/db';
import { userLevel } from '@/server/planService';
import { saveVideoFile } from '@/server/uploads';

export interface VideoUploadResult {
  ok: boolean;
  video?: VideoInfo;
  error?: string;
  /** Limite applicable (Mo) — pour affichage d'un message clair. */
  limitMb?: number;
  externalOnly?: boolean;
}

/** Téléverse une vidéo fichier en respectant la limite du forfait. */
export async function uploadVideoFileAction(formData: FormData): Promise<VideoUploadResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Session expirée.' };
  const db = getDB();
  const cfg = resolvePlanConfig(db.settings);
  const level = userLevel(user);
  const limitMb = cfg.videoMaxMb[level] ?? 0;

  if (limitMb <= 0) {
    return {
      ok: false,
      externalOnly: true,
      limitMb: 0,
      error: 'Votre forfait FREE permet uniquement les liens YouTube ou Vimeo. Passez à SILVER pour téléverser des fichiers vidéo.',
    };
  }

  const file = formData.get('video');
  const saved = await saveVideoFile(file instanceof File ? file : null, limitMb);
  if (!saved.ok || !saved.fileId) return { ok: false, limitMb, error: saved.error };

  const title = String(formData.get('title') || '').trim();
  const duration = Number(formData.get('durationSec') || 0);
  return {
    ok: true,
    limitMb,
    video: {
      kind: 'file',
      fileId: saved.fileId,
      title: title || undefined,
      durationSec: Number.isFinite(duration) && duration > 0 ? duration : undefined,
    },
  };
}
