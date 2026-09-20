import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { CreateOrderSchema } from '@/schemas';

/**
 * POST /api/orders (FEAT-1) — PUBLIC diner order submission (no auth).
 *
 * Security / integrity:
 *  - Ordering must be enabled for BOTH the account (User.orderingEnabled) and
 *    the restaurant (Restaurant.orderingEnabled); otherwise 403.
 *  - All prices are recomputed from the DB — the client's prices are ignored.
 *  - Dish ids must be ACTIVE dishes of the restaurant; add-on option ids must
 *    belong to the corresponding dish's groups.
 *  - Dine-in tableId must belong to the restaurant.
 *  - orderNumber is a per-restaurant sequence allocated inside the transaction.
 *
 * Returns `{ id, orderNumber }` on success so the diner can watch live status.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? 'Données invalides.';
    return NextResponse.json({ error: first }, { status: 400 });
  }

  const {
    restaurantId,
    type,
    tableId,
    customerName,
    customerPhone,
    address,
    latitude,
    longitude,
    note,
    items
  } = parsed.data;

  // Load the restaurant + owner ordering flags + currency.
  const restaurant = await db.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      id: true,
      orderingEnabled: true,
      user: { select: { orderingEnabled: true } }
    }
  });
  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurant introuvable.' }, { status: 404 });
  }
  const orderingEnabled =
    (restaurant.user?.orderingEnabled ?? false) && restaurant.orderingEnabled;
  if (!orderingEnabled) {
    return NextResponse.json(
      { error: "La commande n'est pas disponible pour ce restaurant." },
      { status: 403 }
    );
  }

  // Validate the table for dine-in.
  let tableLabel: string | null = null;
  // Validate the table only when one is provided. Dine-in without a table
  // (counter pickup / no floor plan) is allowed.
  if (type === 'DINE_IN' && tableId) {
    const table = await db.restaurantTable.findFirst({
      where: { id: tableId, restaurantId },
      select: { id: true, label: true }
    });
    if (!table) {
      return NextResponse.json({ error: 'Table invalide.' }, { status: 400 });
    }
    tableLabel = table.label;
  }

  // Load the referenced dishes (ACTIVE, belonging to this restaurant) with
  // their add-on options, so we can recompute prices and validate selections.
  const dishIds = Array.from(new Set(items.map((i) => i.dishId)));
  const dishes = await db.dish.findMany({
    where: {
      id: { in: dishIds },
      state: 'ACTIVE',
      category: { menu: { restaurantId, state: 'ACTIVE' } }
    },
    select: {
      id: true,
      name: true,
      price: true,
      addonGroups: {
        select: {
          id: true,
          name: true,
          type: true,
          required: true,
          options: { select: { id: true, name: true, priceDelta: true } }
        }
      }
    }
  });
  const dishById = new Map(dishes.map((d) => [d.id, d]));

  // Build validated order items with server-computed prices.
  type BuiltItem = {
    dishId: string;
    dishName: string;
    unitPrice: number;
    quantity: number;
    addons: { groupName: string; optionName: string; priceDelta: number }[];
    specialRequest: string | null;
    lineTotal: number;
  };
  const builtItems: BuiltItem[] = [];

  for (const item of items) {
    const dish = dishById.get(item.dishId);
    if (!dish) {
      return NextResponse.json(
        { error: 'Un plat de la commande est indisponible.' },
        { status: 400 }
      );
    }

    // Map option ids → their group + option, validating they belong to dish.
    const optionById = new Map<
      string,
      { groupId: string; groupName: string; groupType: string; name: string; priceDelta: number }
    >();
    for (const g of dish.addonGroups) {
      for (const o of g.options) {
        optionById.set(o.id, {
          groupId: g.id,
          groupName: g.name,
          groupType: g.type,
          name: o.name,
          priceDelta: o.priceDelta
        });
      }
    }

    const chosen = item.optionIds.map((id) => optionById.get(id));
    if (chosen.some((c) => !c)) {
      return NextResponse.json(
        { error: 'Une option de supplément est invalide.' },
        { status: 400 }
      );
    }

    // Enforce SINGLE groups: at most one chosen; required SINGLE groups: exactly
    // one chosen.
    const chosenByGroup = new Map<string, number>();
    for (const c of chosen) {
      chosenByGroup.set(c!.groupId, (chosenByGroup.get(c!.groupId) ?? 0) + 1);
    }
    for (const g of dish.addonGroups) {
      const count = chosenByGroup.get(g.id) ?? 0;
      if (g.type === 'SINGLE' && count > 1) {
        return NextResponse.json(
          { error: `Choix unique requis pour « ${g.name} ».` },
          { status: 400 }
        );
      }
      if (g.type === 'SINGLE' && g.required && count === 0) {
        return NextResponse.json(
          { error: `Veuillez choisir une option pour « ${g.name} ».` },
          { status: 400 }
        );
      }
    }

    const addons = chosen.map((c) => ({
      groupName: c!.groupName,
      optionName: c!.name,
      priceDelta: c!.priceDelta
    }));
    const addonsTotal = addons.reduce((s, a) => s + a.priceDelta, 0);
    const lineTotal = (dish.price + addonsTotal) * item.quantity;

    builtItems.push({
      dishId: dish.id,
      dishName: dish.name,
      unitPrice: dish.price,
      quantity: item.quantity,
      addons,
      specialRequest: item.specialRequest?.trim() || null,
      lineTotal
    });
  }

  const total = builtItems.reduce((s, i) => s + i.lineTotal, 0);

  try {
    const created = await db.$transaction(async (tx) => {
      // Allocate the next per-restaurant order number.
      const last = await tx.order.findFirst({
        where: { restaurantId },
        orderBy: { orderNumber: 'desc' },
        select: { orderNumber: true }
      });
      const orderNumber = (last?.orderNumber ?? 0) + 1;

      return tx.order.create({
        data: {
          restaurantId,
          orderNumber,
          type,
          status: 'RECEIVED',
          tableId: type === 'DINE_IN' ? tableId ?? null : null,
          tableLabel,
          customerName: type === 'DELIVERY' ? customerName || null : null,
          customerPhone: type === 'DELIVERY' ? customerPhone || null : null,
          address: type === 'DELIVERY' ? address || null : null,
          latitude: type === 'DELIVERY' ? latitude ?? null : null,
          longitude: type === 'DELIVERY' ? longitude ?? null : null,
          note: note || null,
          total,
          items: {
            create: builtItems.map((i) => ({
              dishId: i.dishId,
              dishName: i.dishName,
              unitPrice: i.unitPrice,
              quantity: i.quantity,
              addons: i.addons,
              specialRequest: i.specialRequest,
              lineTotal: i.lineTotal
            }))
          }
        },
        select: { id: true, orderNumber: true }
      });
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la commande.' },
      { status: 500 }
    );
  }
}
