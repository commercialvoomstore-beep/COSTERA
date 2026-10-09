// COSTERA — Validation et enregistrement des fichiers téléversés
// (justificatifs, vidéos, images). Contrôle du type et de la taille CÔTÉ
// SERVEUR ; stockage dans l'espace privé data/uploads (hors /public).
import { saveUpload } from './db';

export const MAX_PROOF_BYTES = 5 * 1024 * 1024; // 5 Mo (justificatifs)

const PROOF_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'application/pdf': '.pdf',
};

export interface UploadResult {
  ok: boolean;
  fileId?: string;
  fileName?: string;
  error?: string;
}

/** Valide et enregistre un justificatif (JPG/PNG/PDF, 5 Mo max). */
export async function saveProofFile(file: File | undefined | null): Promise<UploadResult> {
  if (!file || typeof (file as File).arrayBuffer !== 'function') {
    return { ok: false, error: 'Aucun fichier reçu.' };
  }
  const type = (file.type || '').toLowerCase();
  const ext = PROOF_TYPES[type];
  if (!ext) {
    return { ok: false, error: 'Format non autorisé. Formats acceptés : JPG, PNG ou PDF.' };
  }
  if (file.size > MAX_PROOF_BYTES) {
    return { ok: false, error: 'Fichier trop volumineux : 5 Mo maximum.' };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length === 0) return { ok: false, error: 'Le fichier est vide.' };
  const fileId = saveUpload('proofs', `proof${ext}`, buffer);
  return { ok: true, fileId, fileName: file.name || `justificatif${ext}` };
}

/** Valide et enregistre une vidéo selon une taille maximale (Mo) donnée. */
export async function saveVideoFile(file: File | undefined | null, maxMb: number): Promise<UploadResult> {
  if (!file || typeof (file as File).arrayBuffer !== 'function') {
    return { ok: false, error: 'Aucun fichier vidéo reçu.' };
  }
  const type = (file.type || '').toLowerCase();
  const isMp4 = type === 'video/mp4' || /\.mp4$/i.test(file.name || '');
  const isWebm = type === 'video/webm' || /\.webm$/i.test(file.name || '');
  if (!isMp4 && !isWebm) {
    return { ok: false, error: 'Format vidéo non autorisé. Formats acceptés : MP4 ou WebM.' };
  }
  const maxBytes = maxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return { ok: false, error: `Vidéo trop volumineuse : ${maxMb} Mo maximum pour votre forfait.` };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileId = saveUpload('videos', `video${isWebm ? '.webm' : '.mp4'}`, buffer);
  return { ok: true, fileId, fileName: file.name };
}

/** Valide et enregistre une image (photo de plat, couverture, logo). */
export async function saveImageFile(file: File | undefined | null, maxMb = 8): Promise<UploadResult> {
  if (!file || typeof (file as File).arrayBuffer !== 'function') {
    return { ok: false, error: 'Aucune image reçue.' };
  }
  const type = (file.type || '').toLowerCase();
  const ext =
    type === 'image/jpeg' ? '.jpg' : type === 'image/png' ? '.png' : type === 'image/webp' ? '.webp' : null;
  if (!ext) return { ok: false, error: 'Format image non autorisé : JPG, PNG ou WebP.' };
  if (file.size > maxMb * 1024 * 1024) return { ok: false, error: `Image trop volumineuse : ${maxMb} Mo max.` };
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileId = saveUpload('images', `img${ext}`, buffer);
  return { ok: true, fileId, fileName: file.name };
}
