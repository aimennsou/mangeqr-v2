
import { currentUserId } from '@/lib/authentication';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { buildPathMenuUrl, normalizeSubdomain, validateSubdomain } from '@/lib/subdomain';
import { getPlanLimits, getEffectivePlan } from '@/lib/plan';
import { getWorkspaceOwnerId, memberCanAccess } from '@/data/workspace';
import { notifyPlanLimitHit } from '@/lib/notifications';


export async function POST(req: NextRequest) {
  const userId = await currentUserId();

  try {
    const { name, address, phone, currency, subdomain, coverPhoto, wifi, website, instagram, tiktok, google } = await req.json();

    // Validate request data
    if (!name || !address || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get the authenticated user ID
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // #7: creating restaurants requires the "restaurants" permission (owners
    // always have it; members need it granted). Restaurants are scoped to the
    // workspace OWNER so a member creates under the owner's account, not their
    // own.
    if (!(await memberCanAccess(userId, 'restaurants'))) {
      return NextResponse.json(
        { error: "Vous n'avez pas la permission de gérer les restaurants." },
        { status: 403 }
      );
    }
    const ownerId = await getWorkspaceOwnerId(userId);

    // Normalize + validate the subdomain (the diner menu access link).
    const normalizedSubdomain = normalizeSubdomain(subdomain ?? "");
    const subError = validateSubdomain(normalizedSubdomain);
    if (subError) {
      return NextResponse.json({ error: subError }, { status: 400 });
    }

    // Enforce global uniqueness of the subdomain.
    const existing = await db.restaurant.findUnique({
      where: { subdomain: normalizedSubdomain },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Ce lien d'accès est déjà utilisé. Choisissez-en un autre." },
        { status: 409 }
      );
    }

    // Plan/limit/ownership are resolved against the workspace OWNER (a member
    // acts on the owner's account).
    const user = await db.user.findUnique({
      where: { id: ownerId },
    });
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Enforce the plan's restaurant limit (expiry-aware).
    const restaurantLimit = getPlanLimits(getEffectivePlan(user)).restaurants;
    const restaurantCount = await db.restaurant.count({
      where: { userId: ownerId },
    });
    if (restaurantCount >= restaurantLimit) {
      // Notify the owner (upgrade nudge) + the back-office (#4).
      await notifyPlanLimitHit({
        ownerId,
        resource: 'restaurants',
        limit: restaurantLimit,
      });
      return NextResponse.json(
        {
          error: `Limite de restaurants atteinte. Votre plan permet jusqu'à ${restaurantLimit} restaurant(s).`,
        },
        { status: 400 }
      );
    }

    const id = uuidv4();
    // QR always encodes the stable id-based path (independent of subdomain).
    const qrUrl = buildPathMenuUrl(id);

    // Create the new restaurant, persisting the wifi/social details
    const newrestaurant = await db.restaurant.create({
      data: {
        id,
        name,
        address,
        phone,
        coverPhoto: coverPhoto || "uploads/1735415131028bg-food.jpg",
        qrUrl,
        subdomain: normalizedSubdomain,
        wifi: wifi || null,
        website: website || null,
        instagram: instagram || null,
        tiktok: tiktok || null,
        google: google || null,
        currency,
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(newrestaurant, { status: 201 });
  } catch (error) {
    console.error('Error creating restaurant:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


export async function GET() {
  try {
    // Get the authenticated user's ID
    const userId = await currentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Read access: scope to the workspace owner so a member sees the OWNER's
    // restaurants (needed to pick one to edit its menus). Mutations remain
    // owner-only per POST/PUT/DELETE guards.
    const ownerId = await getWorkspaceOwnerId(userId);

    // Fetch all restaurants associated with the workspace owner
    const restaurants = await db.restaurant.findMany({
      where: {
        userId: ownerId,
      }
    });

    // Return an empty array (200) when there are no restaurants. A 404 here
    // made clients that expect a JSON array (performances, cartes, numerique,
    // superadmin with no restaurants) hang or error on load. Callers already
    // handle an empty array gracefully.
    if (restaurants.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(restaurants, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


  export async function DELETE(req: NextRequest) {
    try {
      const userId = await currentUserId();
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // #7: deleting restaurants requires the "restaurants" permission.
      if (!(await memberCanAccess(userId, 'restaurants'))) {
        return NextResponse.json(
          { error: "Vous n'avez pas la permission de gérer les restaurants." },
          { status: 403 }
        );
      }
      const ownerId = await getWorkspaceOwnerId(userId);

      const body = await req.json();
      const { id } = body;

      // Validate that the id field is provided
      if (!id) {
        return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
      }

      // Scope deletion to the workspace owner's restaurants so a member can
      // never delete another owner's restaurant by guessing its id.
      const ids = Array.isArray(id) ? id : [id];
      await db.restaurant.deleteMany({
        where: {
          id: { in: ids },
          userId: ownerId,
        },
      });

      return NextResponse.json({ message: "Restaurant(s) supprimé(s) avec succès" }, { status: 200 });
    } catch (error) {
      console.error('Error deleting restaurant(s):', error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }



  export async function PUT(req: NextRequest) {
    try {
      const userId = await currentUserId();
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // #7: editing restaurants requires the "restaurants" permission.
      if (!(await memberCanAccess(userId, 'restaurants'))) {
        return NextResponse.json(
          { error: "Vous n'avez pas la permission de gérer les restaurants." },
          { status: 403 }
        );
      }
      const ownerId = await getWorkspaceOwnerId(userId);

      const { id, name, address, phone, currency, subdomain, coverPhoto, wifi, website, instagram, tiktok, google } = await req.json();
  
      // Validate request data
      if (!id || !name || !address || !phone  || !currency ) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      // Ownership check: the restaurant must belong to the workspace owner.
      const owned = await db.restaurant.findFirst({
        where: { id, userId: ownerId },
        select: { id: true },
      });
      if (!owned) {
        return NextResponse.json({ error: "Restaurant introuvable" }, { status: 404 });
      }

      const data: any = {
        name,
        address,
        phone,
        coverPhoto,
        currency,
        wifi: wifi ?? null,
        website: website ?? null,
        instagram: instagram ?? null,
        tiktok: tiktok ?? null,
        google: google ?? null,
        updatedAt: new Date(),
      };

      // If a subdomain was provided, normalize + validate + enforce uniqueness
      // (excluding this restaurant), and rebuild the access/QR URL.
      if (subdomain !== undefined) {
        const normalizedSubdomain = normalizeSubdomain(subdomain ?? "");
        const subError = validateSubdomain(normalizedSubdomain);
        if (subError) {
          return NextResponse.json({ error: subError }, { status: 400 });
        }
        const taken = await db.restaurant.findFirst({
          where: { subdomain: normalizedSubdomain, id: { not: id } },
          select: { id: true },
        });
        if (taken) {
          return NextResponse.json(
            { error: "Ce lien d'accès est déjà utilisé. Choisissez-en un autre." },
            { status: 409 }
          );
        }
        data.subdomain = normalizedSubdomain;
        // Note: qrUrl is intentionally NOT changed here — it stays the stable
        // id-based path so the QR code and the subdomain remain independent.
      }

      // Update the restaurant record in the database, persisting wifi/social details
      const updatedrestaurant = await db.restaurant.update({
        where: { id },
        data,
      });

      return NextResponse.json(updatedrestaurant, { status: 200 });
    } catch (error) {
      console.error('Error updating restaurant:', error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }
  
  
