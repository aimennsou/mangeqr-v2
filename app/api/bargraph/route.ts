import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma'; // Assuming Prisma is set up

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shopId, startDate, endDate } = body;

    if (!shopId || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields: shopId, startDate, or endDate' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Query scandata and group by date
    const scansPerDay = await prisma.scandata.groupBy({
      by: ['createdAt'],
      _count: {
        id: true,
      },
      where: {
        shopId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Transform the data into the chartData format
    const chartData = scansPerDay.reduce<{ date: string; shop1: number }[]>((acc, day) => {
      const date = day.createdAt.toISOString().split('T')[0]; // Extract the date part from createdAt
    
      // Check if the date is already in the accumulator
      const existingEntry = acc.find(entry => entry.date === date);
      
      if (existingEntry) {
        // If date exists, increment the scan count
        existingEntry.shop1 += day._count.id;
      } else {
        // If not, create a new entry
        acc.push({
          date,
          shop1: day._count.id,
        });
      }
    
      return acc;
    }, []); // Initialize as an empty array with the correct type
    

    return NextResponse.json(chartData);
  } catch (error) {
    console.error('Error fetching bar graph data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
