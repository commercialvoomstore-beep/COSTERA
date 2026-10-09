import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { officialLogoDisplaySrc } from '@/components/logo';
import { SplashScreen } from '@/components/splash-screen';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'COSTERA — Food cost, coût matière & recettes',
    template: '%s · COSTERA',
  },
  description:
    'COSTERA est une plateforme SaaS destinée aux chefs, restaurants, hôtels et traiteurs : maîtrisez le coût matière, structurez vos fiches techniques, suivez les prix des ingrédients et construisez des menus rentables. Devise : FCFA (XOF).',
  keywords: ['food cost', 'coût matière', 'fiche technique', 'recette', 'restaurant', 'Côte d’Ivoire', 'FCFA', 'gestion cuisine'],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link
          rel="icon"
          type={officialLogoDisplaySrc().endsWith('.svg') ? 'image/svg+xml' : 'image/png'}
          href={officialLogoDisplaySrc()}
        />
      </head>
      <body>
        <SplashScreen logoSrc={officialLogoDisplaySrc()} />
        {children}
      </body>
    </html>
  );
}
