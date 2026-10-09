// COSTERA — Résolution des médias : un champ peut contenir soit un chemin
// statique public (« /dishes/x.jpg »), soit l'id d'un fichier privé
// (« images/f-xxx.jpg ») servi par la route contrôlée /api/file.

export function mediaSrc(fileId?: string): string | undefined {
  if (!fileId) return undefined;
  if (fileId.startsWith('/') || fileId.startsWith('http://') || fileId.startsWith('https://')) return fileId;
  return `/api/file/${fileId}`;
}

export function isPrivateMedia(fileId?: string): boolean {
  return Boolean(fileId && !fileId.startsWith('/') && !fileId.startsWith('http'));
}
