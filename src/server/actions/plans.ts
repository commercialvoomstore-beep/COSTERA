'use server';

// COSTERA — Souscription, paiement, justificatif et validation admin.
// Toutes les règles (montants, statuts, activation) sont appliquées ici,
// côté serveur. L'interface ne fait qu'afficher.
import { revalidatePath } from 'next/cache';
import { resolvePlanConfig } from '@/lib/plans';
import type { PaymentPeriod, PaymentRequest, PlanLevel } from '@/lib/types';
import { assertRole, getCurrentUser } from '@/server/currentUser';
import { getDB, newId, nowISO, saveDB } from '@/server/db';
import { appUrl, sendMail } from '@/server/mail';
import {
  MAX_PENDING_REQUESTS,
  computeExpiry,
  nextOrderRef,
  pendingRequestsFor,
  pushNotification,
} from '@/server/planService';
import { saveProofFile } from '@/server/uploads';

/* ------------------------------------------------------------------ */
/* 1. Récapitulatif de commande                                         */
/* ------------------------------------------------------------------ */

export interface OrderSummary {
  ref: string;
  plan: PlanLevel;
  period: PaymentPeriod;
  amountHt: number;
  tvaAmount: number;
  amountTotal: number;
}

/** Crée une demande de paiement (statut en_attente) et retourne le récap. */
export async function startSubscriptionAction(input: {
  plan: PlanLevel;
  period: PaymentPeriod;
}): Promise<{ ok: boolean; ref?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Session expirée. Veuillez vous reconnecter.' };
  const { plan, period } = input;
  if (plan === 'free') return { ok: false, error: 'Le forfait FREE est gratuit : aucune souscription nécessaire.' };

  const db = getDB();
  const cfg = resolvePlanConfig(db.settings);

  if (pendingRequestsFor(db, user.id) >= MAX_PENDING_REQUESTS) {
    return {
      ok: false,
      error: `Vous avez déjà ${MAX_PENDING_REQUESTS} demandes en attente. Attendez leur validation avant d'en créer une nouvelle.`,
    };
  }

  const price = cfg.prices[plan as 'silver' | 'gold'];
  const amountHt = period === 'annuel' ? price.yearly : price.monthly;
  const tvaAmount = cfg.tvaEnabled ? Math.round((amountHt * cfg.tvaPct) / 100) : 0;
  const amountTotal = amountHt + tvaAmount;

  const request: PaymentRequest = {
    id: newId('pay'),
    ref: nextOrderRef(db),
    userId: user.id,
    plan,
    period,
    amountHt,
    tvaAmount,
    amountTotal,
    status: 'en_attente',
    createdAt: nowISO(),
    audit: [{ action: 'création', by: user.id, at: nowISO() }],
  };
  db.paymentRequests.push(request);
  saveDB(db);
  revalidatePath('/abonnement');
  return { ok: true, ref: request.ref };
}

/* ------------------------------------------------------------------ */
/* 2. Choix du moyen de paiement                                        */
/* ------------------------------------------------------------------ */

export async function setPaymentMethodAction(ref: string, methodId: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Session expirée.' };
  const db = getDB();
  const req = db.paymentRequests.find((r) => r.ref === ref && r.userId === user.id);
  if (!req) return { ok: false, error: 'Commande introuvable.' };
  req.methodId = methodId;
  req.audit.push({ action: 'moyen de paiement choisi', by: user.id, at: nowISO(), note: methodId });
  saveDB(db);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* 3. Envoi du justificatif                                             */
/* ------------------------------------------------------------------ */

export async function submitProofAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Session expirée. Veuillez vous reconnecter.' };
  const ref = String(formData.get('ref') || '');
  const txReference = String(formData.get('txReference') || '').trim();
  const txNumber = String(formData.get('txNumber') || '').trim();
  const proof = formData.get('proof');

  const db = getDB();
  const req = db.paymentRequests.find((r) => r.ref === ref && r.userId === user.id);
  if (!req) return { ok: false, error: 'Commande introuvable.' };
  // Une demande refusée peut être renvoyée avec un nouveau justificatif.
  if (req.status !== 'en_attente' && req.status !== 'refusee') {
    return { ok: false, error: 'Cette demande a déjà été traitée.' };
  }
  if (!txReference) return { ok: false, error: 'Indiquez la référence de transaction.' };

  const saved = await saveProofFile(proof instanceof File ? proof : null);
  if (!saved.ok || !saved.fileId) return { ok: false, error: saved.error ?? 'Justificatif invalide.' };

  req.proofFileId = saved.fileId;
  req.proofFileName = saved.fileName;
  req.txReference = txReference;
  req.txNumber = txNumber || undefined;
  req.submittedAt = nowISO();
  req.status = 'en_attente'; // (re)passe en attente après un renvoi
  req.refuseReason = undefined;
  req.audit.push({ action: 'justificatif envoyé', by: user.id, at: nowISO(), note: saved.fileName });
  saveDB(db);

  // Notification + e-mail à l'administrateur.
  const admins = db.users.filter((u) => u.role === 'admin');
  for (const admin of admins) {
    pushNotification(db, admin.id, 'Nouvelle demande d’abonnement', {
      body: `${user.name} demande le forfait ${req.plan.toUpperCase()} (${req.ref}).`,
      kind: 'payment',
      link: '/demandes',
    });
    await sendMail({
      to: admin.email,
      subject: `[COSTERA] Nouvelle demande d'abonnement ${req.ref}`,
      text: [
        'Bonjour,',
        '',
        `Une demande d'abonnement a été déposée sur COSTERA.`,
        '',
        `Utilisateur : ${user.name} (${user.email})`,
        `Forfait demandé : ${req.plan.toUpperCase()} (${req.period})`,
        `Montant total : ${req.amountTotal} FCFA`,
        `Référence : ${req.ref}`,
        `Référence de transaction : ${txReference}`,
        `Date : ${new Date().toLocaleString('fr-FR')}`,
        '',
        `Voir la demande : ${appUrl('/demandes')}`,
        `Justificatif : ${appUrl(`/api/file/${saved.fileId}`)}`,
        '',
        '— COSTERA',
      ].join('\n'),
    });
  }
  saveDB(db);

  pushNotification(db, user.id, 'Demande envoyée', {
    body: `Votre demande ${req.ref} est en attente de validation.`,
    kind: 'info',
    link: '/abonnement',
  });
  saveDB(db);
  revalidatePath('/abonnement');
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* 4. Validation / refus par l'admin                                    */
/* ------------------------------------------------------------------ */

export async function validateRequestAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const guard = await assertRole('admin');
  if (!guard.ok) return guard;
  const admin = guard.user;
  const db = getDB();
  const req = db.paymentRequests.find((r) => r.id === id);
  if (!req) return { ok: false, error: 'Demande introuvable.' };
  if (req.status !== 'en_attente') return { ok: false, error: 'Cette demande a déjà été traitée.' };

  const user = db.users.find((u) => u.id === req.userId);
  if (!user) return { ok: false, error: 'Utilisateur introuvable.' };

  // Activation du forfait : dates de début et de fin enregistrées.
  const startedAt = nowISO();
  const expiresAt = computeExpiry(req.period);
  user.plan = req.plan;
  user.planStartedAt = startedAt;
  user.planExpiresAt = expiresAt;

  req.status = 'validee';
  req.decidedAt = nowISO();
  req.decidedBy = admin.id;
  req.audit.push({ action: 'validation', by: admin.id, at: nowISO() });

  db.subscriptions.push({
    id: newId('sub'),
    userId: user.id,
    plan: req.plan,
    period: req.period,
    amount: req.amountTotal,
    startedAt,
    expiresAt,
    paymentRequestId: req.id,
  });

  pushNotification(db, user.id, `Votre forfait ${req.plan.toUpperCase()} est activé`, {
    body: `Valable jusqu'au ${new Date(expiresAt).toLocaleDateString('fr-FR')}. Les contenus ${req.plan.toUpperCase()} sont déverrouillés.`,
    kind: 'success',
    link: '/abonnement',
  });
  await sendMail({
    to: user.email,
    subject: `[COSTERA] Votre forfait ${req.plan.toUpperCase()} est activé`,
    text: [
      `Bonjour ${user.name},`,
      '',
      `Votre forfait ${req.plan.toUpperCase()} est activé.`,
      `Période : ${req.period}. Expire le ${new Date(expiresAt).toLocaleDateString('fr-FR')}.`,
      `Montant réglé : ${req.amountTotal} FCFA (réf. ${req.ref}).`,
      '',
      'Les contenus du niveau concerné sont maintenant déverrouillés.',
      '',
      '— COSTERA',
    ].join('\n'),
  });

  saveDB(db);
  revalidatePath('/demandes');
  revalidatePath('/abonnement');
  return { ok: true };
}

export async function refuseRequestAction(id: string, reason: string): Promise<{ ok: boolean; error?: string }> {
  const guard = await assertRole('admin');
  if (!guard.ok) return guard;
  const admin = guard.user;
  const motif = reason.trim();
  if (!motif) return { ok: false, error: 'Le motif de refus est obligatoire.' };

  const db = getDB();
  const req = db.paymentRequests.find((r) => r.id === id);
  if (!req) return { ok: false, error: 'Demande introuvable.' };
  if (req.status !== 'en_attente') return { ok: false, error: 'Cette demande a déjà été traitée.' };

  req.status = 'refusee';
  req.refuseReason = motif;
  req.decidedAt = nowISO();
  req.decidedBy = admin.id;
  req.audit.push({ action: 'refus', by: admin.id, at: nowISO(), note: motif });

  const user = db.users.find((u) => u.id === req.userId);
  if (user) {
    pushNotification(db, user.id, 'Demande d’abonnement refusée', {
      body: `${motif}. Vous pouvez renvoyer un justificatif.`,
      kind: 'warning',
      link: '/abonnement',
    });
    await sendMail({
      to: user.email,
      subject: `[COSTERA] Votre demande ${req.ref} a été refusée`,
      text: [
        `Bonjour ${user.name},`,
        '',
        `Votre demande d'abonnement ${req.ref} n'a pas pu être validée.`,
        `Motif : ${motif}`,
        '',
        'Vous pouvez renvoyer un justificatif depuis votre espace « Mon abonnement ».',
        '',
        '— COSTERA',
      ].join('\n'),
    });
  }

  saveDB(db);
  revalidatePath('/demandes');
  revalidatePath('/abonnement');
  return { ok: true };
}
