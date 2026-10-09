// COSTERA — Envoi d'e-mails transactionnels.
// Si la configuration SMTP est présente (variables d'environnement), les
// messages partent via nodemailer. Dans tous les cas, une copie est
// archivée dans data/outbox.json (consultable en démo sans SMTP) et
// l'échec d'envoi n'est jamais bloquant.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const OUTBOX = path.join(process.cwd(), 'data', 'outbox.json');

interface OutboxEntry extends MailMessage {
  sentAt: string;
  via: 'smtp' | 'outbox';
  error?: string;
}

function readOutbox(): OutboxEntry[] {
  try {
    if (!existsSync(OUTBOX)) return [];
    return JSON.parse(readFileSync(OUTBOX, 'utf8')) as OutboxEntry[];
  } catch {
    return [];
  }
}

function writeOutbox(entries: OutboxEntry[]): void {
  const dir = path.dirname(OUTBOX);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(OUTBOX, JSON.stringify(entries.slice(-200), null, 2), 'utf8');
}

/** Configuration SMTP lue depuis l'environnement. */
function smtpConfig() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return {
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  };
}

/**
 * Envoie un e-mail. Retourne `via: 'smtp'` si parti réellement,
 * `via: 'outbox'` sinon (archivé localement). Ne lève jamais d'exception.
 */
export async function sendMail(msg: MailMessage): Promise<{ via: 'smtp' | 'outbox'; error?: string }> {
  const cfg = smtpConfig();
  let result: { via: 'smtp' | 'outbox'; error?: string } = { via: 'outbox' };

  if (cfg) {
    try {
      // Import dynamique pour ne pas alourdir les bundles qui n'envoient pas.
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport(cfg);
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'COSTERA <no-reply@costera.ci>',
        to: msg.to,
        subject: msg.subject,
        text: msg.text,
        html: msg.html,
      });
      result = { via: 'smtp' };
    } catch (e) {
      result = { via: 'outbox', error: e instanceof Error ? e.message : String(e) };
    }
  }

  try {
    const box = readOutbox();
    box.push({ ...msg, sentAt: new Date().toISOString(), via: result.via, error: result.error });
    writeOutbox(box);
  } catch {
    // l'archivage ne doit jamais faire échouer l'action métier
  }
  return result;
}

/** Construit un lien absolu vers l'application (pour les e-mails). */
export function appUrl(pathname = '/'): string {
  const base = process.env.APP_URL || 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}${pathname}`;
}
