import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, encodeSession, verifyPassword } from '@/lib/auth';
import { getDB } from '@/server/db';

/**
 * Repli SANS JavaScript du formulaire de connexion (action native du
 * formulaire). Le parcours nominal reste l'action serveur loginAction
 * côté client ; ce point d'entrée garantit qu'un navigateur dont
 * l'hydratation a échoué (chunks cassés, proxy, extension) peut tout de
 * même se connecter : POST FormData → cookie de session → redirection.
 * Aucun mot de passe en clair n'est journalisé ; mêmes vérifications
 * (e-mail normalisé + scrypt timing-safe) que loginAction.
 */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const rawEmail = form?.get('email');
  const rawPassword = form?.get('password');
  const cleanEmail = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
  const password = typeof rawPassword === 'string' ? rawPassword : '';
  const user = cleanEmail ? getDB().users.find((u) => u.email.toLowerCase() === cleanEmail) : undefined;

  if (!user || !verifyPassword(password, user.passwordHash)) {
    // Retour au formulaire avec un message affiché côté serveur (SSR),
    // donc visible même sans JavaScript.
    return NextResponse.redirect(new URL('/login?erreur=identifiants', req.url), 303);
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, encodeSession(user.id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
  return NextResponse.redirect(new URL('/dashboard', req.url), 303);
}
