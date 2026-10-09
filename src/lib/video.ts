// COSTERA — Helpers vidéo : extraction d'ID YouTube/Vimeo et construction
// d'un objet VideoInfo pour les liens externes.
import type { VideoInfo } from './types';

/** Extrait l'ID d'une URL YouTube ou Vimeo. */
export function parseExternalVideo(url: string): { kind: 'youtube' | 'vimeo'; id: string } | null {
  const u = url.trim();
  const yt =
    u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{6,20})/) ||
    u.match(/^([A-Za-z0-9_-]{11})$/);
  if (yt) return { kind: 'youtube', id: yt[1] };
  const vim = u.match(/vimeo\.com\/(?:video\/)?(\d{6,12})/) || u.match(/^(\d{8,12})$/);
  if (vim) return { kind: 'vimeo', id: vim[1] };
  return null;
}

/** Construit un VideoInfo à partir d'un lien externe (YouTube/Vimeo). */
export function buildExternalVideo(url: string, title?: string): VideoInfo | null {
  const parsed = parseExternalVideo(url);
  if (!parsed) return null;
  return {
    kind: parsed.kind,
    externalId: parsed.id,
    url: url.trim(),
    title: title?.trim() || undefined,
  };
}

/** URL d'intégration (iframe) d'une vidéo externe. */
export function embedUrl(video: VideoInfo): string | null {
  if (video.kind === 'youtube' && video.externalId) {
    return `https://www.youtube-nocookie.com/embed/${video.externalId}`;
  }
  if (video.kind === 'vimeo' && video.externalId) {
    return `https://player.vimeo.com/video/${video.externalId}`;
  }
  return null;
}

/** Formate un nombre de secondes en mm:ss. */
export function fmtDuration(sec?: number): string {
  if (!sec || sec <= 0) return '';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
