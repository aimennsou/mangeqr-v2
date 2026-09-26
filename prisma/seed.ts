import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

/**
 * MangeQR seed.
 *
 * TWO MODES.
 *
 *   npm run db:seed        DEV. Wipes ALL tenant data (every restaurant, menu,
 *                          order, review and analytics row in the database) and
 *                          rebuilds the demo content from scratch.
 *
 *   npm run db:seed:prod   PRODUCTION-SAFE. Touches only the two accounts this
 *                          product needs to exist — the SUPERADMIN console login
 *                          and the Demo account used for client demos — plus the
 *                          demo account's OWN restaurants. It never deletes
 *                          another user's data.
 *
 * Run the production one on a live database. The dev one would destroy every
 * customer's menus.
 *
 * ALL FOUR CREDENTIALS COME FROM THE ENVIRONMENT AND ARE REQUIRED. There are no
 * fallbacks on purpose: this file previously shipped a working superadmin
 * password and a `password123` demo login in git, so anyone with repo access
 * could seed themselves a full-privilege account.
 */

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Mode + credentials
// ---------------------------------------------------------------------------

/**
 * `prisma db seed -- --production` forwards the flag through to argv, which works
 * the same on Windows and POSIX (an inline `VAR=value` prefix does not).
 */
const PRODUCTION_MODE =
  process.argv.includes('--production') ||
  process.env.SEED_MODE === 'production';

/** Allows the destructive dev reset to run against a non-local database. */
const FORCE_DEV_RESET = process.argv.includes('--force-dev-reset');

const DATABASE_URL = process.env.DATABASE_URL ?? '';
const LOOKS_LOCAL =
  DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1');

const MIN_PASSWORD_LENGTH = 12;

const missing: string[] = [];
const weak: string[] = [];

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    missing.push(name);
    return '';
  }
  return value.trim();
}

function requiredPassword(name: string): string {
  const value = requiredEnv(name);
  if (value && value.length < MIN_PASSWORD_LENGTH) weak.push(name);
  return value;
}

const SUPERADMIN_EMAIL = requiredEnv('SUPERADMIN_EMAIL');
const SUPERADMIN_PASSWORD = requiredPassword('SUPERADMIN_PASSWORD');
const DEMO_EMAIL = requiredEnv('DEMO_EMAIL');
const DEMO_PASSWORD = requiredPassword('DEMO_PASSWORD');

function assertCredentials(): void {
  if (missing.length > 0) {
    console.error(
      `\n❌ Missing required environment variable(s): ${missing.join(', ')}\n\n` +
        'The seed has no built-in credentials. Set these in .env (see .env.example):\n' +
        '  SUPERADMIN_EMAIL     login for the /superadmin console\n' +
        '  SUPERADMIN_PASSWORD  at least 12 characters\n' +
        '  DEMO_EMAIL           the account used for client demos\n' +
        '  DEMO_PASSWORD        at least 12 characters\n'
    );
    process.exit(1);
  }

  if (weak.length > 0) {
    console.error(
      `\n❌ Password too short: ${weak.join(', ')} ` +
        `(minimum ${MIN_PASSWORD_LENGTH} characters).\n` +
        'These accounts are full-privilege and internet-reachable. Use a generated password.\n'
    );
    process.exit(1);
  }

  if (SUPERADMIN_EMAIL.toLowerCase() === DEMO_EMAIL.toLowerCase()) {
    console.error(
      '\n❌ SUPERADMIN_EMAIL and DEMO_EMAIL must differ — they are two separate accounts.\n'
    );
    process.exit(1);
  }
}

/**
 * Refuse the destructive dev reset against anything that does not look like a
 * local database. The dev path deletes EVERY restaurant in the database, so on a
 * production connection string it would wipe every customer.
 */
function assertResetIsSafe(): void {
  if (PRODUCTION_MODE) return;
  if (LOOKS_LOCAL || FORCE_DEV_RESET) return;

  console.error(
    '\n❌ Refusing to run the destructive dev seed.\n\n' +
      `DATABASE_URL does not point at localhost, and the dev seed DELETES EVERY\n` +
      'restaurant, menu, order, review and analytics row in the database.\n\n' +
      'If you meant to seed a live database, use the production-safe path:\n' +
      '    npm run db:seed:prod\n\n' +
      'If you really do want a full reset on this connection, re-run with:\n' +
      '    npx prisma db seed -- --force-dev-reset\n'
  );
  process.exit(1);
}

// Base URL used to build the diner-facing QR link, mirroring app/api/magasin.
const BASE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
).replace(/\/$/, '');

function daysAgo(n: number, hour = 12): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

/**
 * Idempotent upsert of the SUPERADMIN user, keyed by email so re-running never
 * duplicates it.
 *
 * On update it deliberately re-asserts role, password hash, emailVerified and
 * suspended:false, so the documented credentials always work. That is also why
 * running this against production resets that account — intended for the console
 * login, but worth knowing. This user owns no restaurants.
 */
async function seedSuperadmin(): Promise<void> {
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

/**
 * Idempotent upsert of the Demo account used to show the product to clients.
 *
 * `emailVerified` is set so credentials sign-in works without Resend, and every
 * display feature is enabled so a demo can show ordering, the kiosk and the TV
 * board. Returns the user id.
 */
async function seedDemoAccount(): Promise<string> {
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  const demo = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {
      role: 'USER',
      password: hashedPassword,
      emailVerified: new Date(),
      plan: 'PRO',
      orderingEnabled: true,
      kioskEnabled: true,
      tvEnabled: true,
      suspended: false,
      suspendedAt: null,
      suspendedReason: null,
    },
    create: {
      name: 'Demo Restaurateur',
      email: DEMO_EMAIL,
      password: hashedPassword,
      emailVerified: new Date(),
      role: 'USER',
      plan: 'PRO',
      orderingEnabled: true,
      kioskEnabled: true,
      tvEnabled: true,
    },
    select: { id: true },
  });

  return demo.id;
}

// ---------------------------------------------------------------------------
// Wipes
// ---------------------------------------------------------------------------

/**
 * DEV ONLY. Deletes every tenant row in the database. Guarded by
 * assertResetIsSafe().
 */
async function wipeAllTenantData(): Promise<void> {
  await prisma.dishData.deleteMany();
  await prisma.categoryData.deleteMany();
  await prisma.favoriteData.deleteMany();
  await prisma.scanData.deleteMany();
  await prisma.review.deleteMany();
  await prisma.emailRecipient.deleteMany();
  await prisma.marketingCampaign.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.restaurantTable.deleteMany();
  await prisma.tableZone.deleteMany();
  await prisma.dishAddonOption.deleteMany();
  await prisma.dishAddonGroup.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.designOrder.deleteMany();
  await prisma.restaurant.deleteMany();
}

/**
 * PRODUCTION-SAFE. Removes only the demo account's own restaurants, so re-running
 * rebuilds its content instead of duplicating it.
 *
 * Deleting a Restaurant cascades to its menus, categories, dishes, add-on groups,
 * tables, zones, orders, order items, reviews, campaigns and analytics rows —
 * every one of those relations declares onDelete: Cascade on restaurantId. So
 * this single scoped delete is enough, and it cannot reach another user's data.
 */
async function wipeDemoRestaurants(demoUserId: string): Promise<void> {
  const { count } = await prisma.restaurant.deleteMany({
    where: { userId: demoUserId },
  });
  if (count > 0) {
    console.log(`   cleared ${count} existing demo restaurant(s) (cascaded)`);
  }
}

// ---------------------------------------------------------------------------
// Demo content
// ---------------------------------------------------------------------------

/**
 * Build the demo account's restaurants, menus, tables, add-ons, orders, reviews
 * and analytics. Runs in BOTH modes: a demo account with no content is useless
 * for showing the product to a client.
 *
 * Everything created here is owned by `demoUserId`.
 */
async function seedDemoContent(demoUserId: string): Promise<string> {
  // -------------------------------------------------------------------------
  // Restaurant 1 — fully populated (menus, categories, dishes, reviews, stats)
  // -------------------------------------------------------------------------
  const restaurant = await prisma.restaurant.create({
    data: {
      id: randomUUID(),
      userId: demoUserId,
      name: 'Le Petit Gourmet',
      address: '12 Rue de la Paix, 75002 Paris',
      phone: '+33123456789',
      currency: 'EURO',
      subdomain: 'petit-gourmet',
      wifi: 'gourmet-guest',
      website: 'www.lepetitgourmet.fr',
      instagram: 'lepetitgourmet',
      google: 'https://g.page/r/le-petit-gourmet',
      coverPhoto: '/images/seed/cover.jpg',
      orderingEnabled: true,
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
      userId: demoUserId,
      name: 'Sushi Zen',
      address: '5 Avenue Montaigne, 75008 Paris',
      phone: '+33144556677',
      currency: 'EURO',
      subdomain: 'sushi-zen',
      orderingEnabled: true,
    },
  });
  await prisma.restaurant.update({
    where: { id: restaurant2.id },
    data: { qrUrl: `${BASE_URL}/restaurant/${restaurant2.id}` },
  });

  // -------------------------------------------------------------------------
  // Menu -> Categories -> Dishes for restaurant 1
  // -------------------------------------------------------------------------
  const lunchMenu = await prisma.menu.create({
    data: {
      id: randomUUID(),
      restaurantId: restaurant.id,
      name: 'Menu du Midi',
      position: 1,
      state: 'ACTIVE',
      // Empty availability = always available, so the demo menu shows every day
      // (including weekends) — otherwise a Sunday visit sees "Aucun menu".
      availability: [],
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
        { name: 'Salade César', description: 'Salade romaine, poulet grillé, parmesan', price: 9.5, allergenes: ['Fait maison', 'Œufs', 'Lait'], photo: '/images/seed/salad.jpg' },
        { name: 'Soupe à l’oignon', description: 'Gratinée au comté', price: 7.0, allergenes: ['De saison', 'Fait maison', 'Lait', 'Blé'], photo: '/images/seed/soup.jpg' },
        { name: 'Bruschetta', description: 'Pain grillé aux tomates fraîches et basilic', price: 7.5, allergenes: ['Vegetarian', 'Fait maison', 'Blé'], photo: '/images/seed/bruschetta.jpg' },
      ],
    },
    {
      menuId: lunchMenu.id,
      name: 'Plats',
      logo: '🍽️',
      position: 2,
      dishes: [
        { name: 'Steak frites', description: 'Entrecôte, frites maison', price: 18.5, allergenes: ['Fait maison'], photo: '/images/seed/steak.jpg' },
        { name: 'Risotto aux champignons', description: 'Risotto crémeux, cèpes', price: 15.0, allergenes: ['Vegetarian', 'Lait'], photo: '/images/seed/risotto.jpg' },
        { name: 'Saumon grillé', description: 'Saumon, légumes de saison', price: 19.0, allergenes: ['De saison', 'Poisson'], photo: '/images/seed/salmon.jpg' },
      ],
    },
    {
      menuId: dinnerMenu.id,
      name: 'Desserts',
      logo: '🍰',
      position: 1,
      dishes: [
        { name: 'Crème brûlée', description: 'Vanille de Madagascar', price: 6.5, allergenes: ['Fait maison', 'Œufs', 'Lait'], photo: '/images/seed/cremebrulee.jpg' },
        { name: 'Fondant au chocolat', description: 'Cœur coulant, glace vanille', price: 7.5, allergenes: ['Fait maison', 'Œufs', 'Lait', 'Blé'], photo: '/images/seed/fondant.jpg' },
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
          photo: (dish as any).photo ?? null,
          position: dishPos++,
          state: 'ACTIVE',
        },
      });
      createdDishes.push({ id: created.id, categoryId: category.id });
    }
  }

  // -------------------------------------------------------------------------
  // FEAT-2 — Table layout (zones + tables) for restaurant 1, so the demo's
  // dine-in ordering has tables to pick from and a populated floor plan.
  // -------------------------------------------------------------------------
  const salleZone = await prisma.tableZone.create({
    data: { id: randomUUID(), restaurantId: restaurant.id, name: 'Salle', position: 0 },
  });
  const terrasseZone = await prisma.tableZone.create({
    data: { id: randomUUID(), restaurantId: restaurant.id, name: 'Terrasse', position: 1 },
  });

  // 6 tables laid out on a simple grid (posX/posY on the floor-plan canvas).
  const tableDefs = [
    { label: '1', seats: 2, zoneId: salleZone.id, posX: 40, posY: 40 },
    { label: '2', seats: 2, zoneId: salleZone.id, posX: 160, posY: 40 },
    { label: '3', seats: 4, zoneId: salleZone.id, posX: 280, posY: 40 },
    { label: '4', seats: 4, zoneId: salleZone.id, posX: 40, posY: 160 },
    { label: '5', seats: 6, zoneId: terrasseZone.id, posX: 160, posY: 160 },
    { label: '6', seats: 2, zoneId: terrasseZone.id, posX: 280, posY: 160 },
  ];
  for (const td of tableDefs) {
    await prisma.restaurantTable.create({
      data: {
        id: randomUUID(),
        restaurantId: restaurant.id,
        zoneId: td.zoneId,
        label: td.label,
        seats: td.seats,
        posX: td.posX,
        posY: td.posY,
      },
    });
  }

  // -------------------------------------------------------------------------
  // FEAT-1/D12 — Add-on groups for a couple of dishes so the diner order builder
  // has something to show (a SINGLE required "Cuisson" and a MULTI "Extras").
  // -------------------------------------------------------------------------
  // Scoped to THIS restaurant: a bare findFirst by name would match another
  // account's dish once real customers exist.
  const steak = await prisma.dish.findFirst({
    where: {
      name: 'Steak frites',
      category: { menu: { restaurantId: restaurant.id } },
    },
    select: { id: true },
  });
  if (steak) {
    const cuisson = await prisma.dishAddonGroup.create({
      data: {
        id: randomUUID(),
        dishId: steak.id,
        name: 'Cuisson',
        type: 'SINGLE',
        required: true,
        position: 0,
      },
    });
    await prisma.dishAddonOption.createMany({
      data: [
        { id: randomUUID(), groupId: cuisson.id, name: 'Saignant', priceDelta: 0, position: 0 },
        { id: randomUUID(), groupId: cuisson.id, name: 'À point', priceDelta: 0, position: 1 },
        { id: randomUUID(), groupId: cuisson.id, name: 'Bien cuit', priceDelta: 0, position: 2 },
      ],
    });
    const extras = await prisma.dishAddonGroup.create({
      data: {
        id: randomUUID(),
        dishId: steak.id,
        name: 'Extras',
        type: 'MULTI',
        required: false,
        position: 1,
      },
    });
    await prisma.dishAddonOption.createMany({
      data: [
        { id: randomUUID(), groupId: extras.id, name: 'Œuf', priceDelta: 1.5, position: 0 },
        { id: randomUUID(), groupId: extras.id, name: 'Sauce poivre', priceDelta: 2, position: 1 },
        { id: randomUUID(), groupId: extras.id, name: 'Supplément frites', priceDelta: 3, position: 2 },
      ],
    });
  }

  // -------------------------------------------------------------------------
  // FEAT-1 — Orders over the last 30 days so the performances page shows real
  // ordering KPIs (orders, revenue, avg basket, dine-in vs delivery) and the
  // revenue chart. Prices/names are snapshotted like the real order endpoint.
  // -------------------------------------------------------------------------
  const seedDishes = await prisma.dish.findMany({
    where: { category: { menu: { restaurantId: restaurant.id } } },
    select: { id: true, name: true, price: true },
  });
  const seedTables = await prisma.restaurantTable.findMany({
    where: { restaurantId: restaurant.id },
    select: { id: true, label: true },
  });

  if (seedDishes.length > 0) {
    // Terminal-ish statuses weighted toward COMPLETED so revenue is meaningful,
    // with a few active + a couple cancelled for variety.
    const statusPool = [
      'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED',
      'SERVED', 'READY', 'IN_PREPARATION', 'RECEIVED', 'CANCELLED',
    ] as const;

    let orderNumber = 0;
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

    for (let day = 0; day < 30; day++) {
      // 1–4 orders per day.
      const perDay = 1 + Math.floor(Math.random() * 4);
      for (let i = 0; i < perDay; i++) {
        orderNumber += 1;
        const isDelivery = Math.random() < 0.35;
        const status = pick([...statusPool]);
        // Delivery orders use the delivery lifecycle terminal (DELIVERED) in
        // place of SERVED for realism.
        const finalStatus =
          isDelivery && status === 'SERVED' ? 'DELIVERED' : status;

        // 1–3 line items.
        const lineCount = 1 + Math.floor(Math.random() * 3);
        const items = [] as {
          dishId: string;
          dishName: string;
          unitPrice: number;
          quantity: number;
          lineTotal: number;
        }[];
        let total = 0;
        for (let l = 0; l < lineCount; l++) {
          const dish = pick(seedDishes);
          const qty = 1 + Math.floor(Math.random() * 2);
          const lineTotal = dish.price * qty;
          total += lineTotal;
          items.push({
            dishId: dish.id,
            dishName: dish.name,
            unitPrice: dish.price,
            quantity: qty,
            lineTotal,
          });
        }

        const table = isDelivery ? null : pick(seedTables);
        const createdAt = daysAgo(day, Math.random() < 0.5 ? 13 : 20);
        // Settled orders (served/delivered/completed) are marked paid; others
        // are unpaid — realistic mix for the demo.
        const isSettled = ['SERVED', 'DELIVERED', 'COMPLETED'].includes(
          finalStatus
        );

        await prisma.order.create({
          data: {
            id: randomUUID(),
            restaurantId: restaurant.id,
            orderNumber,
            type: isDelivery ? 'DELIVERY' : 'DINE_IN',
            status: finalStatus,
            tableId: table?.id ?? null,
            tableLabel: table?.label ?? null,
            customerName: isDelivery ? 'Client Démo' : null,
            customerPhone: isDelivery ? '+33600000123' : null,
            address: isDelivery ? '10 Rue de Rivoli, 75001 Paris' : null,
            note: null,
            total,
            paid: isSettled,
            paidAt: isSettled ? createdAt : null,
            createdAt,
            updatedAt: createdAt,
            items: { create: items },
          },
        });
      }
    }
  }

  // -------------------------------------------------------------------------
  // Reviews
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Analytics: scan data spread across the last 30 days, plus category/dish views
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // A draft marketing campaign with recipients
  // -------------------------------------------------------------------------
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

  return restaurant.id;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main() {
  assertCredentials();
  assertResetIsSafe();

  if (PRODUCTION_MODE) {
    console.log('🌱 Seeding MangeQR — PRODUCTION-SAFE mode');
    console.log('   Only the superadmin + demo accounts and the demo account’s');
    console.log('   own restaurants are touched. No other user’s data is read');
    console.log('   or deleted.');
  } else {
    console.log('🌱 Seeding MangeQR — DEV mode (full reset)');
    console.log(
      `   Target: ${LOOKS_LOCAL ? 'local database' : 'NON-LOCAL database (forced)'}`
    );
  }

  await seedSuperadmin();
  console.log('🛡️  superadmin ready');

  const demoUserId = await seedDemoAccount();
  console.log('👤 demo account ready');

  if (PRODUCTION_MODE) {
    await wipeDemoRestaurants(demoUserId);
  } else {
    await wipeAllTenantData();
    console.log('   wiped all tenant data');
  }

  const demoRestaurantId = await seedDemoContent(demoUserId);

  console.log('✅ Seed complete.');
  console.log('--------------------------------------------------');
  console.log(`🛡️  Superadmin: ${SUPERADMIN_EMAIL}`);
  console.log(`👤 Demo:       ${DEMO_EMAIL}`);
  console.log('   (passwords come from the environment — not printed)');
  console.log(`🍽️  Demo menu:  ${BASE_URL}/restaurant/${demoRestaurantId}`);
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
