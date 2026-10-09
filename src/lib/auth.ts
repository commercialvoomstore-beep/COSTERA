// COSTERA — Authentification et sessions (démo V1)
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

const SECRET = process.env.COSTERA_SECRET || 'costera-secret-demo-v1';
export const SESSION_COOKIE = 'costera_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

export function hashPassword(password: string): string {
  const salt = randomBytes(8).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const check = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return check.length === expected.length && timingSafeEqual(check, expected);
}

function sign(payload: string): string {
  return createHmac('sha256', SECRET).update(payload).digest('base64url');
}

export function encodeSession(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ u: userId, exp: Date.now() + SESSION_TTL_MS })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

/** Retourne l'userId si le cookie de session est valide, sinon null. */
export function decodeSession(value: string | undefined): string | null {
  if (!value) return null;
  const dot = value.lastIndexOf('.');
  if (dot <= 0) return null;
  const payload = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { u?: string; exp?: number };
    if (!data.u || !data.exp || data.exp < Date.now()) return null;
    return data.u;
  } catch {
    return null;
  }
}

export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies();
  return decodeSession(store.get(SESSION_COOKIE)?.value);
}
