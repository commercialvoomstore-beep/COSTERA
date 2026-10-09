import type { Config } from 'tailwindcss';

// IDENTITÉ VISUELLE OFFICIELLE COSTERA
// Violet royal · Or royal · Blanc ivoire · Orange gastronomique en accent secondaire
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Violet royal — couleur identitaire principale
        royal: {
          50: '#f6f2fb',
          100: '#ede4f7',
          200: '#d9c8ee',
          300: '#bb9ce0',
          400: '#9d6fd0',
          500: '#8347bd',
          600: '#6B3BB5',
          700: '#54258A',
          800: '#452070',
          900: '#391c5b',
          950: '#221038',
        },
        // Or royal — excellence et finitions
        gold: {
          50: '#fbf7ec',
          100: '#f5ecd7',
          200: '#ead6a8',
          300: '#E4CB91',
          400: '#d7b671',
          500: '#C8A45D',
          600: '#b08a43',
          700: '#927038',
          800: '#775a30',
          900: '#614a2a',
          950: '#382a17',
        },
        // Orange gastronomique — accent secondaire uniquement
        gastro: {
          50: '#fbf3ec',
          100: '#f6e3d3',
          200: '#ecc5a5',
          300: '#e2a677',
          400: '#D98245',
          500: '#c96f33',
          600: '#b05a28',
          700: '#924822',
          800: '#763b20',
          900: '#60321d',
        },
        // Blanc ivoire — fonds de lecture
        ivory: {
          DEFAULT: '#FAF8F3',
          50: '#FAF8F3',
          100: '#F4F0E8',
          200: '#EAE4D8',
        },
        // Gris de séparation
        linec: '#EAE6EF',
        // Gris de texte
        body: '#34313B',
        // Aliases hérités du projet existant (mêmes noms, nouvelle identité)
        brand: {
          50: '#f6f2fb',
          100: '#ede4f7',
          200: '#d9c8ee',
          300: '#bb9ce0',
          400: '#9d6fd0',
          500: '#8347bd',
          600: '#6B3BB5',
          700: '#54258A',
          800: '#452070',
          900: '#391c5b',
          950: '#221038',
        },
        sand: {
          50: '#FAF8F3',
          100: '#F4F0E8',
          200: '#EAE6EF',
          300: '#DCD3E6',
          400: '#B9A8CF',
        },
        ink: '#34313B',
        // Sémantique (succès / alerte / erreur) conservée
        forest: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#0b3a1f',
        },
      },
      fontFamily: {
        display: ['Georgia', 'Times New Roman', 'Times', 'serif'],
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(52 49 59 / 0.04), 0 2px 6px -1px rgb(52 49 59 / 0.07)',
        pop: '0 14px 34px -10px rgb(34 16 56 / 0.22)',
        gold: '0 10px 28px -10px rgb(200 164 93 / 0.45)',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
