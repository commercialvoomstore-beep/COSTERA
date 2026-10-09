import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  ChefHat,
  ClipboardList,
  LineChart,
  Percent,
  Salad,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UtensilsCrossed,
} from 'lucide-react';
import { Logo } from '@/components/ui';

const FEATURES = [
  {
    icon: Percent,
    title: 'Food cost & coût matière',
    text: 'Chaque fiche technique calcule automatiquement son coût matière, son ratio matière sur vente, sa marge et son coefficient multiplicateur.',
  },
  {
    icon: BookOpen,
    title: 'Fiches techniques structurées',
    text: 'Ingrédients, quantités, unités, taux de perte, progression en étapes et rendement : vos recettes deviennent des documents de gestion.',
  },
  {
    icon: TrendingUp,
    title: 'Suivi des prix d’achat',
    text: 'Historique de prix par ingrédient, fournisseurs, variations et alertes : suivez le marché d’Adjamé à Treichville sans vous faire surprendre.',
  },
  {
    icon: UtensilsCrossed,
    title: 'Menus rentables',
    text: 'Composez vos menus par sections et visualisez la rentabilité plat par plat pour construire une carte qui travaille pour vous.',
  },
  {
    icon: Salad,
    title: 'Pensé pour la cuisine ivoirienne',
    text: 'Attiéké, garba, kedjenou, sauce graine, placali… avec les unités locales : botte, cube, boîte, pièce et le franc CFA comme devise native.',
  },
  {
    icon: ShieldCheck,
    title: 'Rôles & droits d’accès',
    text: 'Administrateur, gestionnaire, chef de cuisine : chacun agit dans son périmètre, la direction garde la main sur les paramètres.',
  },
];

const FORMULAS = [
  { icon: Scale, name: 'Coût matière', formula: 'Σ (Quantité × Prix unitaire) × (1 + perte)' },
  { icon: Percent, name: 'Food cost %', formula: 'Coût matière ÷ Prix de vente' },
  { icon: Sparkles, name: 'Prix conseillé', formula: 'Coût matière ÷ Objectif food cost' },
  { icon: LineChart, name: 'Coefficient', formula: 'Prix de vente ÷ Coût matière' },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-sand-50">
      {/* Barre de navigation */}
      <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-sand-50/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm font-medium text-stone-600 md:flex">
            <a href="#fonctionnalites" className="hover:text-ink">Fonctionnalités</a>
            <a href="#methode" className="hover:text-ink">Méthode</a>
            <a href="#cuisine" className="hover:text-ink">Cuisine ivoirienne</a>
          </nav>
          <Link href="/login" className="btn-dark">
            Se connecter
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-brand-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 top-40 h-80 w-80 rounded-full bg-forest-200/40 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:pt-24">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-xs font-bold text-brand-800">
              <ChefHat className="h-3.5 w-3.5" />
              V1 — Septembre 2026 · Côte d’Ivoire · Devise FCFA (XOF)
            </p>
            <h1 className="text-4xl font-black leading-[1.08] tracking-tight text-ink sm:text-6xl">
              Votre savoir-faire mérite <span className="text-brand-600">une gestion à sa hauteur.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-stone-600">
              COSTERA est une plateforme SaaS destinée aux chefs, restaurants, hôtels et traiteurs. Elle aide à maîtriser le
              coût matière, structurer les fiches techniques de recettes, suivre les prix des ingrédients et construire des
              menus rentables — avec une attention particulière portée à la cuisine ivoirienne.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/login" className="btn-primary px-6 py-3 text-base">
                Accéder à la plateforme
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#methode" className="btn-ghost px-6 py-3 text-base">
                Découvrir la méthode
              </a>
            </div>
            <p className="mt-6 text-sm text-stone-500">
              COSTERA transforme les données d’une cuisine en décisions de gestion concrètes : chaque ingrédient a un prix,
              chaque recette a un coût, chaque menu a une rentabilité.
            </p>
          </div>
        </div>
      </section>

      {/* Bandeau chiffres */}
      <section className="border-y border-stone-200 bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 md:grid-cols-4">
          {[
            { value: 'FCFA', label: 'Devise native (XOF)' },
            { value: '13', label: 'Recettes ivoiriennes en démo' },
            { value: '35', label: 'Ingrédients du marché local' },
            { value: '3', label: 'Rôles : admin, gestionnaire, chef' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-black text-brand-600">{s.value}</p>
              <p className="mt-1 text-sm text-stone-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Fonctionnalités */}
      <section id="fonctionnalites" className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-widest text-brand-600">Fonctionnalités</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-ink sm:text-4xl">Tout ce qu’il faut pour piloter votre cuisine</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card group p-6 transition hover:-translate-y-0.5 hover:shadow-pop">
              <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="text-base font-bold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-500">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Méthode / calculs */}
      <section id="methode" className="bg-ink py-20 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-400">Règles de calcul</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Des formules simples, appliquées à chaque assiette</h2>
            <p className="mt-4 text-stone-400">
              COSTERA applique automatiquement les règles métier du food cost à chaque fiche technique. Vous fixez l’objectif,
              la plateforme calcule le reste.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FORMULAS.map((f) => (
              <div key={f.name} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <f.icon className="mb-3 h-5 w-5 text-brand-400" />
                <p className="text-sm font-bold">{f.name}</p>
                <p className="mt-2 font-mono text-xs leading-relaxed text-stone-300">{f.formula}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { step: '1', title: 'Référencez vos ingrédients', text: 'Nom, unité d’achat, prix du marché, fournisseur et taux de perte.' },
              { step: '2', title: 'Structurez vos fiches techniques', text: 'Quantités, progression et rendement : le coût matière se calcule en direct.' },
              { step: '3', title: 'Décidez avec vos chiffres', text: 'Prix conseillé, marge, coefficient et alertes de dépassement d’objectif.' },
            ].map((s) => (
              <div key={s.step} className="flex gap-4 rounded-2xl bg-white/5 p-5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-black">{s.step}</span>
                <div>
                  <p className="font-bold">{s.title}</p>
                  <p className="mt-1 text-sm text-stone-400">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cuisine ivoirienne */}
      <section id="cuisine" className="mx-auto max-w-6xl px-4 py-20">
        <div className="card overflow-hidden md:grid md:grid-cols-2">
          <div className="bg-gradient-to-br from-brand-600 to-brand-700 p-8 text-white sm:p-10">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-100">Cuisine ivoirienne</p>
            <h2 className="mt-2 text-2xl font-black leading-snug sm:text-3xl">Du garba au kedjenou, vos classiques méritent des chiffres précis.</h2>
            <p className="mt-4 text-sm leading-relaxed text-brand-100">
              La démo COSTERA est livrée avec les grands classiques d’Abidjan : attiéké-poisson, alloco, foutou banane sauce
              graine, sauce claire, placali, riz sauce arachide, poulet braisé, dèguè et jus de bissap. Chaque fiche est déjà
              chiffrée en francs CFA, avec les unités du marché.
            </p>
            <Link href="/login" className="btn mt-6 inline-flex bg-white text-brand-700 hover:bg-brand-50">
              Explorer la démo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-px bg-stone-100">
            {[
              { name: 'Garba', note: 'Attiéké & thon frit' },
              { name: 'Kedjenou', note: 'Cuisson à l’étouffée' },
              { name: 'Sauce graine', note: 'Foutou banane' },
              { name: 'Alloco', note: 'Plantain frit' },
              { name: 'Placali', note: 'Sauce gombo' },
              { name: 'Jus de bissap', note: 'Hibiscus glacé' },
            ].map((d) => (
              <div key={d.name} className="bg-white p-5">
                <p className="font-bold text-ink">{d.name}</p>
                <p className="text-xs text-stone-400">{d.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="card flex flex-col items-center gap-6 bg-forest-950 p-10 text-center text-white sm:p-14">
          <ClipboardList className="h-10 w-10 text-brand-400" />
          <h2 className="max-w-xl text-3xl font-black tracking-tight sm:text-4xl">Chaque ingrédient a un prix. Chaque recette a un coût. Chaque menu a une rentabilité.</h2>
          <Link href="/login" className="btn-primary px-8 py-3 text-base">
            Commencer maintenant
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Pied de page */}
      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-stone-500 sm:flex-row">
          <Logo small />
          <p>
            © 2026 COSTERA — Édité par <span className="font-semibold text-ink">VOOMNET FORMATION</span>. Version fonctionnelle V1.
          </p>
          <p className="text-xs">Marché cible : Côte d’Ivoire · Devise : FCFA (XOF)</p>
        </div>
      </footer>
    </main>
  );
}
