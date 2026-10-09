import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Orange COSTERA (clin d'œil à l'ivoirien)
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        // Vert profond
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
        // Fonds chauds
        sand: {
          50: '#fbf9f4',
          100: '#f6f1e7',
          200: '#eae2d2',
          300: '#d8ccb4',
          400: '#bfae8e',
        },
        ink: '#0e1512',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(16 24 19 / 0.05), 0 1px 3px 0 rgb(16 24 19 / 0.08)',
        pop: '0 12px 32px -8px rgb(14 21 18 / 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
