# COSTERA

**Food Cost, Coût Matière & Recettes**

> **Votre savoir-faire mérite une gestion à sa hauteur.**

COSTERA est une plateforme SaaS destinée aux chefs, restaurants, hôtels et traiteurs. Elle aide à maîtriser le coût matière, structurer les fiches techniques de recettes, suivre les prix des ingrédients et construire des menus rentables, avec une attention particulière portée à la cuisine ivoirienne.

| | |
| --- | --- |
| **Produit** | COSTERA |
| **Éditeur / réalisation** | VOOMNET FORMATION |
| **Version fonctionnelle de référence** | V1 — septembre 2026 |
| **Marché cible initial** | Côte d'Ivoire 🇨🇮 |
| **Devise par défaut** | FCFA (XOF) |

---

## 1. Vision du produit

COSTERA transforme les données d'une cuisine en décisions de gestion concrètes : chaque ingrédient a un prix, chaque recette a un coût, chaque menu a une rentabilité. La plateforme s'adresse aux professionnels de la restauration ivoirienne qui veulent piloter leur coût matière sans tableur ni approximation.

## 2. Fonctionnalités livrées (V1)

| Module | Ce qui est implémenté |
| --- | --- |
| 📊 **Tableau de bord** | Food cost moyen, marge moyenne, répartition du coût matière par catégorie, top 5 des coûts/portion, derniers mouvements de prix, alertes de dépassement d'objectif |
| 🥕 **Ingrédients** | Référentiel complet (catégories, unités d'achat, fournisseurs, taux de perte), historique de prix avec tendance graphique, saisie de nouveaux prix, protection à la suppression si utilisé dans des recettes |
| 👨‍🍳 **Fiches techniques** | Éditeur avec calcul du coût matière **en temps réel**, conversion d'unités, taux de perte, progression en étapes, statut (active / brouillon / archivée), prix conseillé selon l'objectif |
| 📈 **Règles de calcul** | Coût matière, coût/portion, food cost %, marge, coefficient multiplicateur, prix conseillé — recalculés à chaque variation de prix |
| 🍽️ **Menus** | Composition par sections, rentabilité plat par plat, food cost moyen du menu |
| 👥 **Rôles & droits** | Administrateur, Gestionnaire, Chef de cuisine — permissions appliquées côté interface **et** côté serveur |
| ⚙️ **Paramètres** | Objectif food cost, établissement, pays — l'objectif pilote toutes les alertes |
| 🔐 **Authentification** | Connexion e-mail/mot de passe, sessions signées (HMAC), comptes de démonstration |

## 3. Règles métier et calculs

```
Coût d'une ligne   = Quantité (convertie en unité d'achat) × Prix unitaire × (1 + taux de perte)
Coût matière       = Σ coûts des lignes
Coût / portion     = Coût matière ÷ nombre de portions
Food cost %        = Coût / portion ÷ Prix de vente
Marge / portion    = Prix de vente − Coût / portion
Coefficient        = Prix de vente ÷ Coût / portion
Prix conseillé     = Coût / portion ÷ Objectif food cost (arrondi au multiple de 25 FCFA)
```

**Code couleur du food cost** : 🟢 vert ≤ objectif · 🟠 ambre ≤ objectif + 8 points · 🔴 rouge au-delà.

## 4. Unités et conversions

- **Masse** (base kg) : mg, g, kg
- **Volume** (base l) : ml, cl, l
- **Pièce** : pièce
- **Conditionnements locaux** : botte, boîte, sachet, cube (pas de conversion inter-conditionnements ; un avertissement est affiché si une ligne mélange des dimensions incompatibles)

## 5. Rôles et droits d'accès

| Action | Admin | Gestionnaire | Chef |
| --- | :-: | :-: | :-: |
| Tableau de bord, consultation | ✅ | ✅ | ✅ |
| Saisir un nouveau prix d'achat | ✅ | ✅ | ✅ |
| Créer / modifier / supprimer des fiches techniques | ✅ | ✅ | ✅ |
| Créer / modifier / supprimer des ingrédients | ✅ | ✅ | — |
| Créer / modifier / supprimer des menus | ✅ | ✅ | — |
| Paramètres de la plateforme | ✅ | — | — |
| Gestion de l'équipe | ✅ | — | — |

## 6. Données de démonstration

La base est **initialisée automatiquement au premier lancement** avec un jeu de données réaliste :

- **35 ingrédients** du marché ivoirien (attiéké, plantain, igname, carpe fraîche, poisson fumé, crevettes séchées, pulpe de palme, gombo, bissap…) avec historique de prix daté et fournisseurs ;
- **13 recettes** classiques : garba, attiéké-poisson braisé, alloco, kedjenou de poulet, foutou banane sauce graine, sauce claire, riz sauce arachide, poulet braisé, placali sauce gombo, salade d'avocat, dèguè, jus de bissap, wassa-wassa (brouillon) ;
- **2 menus** : « Déjeuner du Maquis » et « Soirée Gastronomique Ivoirienne » ;
- **3 comptes** de démonstration.

### Comptes de démonstration

| Rôle | E-mail | Mot de passe |
| --- | --- | --- |
| Administrateur | `admin@costera.ci` | `costera2026` |
| Gestionnaire | `gestion@costera.ci` | `costera2026` |
| Chef de cuisine | `chef@costera.ci` | `costera2026` |

## 7. Architecture technique

| Brique | Choix | Justification |
| --- | --- | --- |
| Framework | **Next.js 15 (App Router) + TypeScript** | Rendu serveur, server components, server actions |
| Styling | **Tailwind CSS** | Identité visuelle COSTERA (orange brand / vert forest / fonds sable) |
| Icônes | lucide-react | Léger et cohérent |
| Authentification | Sessions signées HMAC (cookie httpOnly), mots de passe hachés scrypt | Sans dépendance externe, suffisant pour la V1 démo |
| Persistance | Base **JSON locale** (`data/*.json`) auto-initialisée | Démo autonome sans service externe ; la couche d'accès est isolée dans `src/server/db.ts` pour migrer vers une vraie base (PostgreSQL/Prisma…) |
| Calculs | Modules purs `src/lib/foodcost.ts` et `src/lib/units.ts` | Réutilisés côté serveur (rendu) et côté client (temps réel) |

### Structure du projet

```
src/
├── app/                    # Routes Next.js (App Router)
│   ├── page.tsx            # Landing page vitrine
│   ├── login/              # Connexion
│   └── (app)/              # Espace protégé (layout avec sidebar)
│       ├── dashboard/      # Tableau de bord
│       ├── ingredients/    # Liste + détail + historique de prix
│       ├── recettes/       # Liste, détail, création, édition
│       ├── menus/          # Menus + détail par section
│       ├── parametres/     # Réglages (admin)
│       └── equipe/         # Utilisateurs & rôles (admin)
├── components/             # UI (cartes, badges, graphiques SVG, formulaires)
├── lib/                    # Types, unités, calculs food cost, formatage FCFA, rôles, auth
└── server/                 # Accès données JSON, seed démo, server actions
```

## 8. Démarrage

```bash
npm install
npm run dev        # développement → http://localhost:3000
npm run build      # build de production
npm start          # serveur de production (0.0.0.0:3000)
```

Au premier lancement, le dossier `data/` est créé et alimenté avec les données de démonstration. Pour réinitialiser la démo, supprimez simplement ce dossier.

## 9. Sécurité & confidentialité (V1)

- Mots de passe hachés (scrypt + sel aléatoire), jamais stockés en clair ;
- Sessions signées (HMAC-SHA256), cookie httpOnly, expiration 7 jours ;
- Vérification des droits dans **chaque server action** (pas seulement dans l'interface) ;
- Validation systématique des données saisies côté serveur.

## 10. Feuille de route (au-delà de la V1)

- Multi-établissements / multi-cuisines ;
- Module fournisseurs et bons de commande ;
- Gestion des stocks et inventaires ;
- Export PDF des fiches techniques ;
- Historique de food cost par période et tableaux de bord avancés ;
- Authentification renforcée (e-mail de vérification, récupération de mot de passe) et base de données de production.

---

© 2026 **COSTERA** — édité par **VOOMNET FORMATION**. Version fonctionnelle V1.
