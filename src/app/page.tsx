import { existsSync } from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  ChefHat,
  Crown,
  Gem,
  GraduationCap,
  LineChart,
  Percent,
  Scale,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import { HeroMedia } from '@/components/hero-media';
import { FeaturesGrid } from '@/components/features/FeaturesGrid';
import { Logo } from '@/components/logo';
import { HERO_IMAGE } from '@/lib/dish-images';

const FORMULAS = [
  { icon: Scale, name: 'Coût matière', formula: 'Σ (Quantité × Prix unitaire) × (1 + perte)' },
  { icon: Percent, name: 'Food cost %', formula: 'Coût matière ÷ Prix de vente' },
  { icon: Sparkles, name: 'Prix conseillé', formula: 'Coût matière ÷ Objectif food cost' },
  { icon: LineChart, name: 'Coefficient', formula: 'Prix de vente ÷ Coût matière' },
];

const OFFERS = [
  {
    id: 'free',
    name: 'Free',
    price: '0 F CFA',
    period: 'pour toujours',
    icon: Sparkles,
    highlight: false,
    features: ['1 utilisateur', '3 menus privés', '10 fiches techniques', 'Calcul du food cost', 'Devise FCFA'],
    cta: 'Commencer gratuitement',
  },
  {
    id: 'silver',
    name: 'Silver',
    price: '15 000 F CFA',
    period: 'par mois',
    icon: Gem,
    highlight: true,
    features: ['3 utilisateurs', '25 menus privés', 'Fiches techniques illimitées', 'Historique des prix', 'Vitrine publique des menus', 'Impression des fiches'],
    cta: 'Choisir Silver',
  },
  {
    id: 'gold',
    name: 'Gold',
    price: '40 000 F CFA',
    period: 'par mois',
    icon: Crown,
    highlight: false,
    gold: true,
    features: ['Utilisateurs illimités', 'Menus illimités', 'Multi-établissements', 'Exports & rapports', 'Accompagnement prioritaire', 'Badge établissement Gold'],
    cta: 'Choisir Gold',
  },
];

export const metadata: Metadata = {
  title: {
    default: 'COSTERA — Food cost, coût matière & recettes',
    template: '%s · COSTERA',
  },
  description:
    'COSTERA est une plateforme SaaS destinée aux chefs, restaurants, hôtels et traiteurs : maîtrisez le coût matière, structurez vos fiches techniques, suivez les prix des ingrédients et construisez des menus rentables. Devise : FCFA (XOF).',
};

export default function LandingPage() {
  // Slot vidéo remplaçable : déposez public/video/hero.mp4 ou définissez NEXT_PUBLIC_HERO_VIDEO.
  const envVideo = process.env.NEXT_PUBLIC_HERO_VIDEO ?? null;
  const localVideo = existsSync(path.join(process.cwd(), 'public', 'video', 'hero.mp4')) ? '/video/hero.mp4' : null;
  const videoUrl = envVideo ?? localVideo;

  return (
    <main className="min-h-screen bg-ivory">
      {/* Barre de navigation */}
      <header className="sticky top-0 z-40 border-b border-linec bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" aria-label="COSTERA — accueil">
            <Logo size={46} />
          </Link>
          <nav className="hidden items-center gap-7 md:flex" aria-label="Navigation principale">
            <a href="#fonctionnalites" className="nav-link">Fonctionnalités</a>
            <a href="#methode" className="nav-link">Méthode</a>
            <a href="#offres" className="nav-link">Offres</a>
            <Link href="/decouvrir" className="nav-link font-semibold text-royal-700">Découvrir les menus</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost hidden sm:inline-flex">Se connecter</Link>
            <Link href="/decouvrir" className="btn-primary">Découvrir les menus</Link>
          </div>
        </div>
      </header>

      {/* Hero — slot vidéo d'arrière-plan remplaçable */}
      <section className="relative overflow-hidden">
        <HeroMedia videoUrl={videoUrl} poster={HERO_IMAGE} />
        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-20 sm:px-6 sm:pt-28">
          <div className="max-w-2xl">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-white/80 px-4 py-1.5 text-xs font-bold tracking-wide text-royal-800 shadow-sm backdrop-blur">
              <ChefHat className="h-3.5 w-3.5 text-gold-600" />
              V1 — Septembre 2026 · Côte d’Ivoire · Devise FCFA (XOF)
            </p>
            <h1 className="font-display text-4xl font-bold leading-[1.12] tracking-tight text-royal-900 sm:text-6xl">
              Votre savoir-faire mérite{' '}
              <span className="relative whitespace-nowrap text-royal-700">
                une gestion
                <span className="absolute -bottom-1 left-0 h-[3px] w-full rounded bg-gradient-to-r from-gold-500 to-gold-300" />
              </span>{' '}
              à sa hauteur.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-body/70">
              COSTERA est la plateforme SaaS des chefs, restaurants, hôtels et traiteurs : maîtrisez le coût matière,
              structurez vos fiches techniques, suivez les prix des ingrédients et construisez des menus rentables —
              avec une attention particulière portée à la cuisine ivoirienne.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/decouvrir" className="btn-primary px-7 py-3 text-base">
                Découvrir les menus
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="btn-ghost bg-white/85 px-7 py-3 text-base backdrop-blur">
                Accéder à la plateforme
              </Link>
            </div>
            <p className="mt-7 text-sm text-body/55">
              Chaque ingrédient a un prix, chaque recette a un coût, chaque menu a une rentabilité.
            </p>
          </div>
        </div>
      </section>

      {/* Bandeau chiffres */}
      <section className="border-y border-linec bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-9 sm:px-6 md:grid-cols-4">
          {[
            { value: 'FCFA', label: 'Devise native (XOF)' },
            { value: '13', label: 'Recettes ivoiriennes en démo' },
            { value: '35', label: 'Ingrédients du marché local' },
            { value: '3', label: 'Rôles : admin, gestionnaire, chef' },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-display text-3xl font-bold text-royal-700">{s.value}</p>
              <p className="mt-1 text-sm text-body/55">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Fonctionnalités */}
      <section id="fonctionnalites" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="mb-12 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-600">Fonctionnalités</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-royal-900 sm:text-4xl">
            Tout ce qu’il faut pour piloter votre cuisine
          </h2>
        </div>
        <FeaturesGrid />
      </section>

      {/* À propos : mission, à qui s'adresse COSTERA, les 14 modules */}
      <section id="a-propos" className="border-y border-linec bg-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-600">À propos</p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-snug tracking-tight text-royal-900 sm:text-4xl">
              L'application de gestion née pour la restauration ivoirienne
            </h2>
            <p className="mt-6 leading-relaxed text-body/70">
              COSTERA — <em>Côte d'Ivoire Restauration</em> — est née d'un constat simple : les cuisines
              d'Abidjan, des maquis aux palaces, regorgent de talent… mais pilotent trop souvent leurs coûts
              à l'instinct. Notre mission : donner à chaque équipe, de la street food aux hôtels 5 étoiles,
              les mêmes outils de gestion qu'une grande brigade — <strong className="font-semibold text-royal-800">fiches techniques, food cost,
              rendements, marges, inventaires</strong> — calculés en temps réel, en francs CFA, sans tableur ni formation d'ingénieur.
            </p>
            <p className="mt-4 leading-relaxed text-body/70">
              Conçue à Abidjan, pensée pour les produits de nos marchés, COSTERA est aussi un outil
              d'enseignement : chaque formule est expliquée, pour que les écoles hôtelières forment les
              gestionnaires de demain.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/login" className="auth-btn-violet">Créer mon compte gratuit</a>
              <a href="/decouvrir" className="auth-btn-gold">Découvrir les menus</a>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] shadow-pop">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/hero-3-800.jpg"
              alt="Chef ivoirien dressant un plat gastronomique en cuisine"
              loading="lazy"
              className="aspect-[4/5] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-royal-950/60 via-transparent to-transparent" />
            <p className="absolute bottom-5 left-6 right-6 text-sm font-medium text-ivory/95">
              « Du marché d'Adjamé à l'assiette, chaque franc compte. »
            </p>
          </div>
        </div>

        {/* À qui s'adresse COSTERA ? */}
        <div className="border-t border-linec bg-gradient-to-br from-royal-50 via-ivory to-gold-50/60">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h3 className="font-display text-center text-2xl font-bold text-royal-900">À qui s'adresse COSTERA ?</h3>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { t: 'Restaurants & maquis', d: 'Fiches techniques et marges plat par plat.', Icon: UtensilsCrossed },
                { t: 'Hôtels & resorts', d: 'Room service, banquets et petits-déjeuners sous contrôle.', Icon: Building2 },
                { t: 'Traiteurs & événementiel', d: 'Devis précis et coûts de revient par prestation.', Icon: CalendarCheck },
                { t: 'Écoles hôtelières', d: 'Mode pédagogique avec formules expliquées pas à pas.', Icon: GraduationCap },
              ].map(({ t, d, Icon }) => (
                <div key={t} className="card group p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-gold-300 hover:shadow-pop">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-royal-50 text-royal-700 ring-1 ring-inset ring-royal-600/15 transition-colors duration-300 group-hover:bg-royal-700 group-hover:text-gold-300">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h4 className="mt-4 font-display text-base font-bold text-royal-900">{t}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-body/60">{d}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-body/60">
              Et pour tous les profils : chefs et cheffes de cuisine, gérants, contrôleurs de gestion F&amp;B, barmans,
              pâtissiers et étudiants en hôtellerie-restauration.
            </p>
          </div>
        </div>

        {/* Les 14 modules */}
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h3 className="font-display text-center text-xl font-bold text-royal-900">
            14 modules pour maîtriser vos coûts de A à Z
          </h3>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            {[
              'Fiches techniques', 'Calcul des coûts', 'Rendement & pertes', 'Food cost', 'Prix de vente',
              'Marge & rentabilité', 'Coût de revient', 'Gestion des pertes', 'Fiches nutritionnelles',
              'Allergènes', 'Ingénierie de menu', 'Achats & fournisseurs', 'Inventaire & consommation',
              'Rapports & PDF',
            ].map((m) => (
              <span key={m} className="rounded-full border border-gold-300/70 bg-gold-50/70 px-4 py-1.5 text-[13px] font-semibold text-gold-800">
                {m}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Méthode / calculs */}
      <section id="methode" className="relative overflow-hidden bg-royal-950 py-24 text-white">
        <div className="pointer-events-none absolute -right-40 top-0 h-96 w-96 rounded-full bg-royal-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-400">Règles de calcul</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Des formules simples, appliquées à chaque assiette
            </h2>
            <p className="mt-4 text-royal-100/80">
              COSTERA applique automatiquement les règles métier du food cost à chaque fiche technique.
              Vous fixez l’objectif, la plateforme calcule le reste.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FORMULAS.map((f) => (
              <div key={f.name} className="rounded-2xl border border-white/10 bg-white/5 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-gold-500/40 hover:bg-white/10">
                <f.icon className="mb-4 h-5 w-5 text-gold-400" />
                <p className="font-display text-base font-bold">{f.name}</p>
                <p className="mt-2 font-mono text-xs leading-relaxed text-royal-100/70">{f.formula}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {[
              { step: '1', title: 'Référencez vos ingrédients', text: 'Nom, unité d’achat, prix du marché, fournisseur et taux de perte.' },
              { step: '2', title: 'Structurez vos fiches techniques', text: 'Quantités, progression et rendement : le coût matière se calcule en direct.' },
              { step: '3', title: 'Décidez avec vos chiffres', text: 'Prix conseillé, marge, coefficient et alertes de dépassement d’objectif.' },
            ].map((s) => (
              <div key={s.step} className="flex gap-4 rounded-2xl bg-white/5 p-6">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-b from-gold-300 to-gold-500 font-display text-sm font-bold text-royal-950">
                  {s.step}
                </span>
                <div>
                  <p className="font-display font-bold">{s.title}</p>
                  <p className="mt-1.5 text-sm text-royal-100/70">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cuisine ivoirienne */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-600">Cuisine ivoirienne</p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-snug tracking-tight text-royal-900 sm:text-4xl">
              Du garba au kedjenou, vos classiques méritent des chiffres précis.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-body/65">
              La démo COSTERA est livrée avec les grands classiques d’Abidjan : attiéké-poisson, alloco, foutou banane
              sauce graine, sauce claire, placali, riz sauce arachide, poulet braisé, dèguè et jus de bissap. Chaque
              fiche est déjà chiffrée en francs CFA, avec les unités du marché.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/decouvrir" className="btn-primary">
                Découvrir les menus
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="btn-ghost">Explorer la démo</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { img: '/dishes/garba.jpg', name: 'Garba', note: 'Attiéké & thon frit' },
              { img: '/dishes/kedjenou.jpg', name: 'Kedjenou', note: 'Cuisson à l’étouffée' },
              { img: '/dishes/sauce-graine.jpg', name: 'Sauce graine', note: 'Foutou banane' },
              { img: '/dishes/bissap.jpg', name: 'Jus de bissap', note: 'Hibiscus glacé' },
            ].map((d, i) => (
              <figure key={d.name} className={`card card-hover img-zoom overflow-hidden ${i % 2 === 1 ? 'translate-y-5' : ''}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.img} alt={d.name} loading="lazy" className="aspect-square h-auto w-full object-cover" />
                <figcaption className="p-4">
                  <p className="font-display text-sm font-bold text-body">{d.name}</p>
                  <p className="text-xs text-body/50">{d.note}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Offres Free / Silver / Gold */}
      <section id="offres" className="border-t border-linec bg-white py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-600">Abonnements</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-royal-900 sm:text-4xl">
              Une offre pour chaque maison
            </h2>
            <p className="mt-4 text-body/60">
              Free pour découvrir, Silver pour développer, Gold pour rayonner.
              <span className="ml-1 text-xs text-body/45">V1 démo : présentation des offres, facturation activée à la mise en production.</span>
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {OFFERS.map((o) => (
              <div
                key={o.id}
                className={`card card-hover relative flex flex-col p-8 ${
                  o.highlight ? 'border-royal-600 shadow-pop ring-1 ring-royal-600/30' : o.gold ? 'border-gold-500/60' : ''
                }`}
              >
                {o.highlight ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-royal-700 px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm">
                    Le plus choisi
                  </span>
                ) : null}
                <div className="mb-5 flex items-center gap-3">
                  <span className={`grid h-11 w-11 place-items-center rounded-xl ${o.gold ? 'bg-gradient-to-b from-gold-200 to-gold-400 text-royal-900' : o.highlight ? 'bg-royal-700 text-gold-300' : 'bg-royal-50 text-royal-700'}`}>
                    <o.icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-display text-xl font-bold text-body">{o.name}</h3>
                </div>
                <p className="font-display text-3xl font-bold text-royal-800">{o.price}</p>
                <p className="mb-6 mt-1 text-xs uppercase tracking-wide text-body/45">{o.period}</p>
                <ul className="mb-8 space-y-2.5">
                  {o.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-body/70">
                      <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${o.gold ? 'bg-gold-500' : 'bg-royal-500'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login" className={`${o.highlight ? 'btn-primary' : o.gold ? 'btn-gold' : 'btn-ghost'} mt-auto w-full`}>
                  {o.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-royal-800 via-royal-900 to-royal-950 p-12 text-center text-white sm:p-16">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-gold-500/15 blur-3xl" />
          <div className="relative mx-auto mb-8 w-fit">
            <Logo size={110} />
          </div>
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Chaque ingrédient a un prix. Chaque recette a un coût. Chaque menu a une rentabilité.
          </h2>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/login" className="btn-gold px-8 py-3 text-base">Commencer maintenant</Link>
            <Link href="/decouvrir" className="btn-on-dark px-8 py-3 text-base">Découvrir les menus</Link>
          </div>
        </div>
      </section>

      {/* Pied de page */}
      <footer className="border-t border-linec bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-4 py-10 text-sm text-body/55 sm:flex-row sm:px-6">
          <Logo size={40} />
          <p className="text-center">
            © 2026 COSTERA — Édité par <span className="font-semibold text-body">VOOMNET FORMATION</span> · Version fonctionnelle V1
          </p>
          <p className="text-xs">Côte d’Ivoire · FCFA (XOF)</p>
        </div>
      </footer>
    </main>
  );
}
