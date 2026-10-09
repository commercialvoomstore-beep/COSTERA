// COSTERA — Servir les fichiers PRIVÉS (justificatifs, vidéos, images)
// avec contrôle d'accès côté serveur. Les fichiers vivent dans data/uploads,
// hors de /public, et ne sont jamais servis sans validation.
import { readFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { canAccessLevel } from '@/lib/plans';
import { getSessionUserId } from '@/lib/auth';
import { getDB, resolveUploadPath } from '@/server/db';
import { userLevel } from '@/server/planService';

export const dynamic = 'force-dynamic';

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

function mimeOf(pathname: string): string {
  const ext = pathname.slice(pathname.lastIndexOf('.')).toLowerCase();
  return MIME[ext] ?? 'application/octet-stream';
}

/**
 * Politique d'accès :
 * - `proofs/*`  : l'admin ou le propriétaire de la demande de paiement.
 * - `videos/*` & `images/*` : accessibles si le plat qui les référence est au
 *   niveau du visiteur (un plat FREE est visible de tous, même anonyme) ;
 *   sinon réservés au propriétaire / admin.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const fileId = path.join('/');
  const full = resolveUploadPath(fileId);
  if (!full) return NextResponse.json({ error: 'Fichier introuvable.' }, { status: 404 });

  const db = getDB();
  const userId = await getSessionUserId();
  const user = userId ? db.users.find((u) => u.id === userId) : null;
  const level = user ? userLevel(user) : 'free';
  const isAdmin = user?.role === 'admin';

  const [folder] = fileId.split('/');
  let allowed = false;

  if (folder === 'proofs') {
    // Justificatifs : admin ou propriétaire de la demande.
    const reqs = db.paymentRequests.filter((r) => r.proofFileId === fileId);
    allowed = isAdmin || reqs.some((r) => r.userId === user?.id);
  } else if (folder === 'videos' || folder === 'images') {
    // Médias de plats : visibles si le plat est au niveau du visiteur.
    const dishes = db.dishes.filter(
      (d) => d.video?.fileId === fileId || d.photoFileId === fileId || d.video?.posterFileId === fileId,
    );
    if (dishes.length === 0) {
      allowed = isAdmin; // fichier orphelin → admin seulement
    } else {
      allowed =
        dishes.some((d) => canAccessLevel(level, d.level)) ||
        dishes.some((d) => d.ownerId === user?.id) ||
        isAdmin;
    }
  }

  if (!allowed) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  const buffer = await readFile(full);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': mimeOf(full),
      'Content-Length': String(buffer.length),
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
