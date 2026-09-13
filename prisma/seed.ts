import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Base URL used to build the diner-facing QR link, mirroring app/api/magasin.
const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');

// Demo login — printed at the end for convenience.
const DEMO_EMAIL = 'demo@mangeqr.com';
const DEMO_PASSWORD = 'password123';

// Superadmin (cash-subscription console) — seeded from env with safe defaults.
// See .env.example (SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD). Rotate after first login.
const SUPERADMIN_EMAIL =
  process.env.SUPERADMIN_EMAIL || 'aimensouheibbennacer@gmail.com';
const SUPERADMIN_PASSWORD =
  process.env.SUPERADMIN_PASSWORD || 'AzertyZainounaTestoTesto';

/**
 * Idempotent upsert of the SUPERADMIN user, keyed by email so re-running the
 * seed never duplicates it. On update we intentionally (re)assert the known
 * dev state: role SUPERADMIN, a fresh password hash, emailVerified set (so
 * credentials sign-in works), and suspended:false — so the documented creds
 * always work in dev. This user owns no restaurants.
 */
async function seedSuperadmin() {
  const hashedPassword = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);

  await prisma.user.upsert({
    where: { email: SUPERADMIN_EMAIL },
    update: {
      role: 'SUPERADMIN',
      password: hashedPassword,
      emailVerified: new Date(),
      suspended: false,
      suspendedAt: null,
      suspendedReason: null,
    },
    create: {
      name: 'Super Admin',
      email: SUPERADMIN_EMAIL,
      password: hashedPassword,
      emailVerified: new Date(),
      role: 'SUPERADMIN',
      suspended: false,
    },
  });
}

function daysAgo(n: number, hour = 12): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function main() {
  console.log('🌱 Seeding MangeQR mock data...');

  // ---------------------------------------------------------------------------
  // Clean slate (safe for a local dev DB only). Order respects FK constraints,
  // though most relations cascade from Restaurant/User anyway.
  // ---------------------------------------------------------------------------
  await prisma.dishData.deleteMany();
  await prisma.categoryData.deleteMany();
  await prisma.scanData.deleteMany();
  await prisma.review.deleteMany();
  await prisma.emailRecipient.deleteMany();
  await prisma.marketingCampaign.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } });

  // ---------------------------------------------------------------------------
  // Superadmin (idempotent upsert by email — never part of the clean-slate).
  // ---------------------------------------------------------------------------
  await seedSuperadmin();

  // ---------------------------------------------------------------------------
  // Verified demo user (emailVerified is set so credentials sign-in works
  // without needing Resend to send a verification email).
  // ---------------------------------------------------------------------------
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  const user = await prisma.user.create({
    data: {
      name: 'Demo Restaurateur',
      email: DEMO_EMAIL,
      password: hashedPassword,
      emailVerified: new Date(),
      role: 'USER',
      plan: 'PRO',
    },
  });

  // ---------------------------------------------------------------------------
  // Restaurant 1 — fully populated (menus, categories, dishes, reviews, stats)
  // ---------------------------------------------------------------------------
  const restaurant = await prisma.restaurant.create({
    data: {
      id: randomUUID(),
      userId: user.id,
      name: 'Le Petit Gourmet',
      address: '12 Rue de la Paix, 75002 Paris',
      phone: '+33123456789',
      currency: 'EURO',
      subdomain: 'petit-gourmet',
      wifi: 'gourmet-guest',
      website: 'www.lepetitgourmet.fr',
      instagram: 'lepetitgourmet',
      google: 'https://g.page/r/le-petit-gourmet',
      coverPhoto: 'uploads/1735415131028bg-food.jpg',
    },
  });

  // qrUrl points at the diner-facing menu route.
  await prisma.restaurant.update({
    where: { id: restaurant.id },
    data: { qrUrl: `${BASE_URL}/restaurant/${restaurant.id}` },
  });

  // A second, empty-ish restaurant so the multi-restaurant selector has options.
  const restaurant2 = await prisma.restaurant.create({
    data: {
      id: randomUUID(),
      userId: user.id,
      name: 'Sushi Zen',
      address: '5 Avenue Montaigne, 75008 Paris',
      phone: '+33144556677',
      currency: 'EURO',
      subdomain: 'sushi-zen',
    },
  });
  await prisma.restaurant.update({
    where: { id: restaurant2.id },
    data: { qrUrl: `${BASE_URL}/restaurant/${restaurant2.id}` },
  });

  // ---------------------------------------------------------------------------
  // Menu -> Categories -> Dishes for restaurant 1
  // ---------------------------------------------------------------------------
  const lunchMenu = await prisma.menu.create({
    data: {
      id: randomUUID(),
      restaurantId: restaurant.id,
      name: 'Menu du Midi',
      position: 1,
      state: 'ACTIVE',
      availability: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'],
    },
  });

  const dinnerMenu = await prisma.menu.create({
    data: {
      id: randomUUID(),
      restaurantId: restaurant.id,
      name: 'Menu du Soir',
      position: 2,
      state: 'ACTIVE',
      availability: ['Jeudi', 'Vendredi', 'Samedi'],
    },
  });

  const categoriesData = [
    {
      menuId: lunchMenu.id,
      name: 'Entrées',
      logo: '🥗',
      position: 1,
      dishes: [
        { name: 'Salade César', description: 'Salade romaine, poulet grillé, parmesan', price: 9.5, allergenes: ['Œufs', 'Lait'] },
        { name: 'Soupe à l’oignon', description: 'Gratinée au comté', price: 7.0, allergenes: ['Lait', 'Blé'] },
      ],
    },
    {
      menuId: lunchMenu.id,
      name: 'Plats',
      logo: '🍽️',
      position: 2,
      dishes: [
        { name: 'Steak frites', description: 'Entrecôte, frites maison', price: 18.5, allergenes: [] },
        { name: 'Risotto aux champignons', description: 'Risotto crémeux, cèpes', price: 15.0, allergenes: ['Lait'] },
        { name: 'Saumon grillé', description: 'Saumon, légumes de saison', price: 19.0, allergenes: ['Poisson'] },
      ],
    },
    {
      menuId: dinnerMenu.id,
      name: 'Desserts',
      logo: '🍰',
      position: 1,
      dishes: [
        { name: 'Crème brûlée', description: 'Vanille de Madagascar', price: 6.5, allergenes: ['Œufs', 'Lait'] },
        { name: 'Fondant au chocolat', description: 'Cœur coulant, glace vanille', price: 7.5, allergenes: ['Œufs', 'Lait', 'Blé'] },
      ],
    },
  ];

  const createdDishes: { id: string; categoryId: string }[] = [];
  const createdCategoryIds: string[] = [];

  for (const cat of categoriesData) {
    const category = await prisma.menuCategory.create({
      data: {
        id: randomUUID(),
        menuId: cat.menuId,
        name: cat.name,
        logo: cat.logo,
        position: cat.position,
        state: 'ACTIVE',
      },
    });
    createdCategoryIds.push(category.id);

    let dishPos = 1;
    for (const dish of cat.dishes) {
      const created = await prisma.dish.create({
        data: {
          id: randomUUID(),
          categoryId: category.id,
          name: dish.name,
          description: dish.description,
          price: dish.price,
          allergenes: dish.allergenes,
          position: dishPos++,
          state: 'ACTIVE',
        },
      });
      createdDishes.push({ id: created.id, categoryId: category.id });
    }
  }

  // ---------------------------------------------------------------------------
  // Reviews
  // ---------------------------------------------------------------------------
  const reviews = [
    { review: 5, message: 'Excellent, je recommande !', clientEmail: 'alice@example.com', state: 'MANGEQR' as const },
    { review: 4, message: 'Très bon rapport qualité-prix.', clientEmail: 'bob@example.com', state: 'MANGEQR' as const },
    { review: 5, message: 'Le meilleur risotto de Paris.', clientNumero: '+33600000001', state: 'GOOGLE' as const },
    { review: 3, message: 'Correct mais un peu lent.', clientEmail: 'charlie@example.com', state: 'MANGEQR' as const },
    { review: 4, message: null, clientNumero: '+33600000002', state: 'MANGEQR' as const },
  ];

  for (const r of reviews) {
    await prisma.review.create({
      data: {
        id: randomUUID(),
        restaurantId: restaurant.id,
        review: r.review,
        message: r.message ?? null,
        clientEmail: r.clientEmail ?? null,
        clientNumero: r.clientNumero ?? null,
        state: r.state,
        createdAt: daysAgo(Math.floor(Math.random() * 25)),
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Analytics: scan data spread across the last 30 days, plus category/dish views
  // ---------------------------------------------------------------------------
  const scanRows: { restaurantId: string; createdAt: Date }[] = [];
  for (let day = 0; day < 30; day++) {
    // A few scans per day, more on weekends, some at night.
    const count = 2 + Math.floor(Math.random() * 6);
    for (let i = 0; i < count; i++) {
      const hour = Math.random() < 0.4 ? 20 : 13; // dinner vs lunch peak
      scanRows.push({ restaurantId: restaurant.id, createdAt: daysAgo(day, hour) });
    }
  }
  await prisma.scanData.createMany({ data: scanRows });

  const categoryRows = [];
  const dishRows = [];
  for (let day = 0; day < 30; day++) {
    for (const catId of createdCategoryIds) {
      const views = Math.floor(Math.random() * 4);
      for (let i = 0; i < views; i++) {
        categoryRows.push({ restaurantId: restaurant.id, categoryId: catId, createdAt: daysAgo(day, 13) });
      }
    }
    for (const dish of createdDishes) {
      const views = Math.floor(Math.random() * 3);
      for (let i = 0; i < views; i++) {
        dishRows.push({ restaurantId: restaurant.id, dishId: dish.id, createdAt: daysAgo(day, 13) });
      }
    }
  }
  if (categoryRows.length) await prisma.categoryData.createMany({ data: categoryRows });
  if (dishRows.length) await prisma.dishData.createMany({ data: dishRows });

  // ---------------------------------------------------------------------------
  // A draft marketing campaign with recipients
  // ---------------------------------------------------------------------------
  const campaign = await prisma.marketingCampaign.create({
    data: {
      id: randomUUID(),
      restaurantId: restaurant.id,
      name: 'Offre de bienvenue',
      description: 'Campagne de réengagement',
      subject: '🍽️ -10% sur votre prochaine visite',
      body: '<h1>Merci de votre visite !</h1><p>Profitez de -10% en présentant ce mail.</p>',
      sent: false,
    },
  });
  await prisma.emailRecipient.createMany({
    data: [
      { campaignId: campaign.id, email: 'alice@example.com' },
      { campaignId: campaign.id, email: 'bob@example.com' },
    ],
  });

  console.log('✅ Seed complete.');
  console.log('--------------------------------------------------');
  console.log(`👤 Login:    ${DEMO_EMAIL}`);
  console.log(`🔑 Password: ${DEMO_PASSWORD}`);
  console.log(`🍽️  Diner menu: ${BASE_URL}/restaurant/${restaurant.id}`);
  console.log('--------------------------------------------------');
  console.log(`🛡️  Superadmin: ${SUPERADMIN_EMAIL}`);
  console.log('   (password from SUPERADMIN_PASSWORD — not printed)');
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
