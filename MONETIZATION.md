# COSTERA — Monétisation SaaS (Livraison)

Ce document accompagne la mise en production des forfaits **FREE / SILVER / GOLD**,
des quotas, du paiement par justificatif avec validation administrateur, des vidéos
explicatives, des cartes numériques, du profil du chef et du système de notifications.

> Toute la logique existante (authentification, rôles, comptes démo, modal « Découvrir »,
> moteur de calcul du food cost) a été conservée intacte. Les verrouillages, quotas et
> accès sont appliqués **côté serveur uniquement** : aucun contenu payant (vidéo, recette
> détaillée, coût détaillé) n'est transmis au navigateur avant validation.

---

## 1. Comptes de démonstration

Mot de passe commun : `COSTERA2026`

| Compte | Rôle | Forfait | Menus |
|---|---|---|---|
| `admin@costera.ci` | Administrateur | GOLD (admin ⇒ accès total) | — |
| `chef@costera.ci` | Chef de cuisine | FREE | 5 / 5 (quota atteint) |
| `gestion@costera.ci` | Gestionnaire | SILVER | — |
| `chef.silver@costera.ci` | Chef de cuisine | SILVER | 10 / 10 (quota atteint) |
| `chef.gold@costera.ci` | Chef de cuisine | GOLD | 12 / illimité |

Chaque chef possède **2 cartes** complètes (maquis, boissons, bistronomie, dégustation,
événementielle) avec **6 plats ivoiriens** chacune (attiéké-poisson braisé, kédjénou,
alloco-poulet braisé, foutou-sauce graine, gâteau au gingembre, bissap), répartis sur les
trois niveaux.

**Réinitialiser la démo** : arrêter le serveur, supprimer `data/`, relancer — les données
sont régénérées automatiquement.

---

## 2. Variables d'environnement

Créer un fichier `.env.local` à la racine. Toutes sont optionnelles (des valeurs de repli
sont prévues), sauf `COSTERA_SECRET` en production.

| Variable | Rôle | Défaut |
|---|---|---|
| `COSTERA_SECRET` | Secret de signature des sessions (HMAC). **À changer en prod.** | `costera-secret-demo-v1` |
| `SMTP_HOST` | Serveur d'envoi des e-mails (notifications admin/validation). Si absent, l'e-mail est consigné dans `data/outbox.json` au lieu d'être envoyé. | *(désactivé)* |
| `SMTP_PORT` | Port SMTP. | `587` |
| `SMTP_SECURE` | `true` pour TLS implicite (port 465). | `false` |
| `SMTP_USER` / `SMTP_PASS` | Identifiants SMTP (authentification si renseignés). | *(aucun)* |
| `SMTP_FROM` | Adresse d'expéditeur affichée. | `COSTERA <no-reply@costera.ci>` |
| `APP_URL` | URL publique du site, utilisée dans les liens des e-mails. | `http://localhost:3000` |

### Tarifs, quotas et tailles vidéo — PAS de variable d'environnement

Conformément au cahier des charges, les **prix des forfaits, les quotas de menus, les tailles
vidéo maximales et la TVA sont paramétrés dans l'application**, jamais codés en dur :
`Paramètres → Forfaits & tarification` (réservé à l'administrateur). Les valeurs par défaut :

- SILVER : 15 000 FCFA/mois · 150 000 FCFA/an — quota 10 menus
- GOLD : 35 000 FCFA/mois · 350 000 FCFA/an — quota illimité
- FREE : quota 5 menus
- Vidéo : FREE = lien externe uniquement (0 Mo) · SILVER ≤ 100 Mo · GOLD ≤ 500 Mo
- TVA : 18 % (activable)

### Stockage

- Fichiers privés (justificatifs, vidéos, images) : `data/uploads/{proofs,videos,images}` —
  **hors** du dossier public, servis uniquement via `/api/file/...` après contrôle d'accès.
- Taille max d'un justificatif : **5 Mo** (constante `MAX_PROOF_BYTES`, types JPG/PNG/PDF).

---

## 3. Fichiers livrés (par module)

### Fondations (forfaits & sécurité)
- `src/lib/plans.ts` — niveaux, accès (`canAccessLevel`), quotas, prix, moyens de paiement,
  thèmes/polices/types de cartes, `resolvePlanConfig`, `nextLevel`, `effectivePlan`.
- `src/lib/video.ts` — extraction d'ID YouTube/Vimeo, construction `VideoInfo`, URL d'embed.
- `src/lib/media.ts` — résolution `mediaSrc` (statique vs `/api/file`).
- `src/server/planService.ts` — `userLevel`, `countUserDishes`, `checkDishQuota`,
  `computeExpiry`, notifications, référence de commande.
- `src/server/pdf.ts` — génération de PDF (reçus) sans dépendance externe.
- `src/server/uploads.ts` — stockage privé des justificatifs / vidéos / images.
- `src/server/mail.ts` — envoi SMTP avec repli local.

### Actions serveur (logique métier, toutes vérifiées côté serveur)
- `src/server/actions/plans.ts` — souscription, choix du moyen, envoi du justificatif,
  validation / refus admin.
- `src/server/actions/cards.ts` — enregistrement / couverture / suppression de carte.
- `src/server/actions/dishes.ts` — CRUD plats, quota à la création, photo, réordonnancement.
- `src/server/actions/videos.ts` — téléversement vidéo avec limite par forfait.
- `src/server/actions/profile.ts` — profil, logo, mot de passe, e-mail, suppression de compte.
- `src/server/actions/notifications.ts` — lecture des notifications.

### Routes API sécurisées
- `src/app/api/file/[...path]/route.ts` — sert les fichiers privés après contrôle d'accès
  (justificatifs = admin + propriétaire ; vidéos/images = propriétaire ou niveau suffisant).
- `src/app/api/recu/[id]/route.ts` — téléchargement du reçu PDF (propriétaire ou admin).

### Composants
- `src/components/plan-ui.tsx` — badges FREE/SILVER/GOLD, jauge de quota, verrou.
- `src/components/notification-bell.tsx` — cloche de notifications dans l'en-tête.
- `src/components/toast.tsx` — notifications éphémères.
- `src/components/plans/pricing.tsx` — page « Nos forfaits » + tableau comparatif.
- `src/components/plans/payment-stepper.tsx` — assistant Forfait → Paiement → Justificatif.
- `src/components/plans/requests-admin.tsx` — tableau de validation des demandes.
- `src/components/cards/card-render.tsx` — rendu d'une carte avec verrouillage par niveau.
- `src/components/cards/card-editor.tsx` — éditeur de carte (thèmes, catégories, aperçu live).
- `src/components/cards/dish-form.tsx` — formulaire de plat (photo, vidéo, chapitres, niveau).
- `src/components/cards/public-card-view.tsx` — vue publique avec cadenas / impression.
- `src/components/profile/profile-manager.tsx` — profil + sécurité + zone dangereuse.
- `src/components/forms/PlanSettingsForm.tsx` — paramètres admin des forfaits.

### Pages
- `/forfaits`, `/paiement`, `/abonnement`, `/demandes`, `/cartes`, `/cartes/nouvelle`,
  `/cartes/[id]`, `/profil`, `/parametres`, `/c/[slug]` (carte publique), `/dashboard`.

### Tests
- `monetization.test.mjs` — suite d'intégration serveur (40 assertions).

---

## 4. Procédures de test (par flux)

### 4.1 Quotas de menus
1. Connectez-vous avec `chef@costera.ci` (FREE, 5/5).
2. Allez sur **Cartes → Nouvelle carte**, puis ajoutez un plat : la création est **refusée**
   avec la fenêtre « Passer à SILVER / GOLD ».
3. Avec `chef.silver@costera.ci` (SILVER, 10/10), même constat au 11e plat.
4. Avec `chef.gold@costera.ci` (GOLD), la création est **illimitée**.

### 4.2 Verrouillage de contenu
1. Visitez une carte publique en navigation privée (visiteur = niveau FREE) :
   les plats SILVER/GOLD sont floutés, cadenas, « Débloquer avec SILVER/GOLD ».
2. Connectez-vous en GOLD : tout est visible, aucun cadenas.

### 4.3 Paiement + justificatif + validation
1. En FREE, allez sur **Forfaits → Choisir SILVER → Payer**.
2. Choisissez un moyen de paiement, obtenez la référence `CST-…`, téléversez une capture
   (JPG/PNG/PDF ≤ 5 Mo), saisissez la référence de transaction, envoyez.
3. La demande passe **EN ATTENTE** ; l'admin reçoit une notification + un e-mail.
4. Connectez-vous avec `admin@costera.ci`, ouvrez **Demandes d'abonnement**.
5. Visualisez le justificatif, cliquez **Valider** : le plan est activé (dates début/fin),
   l'utilisateur reçoit une notification, le contenu se déverrouille.
6. Pour tester le **refus** : cliquez **Refuser**, saisissez un motif obligatoire — la demande
   passe en « refusée » avec la raison, et l'utilisateur peut renvoyer un justificatif.

### 4.4 Justificatif invalide
Téléversez un fichier non image (ex. `.exe`) ou de plus de 5 Mo : l'envoi est refusé avec
un message clair, et rien n'est enregistré.

### 4.5 Vidéo explicative
1. Éditez un plat dans une carte (forfait SILVER ou GOLD).
2. Ajoutez une vidéo : soit un **lien YouTube/Vimeo** (l'ID est extrait automatiquement),
   soit un **fichier** (la taille est plafonnée selon le forfait).
3. En FREE, seule l'option « lien externe » est disponible.

### 4.6 Cartes & partage
1. Créez une carte (nom, slogan, thème, couleur, catégories), ajoutez des plats, glissez-déposez
   pour réordonner.
2. **Publiez** la carte : obtenez le lien public `/c/…`, copiez-le, générez le **QR code** et
   l'export **PDF** (A4).

### 4.7 Profil du chef
Dans **Profil** : renseignez l'entreprise, le logo, la bio, les coordonnées ; changez le mot de
passe (ancien requis) et l'e-mail ; testez la **suppression de compte** (double confirmation).

### 4.8 Tests automatisés
La suite d'intégration `monetization.test.mjs` couvre : les niveaux d'accès, les quotas
(6e plat FREE refusé, 11e plat SILVER refusé, GOLD illimité), le flux complet de paiement
(souscription, justificatif valide / invalide, validation, refus avec motif obligatoire),
la protection des cartes et l'extraction des vidéos externes.

```bash
# Depuis la racine du projet :
node_modules/.bin/esbuild monetization.test.mjs --bundle --platform=node --format=esm \
  --outfile=/tmp/m.bundle.mjs \
  --alias:@=$(pwd)/src \
  --alias:next/headers=$(pwd)/tests/mocks/next-headers.mjs \
  --alias:next/cache=$(pwd)/tests/mocks/next-cache.mjs \
  --alias:next/navigation=$(pwd)/tests/mocks/next-navigation.mjs \
  --alias:next/link=$(pwd)/tests/mocks/next-link.mjs \
  --alias:lucide-react=$(pwd)/tests/mocks/lucide-react.mjs --external:sharp
node /tmp/m.bundle.mjs
```
Résultat attendu : **40 réussis, 0 échecs**.

---

## 5. Sécurité appliquée

- Accès, quotas et verrouillages validés **exclusivement côté serveur** (jamais dans le client).
- Les fichiers privés sont servis via `/api/file` avec contrôle du rôle et du niveau.
- Les justificatifs ne sont visibles que par l'administrateur et le propriétaire.
- Limite de **3 demandes en attente** par compte (anti-spam).
- Aucun contenu payant n'est envoyé au navigateur avant validation effective.
- Session signée (HMAC) ; suppression de compte avec double confirmation et mot de passe.
