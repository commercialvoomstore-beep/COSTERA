// COSTERA — Reçu d'abonnement téléchargeable en PDF (réservé au propriétaire
// ou à l'administrateur).
import { NextRequest, NextResponse } from 'next/server';
import { PLAN_LABELS } from '@/lib/plans';
import { getSessionUserId } from '@/lib/auth';
import { getDB } from '@/server/db';
import { buildPdf } from '@/server/pdf';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDB();
  const userId = await getSessionUserId();
  const user = userId ? db.users.find((u) => u.id === userId) : null;
  if (!user) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });

  const sub = db.subscriptions.find((s) => s.id === id);
  if (!sub) return NextResponse.json({ error: 'Reçu introuvable.' }, { status: 404 });
  if (sub.userId !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  const owner = db.users.find((u) => u.id === sub.userId);
  const payReq = sub.paymentRequestId ? db.paymentRequests.find((r) => r.id === sub.paymentRequestId) : null;
  const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : '—');

  const pdf = buildPdf(
    [
      { text: 'COSTERA', size: 22, bold: true, gapAfter: 4 },
      { text: 'Reçu de paiement — Abonnement', size: 14, bold: true, gapAfter: 16 },
      { text: `Reçu n° : ${sub.id}`, size: 11 },
      { text: `Date d'émission : ${fmt(sub.startedAt)}`, size: 11, gapAfter: 12 },
      { text: `Client : ${owner?.name ?? '—'} (${owner?.email ?? '—'})`, size: 11 },
      { text: `Forfait : ${PLAN_LABELS[sub.plan]}`, size: 11 },
      { text: `Période : ${sub.period}`, size: 11 },
      { text: `Début : ${fmt(sub.startedAt)}   ·   Fin : ${sub.expiresAt ? fmt(sub.expiresAt) : 'illimitée'}`, size: 11, gapAfter: 12 },
      { text: `Montant réglé : ${sub.amount.toLocaleString('fr-FR')} FCFA`, size: 13, bold: true, gapAfter: 16 },
      { text: payReq ? `Référence de commande : ${payReq.ref}` : 'Référence de commande : —', size: 11 },
      { text: payReq?.txReference ? `Référence de transaction : ${payReq.txReference}` : '', size: 11, gapAfter: 24 },
      { text: 'Merci de votre confiance.', size: 11 },
      { text: '© COSTERA — VOOMNET FORMATION · Côte d\'Ivoire · FCFA', size: 9, gapAfter: 4 },
    ],
    `Reçu ${sub.id}`,
  );

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="recu-${sub.id}.pdf"`,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
