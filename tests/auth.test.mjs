// COSTERA — Suite de tests du parcours de connexion / session.
// Exécution (depuis la racine) :
//   node_modules/.bin/esbuild tests/auth.test.mjs --bundle --platform=node --format=esm \
//     --outfile=/tmp/auth.bundle.mjs --alias:@=$(pwd)/src \
//     --alias:next/headers=$(pwd)/tests/mocks/next-headers.mjs \
//     --alias:next/cache=$(pwd)/tests/mocks/next-cache.mjs \
//     --alias:next/navigation=$(pwd)/tests/mocks/next-navigation.mjs \
//     --alias:next/link=$(pwd)/tests/mocks/next-link.mjs \
//     --alias:lucide-react=$(pwd)/tests/mocks/lucide-react.mjs --external:sharp
//   node /tmp/auth.bundle.mjs
import { createHmac } from 'crypto';
import { loginAction, logoutAction, registerAction } from '@/server/actions/auth';
import { decodeSession, encodeSession, hashPassword, verifyPassword, SESSION_COOKIE } from '@/lib/auth';
import { getDB, saveDB } from '@/server/db';

let ok = 0;
let ko = 0;
function check(label, cond) {
  if (cond) { ok++; console.log('  PASS', label); }
  else { ko++; console.log('  ÉCHEC', label); }
}

const DEMO = [
  ['admin@costera.ci', 'admin'],
  ['chef@costera.ci', 'chef'],
  ['gestion@costera.ci', 'gestionnaire'],
  ['chef.silver@costera.ci', 'chef'],
  ['chef.gold@costera.ci', 'chef'],
];

console.log('== 1. Connexion des comptes de démonstration ==');
for (const [email, role] of DEMO) {
  globalThis.__TEST_COOKIE_SET = undefined;
  const res = await loginAction(email, 'COSTERA2026');
  const set = globalThis.__TEST_COOKIE_SET;
  check(`${email} → session créée`, res.ok === true && !!set && set.name === SESSION_COOKIE);
  check(`${email} → cookie httpOnly, path /, 7 jours`, !!set && set.opts?.httpOnly === true && set.opts?.path === '/' && set.opts?.maxAge === 7 * 24 * 60 * 60);
  const uid = decodeSession(set?.value);
  const user = getDB().users.find((u) => u.email === email);
  check(`${email} → cookie signé = userId (${uid}) et rôle ${role}`, uid === user?.id && user?.role === role);
}

console.log('== 2. Refus et messages utiles ==');
globalThis.__TEST_COOKIE_SET = undefined;
const bad = await loginAction('admin@costera.ci', 'MAUVAIS');
check('mot de passe incorrect → ok:false + message', bad.ok === false && !!bad.error && bad.error.length > 5);
const unknown = await loginAction('inconnu@costera.ci', 'COSTERA2026');
check('e-mail inconnu → ok:false + message', unknown.ok === false && !!bad.error);
const empty = await loginAction('  ', '');
check('champs vides → ok:false + message', empty.ok === false && !!empty.error);
check('aucun cookie créé après trois échecs', globalThis.__TEST_COOKIE_SET === undefined);

console.log('== 3. Session : signature, expiration, altération ==');
const token = encodeSession('usr-yao');
check('decodeSession(token) = usr-yao', decodeSession(token) === 'usr-yao');
check('signature altérée → null', decodeSession(token.slice(0, -3) + 'abc') === null);
check('charge utile altérée → null', decodeSession('AAAA' + token.slice(4)) === null);
const SECRET = process.env.COSTERA_SECRET || 'costera-secret-demo-v1';
const sign = (p) => createHmac('sha256', SECRET).update(p).digest('base64url');
const expiredPayload = Buffer.from(JSON.stringify({ u: 'usr-yao', exp: Date.now() - 1000 })).toString('base64url');
check('session expirée (signée) → null', decodeSession(`${expiredPayload}.${sign(expiredPayload)}`) === null);
check('valeur absente → null', decodeSession(undefined) === null);
check('poubelle → null', decodeSession('nimporte-quoi') === null);

console.log('== 4. Mots de passe : jamais en clair ==');
const h = hashPassword('COSTERA2026');
check('hash = sel:empreinte scrypt', /^[0-9a-f]{16}:[0-9a-f]{128}$/.test(h));
check('verifyPassword valide', verifyPassword('COSTERA2026', h) === true);
check('verifyPassword refuse un autre mot de passe', verifyPassword('COSTERA2025', h) === false);
check('aucun hash de démo ne contient le mot de passe en clair', getDB().users.every((u) => !u.passwordHash.includes('COSTERA2026')));

console.log('== 5. Lecture de session côté serveur ==');
globalThis.__TEST_USER_ID = 'usr-yao';
const { getSessionUserId } = await import('@/lib/auth');
check('getSessionUserId lit le cookie', (await getSessionUserId()) === 'usr-yao');
globalThis.__TEST_USER_ID = null;
check('sans cookie → null', (await getSessionUserId()) === null);

console.log('== 6. Déconnexion ==');
globalThis.__TEST_COOKIE_DELETED = undefined;
await logoutAction();
check('logoutAction supprime le cookie de session', globalThis.__TEST_COOKIE_DELETED === SESSION_COOKIE);

console.log('== 7. Inscription (compte créé puis retiré) ==');
const before = getDB().users.length;
globalThis.__TEST_COOKIE_SET = undefined;
const reg = await registerAction({ firstName: 'Test', lastName: 'Audit', email: 'audit@costera.ci', profile: 'chef', password: 'Audit2026!' });
const db = getDB();
const created = db.users.find((u) => u.email === 'audit@costera.ci');
check('inscription ok + session ouverte', reg.ok === true && !!created && !!globalThis.__TEST_COOKIE_SET);
check('rôle chef par profil, mot de passe hashé', created?.role === 'chef' && !!created?.passwordHash && created.passwordHash !== 'Audit2026!');
const dup = await registerAction({ firstName: 'Test', lastName: 'Audit', email: 'audit@costera.ci', profile: 'chef', password: 'Audit2026!' });
check('e-mail déjà pris → refus', dup.ok === false && !!dup.error);
const weak = await registerAction({ firstName: 'T', lastName: 'A', email: 'faible@costera.ci', profile: 'chef', password: '123' });
check('mot de passe < 8 caractères → refus', weak.ok === false && !!weak.error);
// Nettoyage : on retire le compte de test sans toucher aux autres données.
saveDB({ ...getDB(), users: getDB().users.filter((u) => u.email !== 'audit@costera.ci') });
check('compte de test retiré, base intacte', getDB().users.length === before);

console.log(`\nRESULTAT: ${ok} réussis, ${ko} échecs`);
if (ko > 0) process.exit(1);
