// COSTERA — Données de démonstration (cahier des charges, section 11)
// Cuisine ivoirienne, prix en FCFA, dates relatives au premier lancement.
import { hashPassword } from '@/lib/auth';
import { daysAgoISO } from '@/lib/format';
import type { Ingredient, Menu, Recipe, Settings, User } from '@/lib/types';

type Hist = [factor: number, daysAgo: number, note?: string][];

function ingredient(opts: {
  id: string;
  name: string;
  category: Ingredient['category'];
  unitId: string;
  price: number;
  lossPct?: number;
  supplier?: string;
  hist?: Hist;
}): Ingredient {
  const { id, name, category, unitId, price, lossPct = 0, supplier, hist } = opts;
  const entries: Hist = hist ?? ([[1, 5]] as Hist);
  const history = entries.map(([factor, days, note]) => ({
    price: Math.round(price * factor),
    date: daysAgoISO(days),
    ...(note ? { note } : {}),
  }));
  return {
    id,
    name,
    category,
    unitId,
    price,
    supplier,
    lossPct,
    history,
    createdAt: daysAgoISO(60),
    updatedAt: history[history.length - 1]?.date ?? daysAgoISO(5),
  };
}

function line(ingredientId: string, qty: number, unitId: string, note?: string) {
  return { id: `${ingredientId}-${Math.abs(Math.random() * 1e9).toFixed(0)}`, ingredientId, qty, unitId, ...(note ? { note } : {}) };
}

function recipe(opts: {
  id: string;
  name: string;
  category: Recipe['category'];
  portions: number;
  salePrice: number;
  status?: Recipe['status'];
  lines: Recipe['lines'];
  steps: string[];
  notes?: string;
}): Recipe {
  const { id, name, category, portions, salePrice, status = 'active', lines: linesData, steps, notes } = opts;
  return {
    id,
    name,
    category,
    portions,
    salePrice,
    status,
    lines: linesData,
    steps,
    ...(notes ? { notes } : {}),
    createdAt: daysAgoISO(45),
    updatedAt: daysAgoISO(3),
  };
}

export function buildSeed(): { users: User[]; ingredients: Ingredient[]; recipes: Recipe[]; menus: Menu[]; settings: Settings } {
  const password = hashPassword('COSTERA2026');

  const users: User[] = [
    { id: 'usr-awa', name: 'Awa Koné', email: 'admin@costera.ci', role: 'admin', passwordHash: password, createdAt: daysAgoISO(90) },
    { id: 'usr-yao', name: 'Yao Kouassi', email: 'chef@costera.ci', role: 'chef', passwordHash: password, createdAt: daysAgoISO(80) },
    { id: 'usr-mariam', name: 'Mariam Traoré', email: 'gestion@costera.ci', role: 'gestionnaire', passwordHash: password, createdAt: daysAgoISO(70) },
  ];

  const ingredients: Ingredient[] = [
    ingredient({ id: 'ing-attieke', name: 'Attiéké', category: 'Féculents & céréales', unitId: 'kg', price: 1000, supplier: 'Marché d’Adjamé', hist: [[0.9, 42], [0.95, 21, 'Légère hausse saisonnière'], [1, 5]] }),
    ingredient({ id: 'ing-riz', name: 'Riz parfumé', category: 'Féculents & céréales', unitId: 'kg', price: 1250, supplier: 'Grossiste Treichville', hist: [[0.96, 40], [0.98, 18], [1, 8]] }),
    ingredient({ id: 'ing-igname', name: 'Igname florido', category: 'Légumes & tubercules', unitId: 'kg', price: 800, lossPct: 15, hist: [[1.1, 38], [1.05, 16], [1, 6]] }),
    ingredient({ id: 'ing-plantain', name: 'Plantain', category: 'Légumes & tubercules', unitId: 'kg', price: 900, lossPct: 20, supplier: 'Marché de Gouro', hist: [[0.85, 44], [0.92, 20], [1, 4, 'Fin de récolte']] }),
    ingredient({ id: 'ing-manioc', name: 'Manioc (placali)', category: 'Féculents & céréales', unitId: 'kg', price: 600, lossPct: 10, hist: [[0.95, 35], [1, 9]] }),
    ingredient({ id: 'ing-millet', name: 'Mil en grains', category: 'Féculents & céréales', unitId: 'kg', price: 900, hist: [[1, 25]] }),
    ingredient({ id: 'ing-gari', name: 'Gari (semoule de manioc)', category: 'Féculents & céréales', unitId: 'kg', price: 1200, hist: [[0.97, 30], [1, 10]] }),
    ingredient({ id: 'ing-poulet', name: 'Poulet entier', category: 'Viandes & volailles', unitId: 'kg', price: 3500, lossPct: 8, supplier: 'Ferme de Bingerville', hist: [[0.94, 41], [0.97, 19], [1, 3, 'Hausse aliments volaille']] }),
    ingredient({ id: 'ing-boeuf', name: 'Bœuf à braiser', category: 'Viandes & volailles', unitId: 'kg', price: 4000, lossPct: 5, hist: [[0.98, 33], [1, 12]] }),
    ingredient({ id: 'ing-carpe', name: 'Carpe fraîche', category: 'Poissons & fruits de mer', unitId: 'kg', price: 2500, lossPct: 15, supplier: 'Pêche de Grand-Lahou', hist: [[1.08, 36], [1.02, 15], [1, 2]] }),
    ingredient({ id: 'ing-poisson-fume', name: 'Poisson fumé (mâchoiron)', category: 'Poissons & fruits de mer', unitId: 'kg', price: 4500, lossPct: 5, hist: [[0.93, 39], [0.96, 17], [1, 6]] }),
    ingredient({ id: 'ing-thon', name: 'Thon frais', category: 'Poissons & fruits de mer', unitId: 'kg', price: 3000, lossPct: 10, supplier: 'Port d’Abidjan', hist: [[1.05, 30], [1, 7]] }),
    ingredient({ id: 'ing-crevettes', name: 'Crevettes séchées', category: 'Poissons & fruits de mer', unitId: 'kg', price: 6000, hist: [[1, 28]] }),
    ingredient({ id: 'ing-oeufs', name: 'Œufs de poule', category: 'Œufs & produits laitiers', unitId: 'piece', price: 150, hist: [[1.07, 32], [1.03, 14], [1, 5]] }),
    ingredient({ id: 'ing-lait-concentre', name: 'Lait concentré sucré (397 g)', category: 'Œufs & produits laitiers', unitId: 'boite', price: 900, hist: [[1, 22]] }),
    ingredient({ id: 'ing-yaourt', name: 'Yaourt nature', category: 'Œufs & produits laitiers', unitId: 'l', price: 1500, hist: [[1, 19]] }),
    ingredient({ id: 'ing-tomate', name: 'Tomates fraîches', category: 'Légumes & tubercules', unitId: 'kg', price: 1200, lossPct: 8, hist: [[1.35, 40, 'Saison des pluies'], [1.15, 18], [1, 4, 'Baisse après récolte']] }),
    ingredient({ id: 'ing-tomate-concentree', name: 'Concentré de tomate (400 g)', category: 'Épices & condiments', unitId: 'boite', price: 700, hist: [[1, 26]] }),
    ingredient({ id: 'ing-oignon', name: 'Oignons', category: 'Légumes & tubercules', unitId: 'kg', price: 1100, lossPct: 5, hist: [[1.1, 37], [1.04, 16], [1, 5]] }),
    ingredient({ id: 'ing-cive', name: 'Cive / oignon vert', category: 'Légumes & tubercules', unitId: 'botte', price: 500, lossPct: 5, hist: [[0.9, 29], [1, 8]] }),
    ingredient({ id: 'ing-ail', name: 'Ail', category: 'Épices & condiments', unitId: 'kg', price: 3000, lossPct: 10, hist: [[1, 24]] }),
    ingredient({ id: 'ing-gingembre', name: 'Gingembre frais', category: 'Épices & condiments', unitId: 'kg', price: 2500, lossPct: 10, hist: [[0.96, 27], [1, 11]] }),
    ingredient({ id: 'ing-piment', name: 'Piment frais', category: 'Épices & condiments', unitId: 'kg', price: 2000, lossPct: 5, hist: [[0.85, 34], [0.9, 13], [1, 3, 'Forte demande']] }),
    ingredient({ id: 'ing-aubergine', name: 'Aubergines africaines', category: 'Légumes & tubercules', unitId: 'kg', price: 1000, lossPct: 5, hist: [[1, 21]] }),
    ingredient({ id: 'ing-gombo', name: 'Gombo', category: 'Légumes & tubercules', unitId: 'kg', price: 1500, lossPct: 5, hist: [[1.06, 31], [1, 9]] }),
    ingredient({ id: 'ing-avocat', name: 'Avocat', category: 'Fruits', unitId: 'kg', price: 2000, lossPct: 25, hist: [[1.12, 36], [1, 7]] }),
    ingredient({ id: 'ing-citron', name: 'Citron', category: 'Fruits', unitId: 'kg', price: 1500, lossPct: 5, hist: [[1, 18]] }),
    ingredient({ id: 'ing-palme', name: 'Pulpe de noix de palme', category: 'Huiles & matières grasses', unitId: 'kg', price: 1600, hist: [[0.94, 43], [1, 6]] }),
    ingredient({ id: 'ing-huile-rouge', name: 'Huile rouge (palme)', category: 'Huiles & matières grasses', unitId: 'l', price: 2200, hist: [[0.97, 32], [1, 10]] }),
    ingredient({ id: 'ing-huile', name: 'Huile végétale', category: 'Huiles & matières grasses', unitId: 'l', price: 1900, hist: [[1.04, 38], [1.02, 17], [1, 4]] }),
    ingredient({ id: 'ing-arachide', name: "Pâte d'arachide", category: 'Autres', unitId: 'kg', price: 2800, hist: [[0.98, 23], [1, 12]] }),
    ingredient({ id: 'ing-cube', name: 'Cube culinaire', category: 'Épices & condiments', unitId: 'cube', price: 50, hist: [[1, 50]] }),
    ingredient({ id: 'ing-sel', name: 'Sel fin', category: 'Épices & condiments', unitId: 'kg', price: 500, hist: [[1, 50]] }),
    ingredient({ id: 'ing-sucre', name: 'Sucre en poudre', category: 'Autres', unitId: 'kg', price: 1000, hist: [[1, 50]] }),
    ingredient({ id: 'ing-bissap', name: 'Fleurs d’hibiscus séchées (bissap)', category: 'Boissons', unitId: 'kg', price: 3500, supplier: 'Coopérative de Bouaké', hist: [[1, 47]] }),
  ];

  const recipes: Recipe[] = [
    recipe({
      id: 'rec-salade-avocat', name: 'Salade d’avocat', category: 'Entrées', portions: 2, salePrice: 1500,
      lines: [
        line('ing-avocat', 0.3, 'kg'), line('ing-tomate', 0.15, 'kg'), line('ing-oignon', 0.06, 'kg'),
        line('ing-citron', 0.2, 'kg'), line('ing-huile', 0.03, 'l'), line('ing-sel', 0.004, 'kg'), line('ing-piment', 0.01, 'kg', 'Facultatif'),
      ],
      steps: [
        'Tailler l’avocat et les tomates en dés réguliers.',
        'Émincer finement l’oignon et le faire dégorger au sel.',
        'Assaisonner avec le jus de citron, l’huile et une pointe de piment.',
        'Dresser en dôme et servir bien frais.',
      ],
    }),
    recipe({
      id: 'rec-garba', name: 'Garba', category: 'Plats', portions: 1, salePrice: 1500,
      lines: [
        line('ing-attieke', 0.3, 'kg'), line('ing-thon', 0.12, 'kg'), line('ing-huile', 0.04, 'l', 'Friture'),
        line('ing-cive', 0.4, 'botte'), line('ing-piment', 0.015, 'kg'), line('ing-cube', 1, 'cube'), line('ing-sel', 0.003, 'kg'),
      ],
      steps: [
        'Découper le thon en gros dés et le frire dans l’huile bien chaude.',
        'Réchauffer l’attiéké à la vapeur quelques minutes.',
        'Émincer la cive et le piment frais.',
        'Dresser l’attiéké, poser le thon frit, parsemer de cive et de piment.',
      ],
      notes: 'Le plat de rue emblématique d’Abidjan.',
    }),
    recipe({
      id: 'rec-attieke-poisson', name: 'Attiéké-poisson braisé', category: 'Plats', portions: 1, salePrice: 4500,
      lines: [
        line('ing-attieke', 0.35, 'kg'), line('ing-carpe', 0.4, 'kg'), line('ing-tomate', 0.12, 'kg'),
        line('ing-oignon', 0.06, 'kg'), line('ing-cive', 0.2, 'botte'), line('ing-piment', 0.015, 'kg'),
        line('ing-huile', 0.03, 'l'), line('ing-cube', 1, 'cube'), line('ing-sel', 0.004, 'kg'),
        line('ing-ail', 0.01, 'kg'), line('ing-gingembre', 0.01, 'kg'),
      ],
      steps: [
        'Mariner la carpe avec ail, gingembre, cube et sel (30 min).',
        'Braise le poisson sur grille jusqu’à coloration dorée.',
        'Réaliser la sauce claire : tomates, oignons et piment mijotés.',
        'Servir avec l’attiéké, la cive émincée et la sauce.',
      ],
    }),
    recipe({
      id: 'rec-alloco', name: 'Alloco', category: 'Plats', portions: 1, salePrice: 2000,
      lines: [
        line('ing-plantain', 0.4, 'kg'), line('ing-huile', 0.1, 'l', 'Friture'), line('ing-tomate', 0.08, 'kg'),
        line('ing-oignon', 0.04, 'kg'), line('ing-piment', 0.01, 'kg'), line('ing-cube', 1, 'cube'),
      ],
      steps: [
        'Éplucher les plantains mûrs et les couper en biseaux.',
        'Frire dans l’huile chaude jusqu’à caramélisation.',
        'Préparer la sauce tomate-oignon-piment.',
        'Servir l’alloco accompagné de sa sauce.',
      ],
    }),
    recipe({
      id: 'rec-kedjenou', name: 'Kedjenou de poulet', category: 'Plats', portions: 4, salePrice: 3500,
      lines: [
        line('ing-poulet', 1.2, 'kg', 'Découpé en morceaux'), line('ing-tomate', 0.4, 'kg'), line('ing-oignon', 0.2, 'kg'),
        line('ing-aubergine', 0.3, 'kg'), line('ing-piment', 0.03, 'kg'), line('ing-gingembre', 0.03, 'kg'),
        line('ing-ail', 0.02, 'kg'), line('ing-huile-rouge', 0.05, 'l'), line('ing-cube', 2, 'cube'), line('ing-sel', 0.02, 'kg'),
      ],
      steps: [
        'Mariner le poulet avec ail, gingembre et épices.',
        'Alterner poulet et légumes dans le canari (ou cocotte).',
        'Luter le couvercle et cuire à l’étouffée 45 min sans eau.',
        'Secouer le canari à mi-cuisson et rectifier l’assaisonnement.',
        'Servir directement dans le canari, avec riz ou foutou.',
      ],
      notes: 'Cuisson traditionnelle à l’étouffée en canari.',
    }),
    recipe({
      id: 'rec-sauce-graine', name: 'Foutou banane sauce graine', category: 'Plats', portions: 4, salePrice: 3000,
      lines: [
        line('ing-plantain', 1.5, 'kg', 'Foutou'), line('ing-palme', 0.7, 'kg'), line('ing-poisson-fume', 0.2, 'kg'),
        line('ing-crevettes', 0.04, 'kg'), line('ing-tomate', 0.25, 'kg'), line('ing-oignon', 0.12, 'kg'),
        line('ing-piment', 0.03, 'kg'), line('ing-huile-rouge', 0.04, 'l'), line('ing-cube', 2, 'cube'), line('ing-sel', 0.02, 'kg'),
      ],
      steps: [
        'Cuire la pulpe de palme puis la mixer et la tamiser pour obtenir la graine.',
        'Faire revenir oignons et tomates, ajouter le poisson fumé.',
        'Verser la graine et laisser mijoter 30 min en remuant.',
        'Ajouter les crevettes séchées, le piment et rectifier.',
        'Piler les plantains cuits en foutou et servir chaud.',
      ],
    }),
    recipe({
      id: 'rec-sauce-claire', name: 'Sauce claire au poisson fumé (foutou igname)', category: 'Plats', portions: 4, salePrice: 2500,
      lines: [
        line('ing-igname', 1.6, 'kg', 'Foutou'), line('ing-poisson-fume', 0.3, 'kg'), line('ing-tomate', 0.35, 'kg'),
        line('ing-oignon', 0.15, 'kg'), line('ing-piment', 0.04, 'kg'), line('ing-huile-rouge', 0.04, 'l'),
        line('ing-cube', 2, 'cube'), line('ing-sel', 0.02, 'kg'), line('ing-ail', 0.02, 'kg'),
      ],
      steps: [
        'Mixer tomates, oignons, ail et piment pour la base de sauce.',
        'Faire mijoter la base avec un verre d’eau 15 min.',
        'Ajouter le poisson fumé et l’huile rouge, cuire 10 min.',
        'Piler l’igname cuite en foutou lisse.',
        'Servir la sauce claire bien chaude sur le foutou.',
      ],
    }),
    recipe({
      id: 'rec-tchep', name: 'Riz sauce arachide au poulet', category: 'Plats', portions: 4, salePrice: 3500,
      lines: [
        line('ing-riz', 0.8, 'kg'), line('ing-poulet', 0.7, 'kg'), line('ing-arachide', 0.3, 'kg'),
        line('ing-tomate-concentree', 0.5, 'boite'), line('ing-tomate', 0.2, 'kg'), line('ing-oignon', 0.15, 'kg'),
        line('ing-huile', 0.06, 'l'), line('ing-cube', 2, 'cube'), line('ing-sel', 0.02, 'kg'), line('ing-piment', 0.02, 'kg'),
      ],
      steps: [
        'Faire dorer le poulet assaisonné dans l’huile.',
        'Ajouter oignons, tomates et concentré, laisser réduire.',
        'Délayer la pâte d’arachide dans un peu de bouillon et verser.',
        'Mijoter 25 min jusqu’à sauce nappante.',
        'Servir sur riz blanc parfumé.',
      ],
    }),
    recipe({
      id: 'rec-poulet-braise', name: 'Poulet braisé attiéké', category: 'Plats', portions: 2, salePrice: 5000,
      lines: [
        line('ing-poulet', 0.9, 'kg'), line('ing-attieke', 0.5, 'kg'), line('ing-oignon', 0.1, 'kg'),
        line('ing-ail', 0.02, 'kg'), line('ing-gingembre', 0.02, 'kg'), line('ing-tomate', 0.15, 'kg'),
        line('ing-huile', 0.05, 'l'), line('ing-cube', 2, 'cube'), line('ing-sel', 0.02, 'kg'),
      ],
      steps: [
        'Mariner le poulet (oignon, ail, gingembre, cube) 2 h au frais.',
        'Braiser au charbon ou au four en retournant régulièrement.',
        'Laquer avec la marinade réduite en fin de cuisson.',
        'Servir avec attiéké, tomates fraîches et oignons.',
      ],
    }),
    recipe({
      id: 'rec-placali', name: 'Placali sauce gombo', category: 'Plats', portions: 4, salePrice: 2000,
      lines: [
        line('ing-manioc', 1.3, 'kg', 'Placali'), line('ing-gombo', 0.5, 'kg'), line('ing-poisson-fume', 0.15, 'kg'),
        line('ing-crevettes', 0.03, 'kg'), line('ing-tomate', 0.2, 'kg'), line('ing-oignon', 0.1, 'kg'),
        line('ing-huile-rouge', 0.05, 'l'), line('ing-piment', 0.03, 'kg'), line('ing-cube', 2, 'cube'), line('ing-sel', 0.02, 'kg'),
      ],
      steps: [
        'Préparer le placali à partir de la pâte de manioc fermentée.',
        'Faire revenir oignons, tomates et poisson fumé.',
        'Ajouter le gombo rondelles et cuire jusqu’à texture légèrement filante.',
        'Incorporer crevettes séchées, huile rouge et piment.',
        'Servir la sauce sur le placali.',
      ],
    }),
    recipe({
      id: 'rec-degue', name: 'Dèguè au yaourt', category: 'Desserts', portions: 6, salePrice: 1000,
      lines: [
        line('ing-millet', 0.3, 'kg'), line('ing-yaourt', 0.6, 'l'), line('ing-lait-concentre', 0.5, 'boite'), line('ing-sucre', 0.12, 'kg'),
      ],
      steps: [
        'Cuire le mil à la vapeur puis le refroidir.',
        'Mélanger yaourt, lait concentré et sucre.',
        'Incorporer le mil et réserver au frais 2 h.',
        'Servir bien froid en verrines.',
      ],
    }),
    recipe({
      id: 'rec-bissap', name: 'Jus de bissap glacé', category: 'Boissons', portions: 10, salePrice: 500,
      lines: [
        line('ing-bissap', 0.06, 'kg'), line('ing-sucre', 0.45, 'kg'), line('ing-gingembre', 0.05, 'kg'), line('ing-citron', 0.15, 'kg'),
      ],
      steps: [
        'Rincer les fleurs d’hibiscus et les cuire 15 min avec le gingembre.',
        'Filtrer, sucrer et ajouter le jus de citron.',
        'Refroidir rapidement et servir glacé.',
      ],
    }),
    recipe({
      id: 'rec-wassa-wassa', name: 'Wassa-wassa au poulet', category: 'Plats', portions: 4, salePrice: 2600, status: 'brouillon',
      lines: [
        line('ing-gari', 0.8, 'kg'), line('ing-poulet', 0.6, 'kg'), line('ing-tomate', 0.25, 'kg'),
        line('ing-oignon', 0.12, 'kg'), line('ing-huile', 0.06, 'l'), line('ing-cube', 2, 'cube'),
        line('ing-piment', 0.02, 'kg'), line('ing-sel', 0.02, 'kg'),
      ],
      steps: [
        'Hydrater et cuire le gari à la vapeur pour obtenir le wassa-wassa.',
        'Préparer une sauce tomate au poulet.',
        'Servir le wassa-wassa nappé de sauce.',
      ],
      notes: 'Fiche en cours de validation par le chef.',
    }),
  ];

  const menus: Menu[] = [
    {
      id: 'menu-dejeuner',
      name: 'Déjeuner du Maquis',
      description: 'Formule midi aux saveurs d’Abidjan.',
      published: true,
      sections: [
        { id: 'sec-entrees', title: 'Entrées', recipeIds: ['rec-salade-avocat'] },
        { id: 'sec-plats', title: 'Plats', recipeIds: ['rec-garba', 'rec-attieke-poisson', 'rec-kedjenou'] },
        { id: 'sec-desserts', title: 'Desserts', recipeIds: ['rec-degue'] },
        { id: 'sec-boissons', title: 'Boissons', recipeIds: ['rec-bissap'] },
      ],
      createdAt: daysAgoISO(20),
      updatedAt: daysAgoISO(2),
    },
    {
      id: 'menu-gala',
      name: 'Soirée Gastronomique Ivoirienne',
      description: 'Menu de réception mettant à l’honneur les grands classiques.',
      published: true,
      sections: [
        { id: 'sec-plats-gala', title: 'Plats', recipeIds: ['rec-sauce-graine', 'rec-tchep', 'rec-poulet-braise'] },
        { id: 'sec-desserts-gala', title: 'Desserts', recipeIds: ['rec-degue'] },
        { id: 'sec-boissons-gala', title: 'Boissons', recipeIds: ['rec-bissap'] },
      ],
      createdAt: daysAgoISO(12),
      updatedAt: daysAgoISO(1),
    },
  ];

  const settings: Settings = {
    orgName: 'VOOMNET FORMATION',
    targetFoodCostPct: 35,
    currency: 'XOF',
    country: 'Côte d’Ivoire',
  };

  // ------------------------------------------------------------------
  // Enrichissements vitrine publique : nutrition (pour 100 g), grammes par
  // unité de base, temps de cuisson, chef auteur et description des plats.
  // ------------------------------------------------------------------
  const NUT: Record<string, [number, number, number, number]> = {
    'ing-attieke': [340, 3, 76, 1], 'ing-riz': [350, 7, 78, 1], 'ing-igname': [118, 1.5, 28, 0.2],
    'ing-plantain': [122, 1.3, 32, 0.4], 'ing-manioc': [160, 1.4, 38, 0.3], 'ing-millet': [378, 11, 73, 4.3],
    'ing-gari': [380, 2.5, 91, 1], 'ing-poulet': [165, 19.5, 0, 9.5], 'ing-boeuf': [250, 26, 0, 15],
    'ing-carpe': [127, 18, 0, 6], 'ing-poisson-fume': [140, 26, 0, 3.5], 'ing-thon': [132, 28, 0, 1.3],
    'ing-crevettes': [240, 40, 2, 3], 'ing-oeufs': [143, 12.5, 1.5, 9.5], 'ing-lait-concentre': [324, 8, 55, 9],
    'ing-yaourt': [61, 3.5, 4.7, 3.2], 'ing-tomate': [18, 0.9, 3.9, 0.2], 'ing-tomate-concentree': [82, 4, 19, 0.5],
    'ing-oignon': [40, 1.1, 9.3, 0.1], 'ing-cive': [32, 1.8, 7, 0.2], 'ing-ail': [149, 6.4, 33, 0.5],
    'ing-gingembre': [80, 1.8, 18, 0.8], 'ing-piment': [40, 1.9, 9, 0.2], 'ing-aubergine': [25, 1, 6, 0.2],
    'ing-gombo': [33, 1.9, 7.5, 0.2], 'ing-avocat': [160, 2, 8.5, 14.7], 'ing-citron': [29, 1.1, 9, 0.3],
    'ing-palme': [280, 2, 12, 25], 'ing-huile-rouge': [884, 0, 0, 100], 'ing-huile': [884, 0, 0, 100],
    'ing-arachide': [590, 25, 20, 50], 'ing-cube': [255, 8, 45, 5], 'ing-sel': [0, 0, 0, 0],
    'ing-sucre': [387, 0, 100, 0], 'ing-bissap': [35, 0.4, 7.4, 0.4],
  };
  const BASE_G: Record<string, number> = {
    'ing-oeufs': 50, 'ing-lait-concentre': 397, 'ing-yaourt': 1030, 'ing-tomate-concentree': 400,
    'ing-cive': 100, 'ing-cube': 10, 'ing-huile-rouge': 920, 'ing-huile': 920,
  };
  for (const ing of ingredients) {
    const n = NUT[ing.id] ?? [100, 2, 10, 2];
    ing.nutrition = { kcal: n[0], protein: n[1], carbs: n[2], fat: n[3] };
    if (BASE_G[ing.id]) ing.baseUnitGrams = BASE_G[ing.id];
  }
  const META: Record<string, [number, string, string]> = {
    'rec-salade-avocat': [15, 'Chef Mariam Traoré', 'Avocat crémeux, tomates fraîches et oignon rouge relevés d’un filet de citron vert et d’huile douce. Une entrée fraîche et lumineuse, dressée minute comme au comptoir d’un grand hôtel.'],
    'rec-garba': [35, 'Chef Yao N’Guessan', 'Le classique des rues d’Abidjan élevé au rang de gastronomie : attiéké croustillant, thon frit doré, tomates et oignons, piment dosé avec précision.'],
    'rec-attieke-poisson': [45, 'Chef Yao N’Guessan', 'Poisson braisé entier à la peau caramélisée, servi sur un attiéké léger parfumé à la cive, accompagné de sa marinade tomate-oignon.'],
    'rec-alloco': [30, 'Chef Mariam Traoré', 'Bouchées de plantain mûr frites jusqu’à l’ambre parfait, moelleuses au cœur, servies avec sa sauce tomate pimentée maison.'],
    'rec-kedjenou': [90, 'Chef Awa Koné', 'Poulet fermier étouffé dans ses propres sucs, ail, gingembre et légumes fondants. Un plat mijoté profond, emblématique de la table ivoirienne.'],
    'rec-sauce-graine': [120, 'Chef Awa Koné', 'Sauce graine de noix de palme longuement mijotée, viande fondante et fumet relevé, servie avec un foutou banane souple frappé à la main.'],
    'rec-sauce-claire': [75, 'Chef Yao N’Guessan', 'Bouillon clair parfumé au poisson fumé, aubergines africaines et gombo, équilibré entre fraîcheur et caractère. Servi avec foutou d’igname.'],
    'rec-tchep': [60, 'Chef Awa Koné', 'Riz parfumé cuit dans une sauce arachide soyeuse au poulet doré, légumes confits et épices douces. Réconfortant et généreux.'],
    'rec-poulet-braise': [50, 'Chef Yao N’Guessan', 'Poulet braisé mariné 24 h, peau laquée aux épices, servi avec attiéké et sa sauce pimentée fraîche. Le signature des grandes soirées.'],
    'rec-placali': [55, 'Chef Mariam Traoré', 'Placali de manioc préparé selon la tradition, nappé d’une sauce gombo onctueuse au poisson fumé et à l’huile rouge.'],
    'rec-degue': [20, 'Chef Mariam Traoré', 'Mil perlé délicat enrobé de yaourt onctueux sucré au lait concentré, notes de vanille et de muscade. Un dessert frais et raffiné.'],
    'rec-bissap': [15, 'Chef Awa Koné', 'Infusion glacée de fleurs d’hibiscus, menthe fraîche et pointe de vanille. Robe rubis profonde, servi très frais en carafe givrée.'],
    'rec-wassa-wassa': [45, 'Chef Awa Koné', 'Wassa-wassa de manioc doré accompagné de poulet sauté aux légumes croquants et à la cive. Un plat de caractère, généreux et parfumé.'],
  };
  for (const r of recipes) {
    const m = META[r.id];
    if (m) {
      r.cookTimeMin = m[0];
      r.chef = m[1];
      r.description = m[2];
    }
  }

  return { users, ingredients, recipes, menus, settings };
}
