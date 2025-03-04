import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { generateMenu } from '@/lib/menuUtils'; // Assuming this is your function to generate the PDF


interface Category {
  name: string;
  dishes: Dish[];
}

interface Dish {
  name: string;
  price: string;
  description: string;
}

export async function POST(req: NextRequest) {
  try {
    // Extract the shopId and style from the request body
    const { shopId, style }: { shopId: string; style: string } = await req.json();

    if (!shopId || !style) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch shop details from the database, filtering by active state and ordering by position
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        menus: {
          where: {
            state: 'ACTIVE', // Only active menus
          },
          orderBy: {
            position: 'asc', // Order by position of the menus
          },
          include: {
            categories: {
              where: {
                state: 'ACTIVE', // Only active categories
              },
              orderBy: {
                position: 'asc', // Order by position of the categories within each menu
              },
              include: {
                dishes: {
                  where: {
                    state: 'ACTIVE', // Only active dishes
                  },
                  orderBy: {
                    position: 'asc', // Order by position of dishes within each category
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Prepare the data to pass to the generateMenu function
    const menuData = {
      name: shop.name,
      address: shop.address,
      phone: shop.phone,
      coverPhoto : shop.coverPhoto,
      categories: shop.menus.flatMap((menu) => {
        return menu.categories.map((category) => ({
          name: category.name,
          dishes: category.dishes.map((dish) => ({
            name: dish.name,
            price: `$${dish.price.toFixed(2)}`, // Ensure price is formatted as a string
            description: dish.description || '',
          })),
        }));
      }),
    };

    // Generate the PDF with the specified style
    const pdfBytes = await generateMenu(menuData, style);

    // Return the generated PDF as a response
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="menu.pdf"',
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
