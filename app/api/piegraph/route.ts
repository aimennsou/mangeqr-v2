import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma'; // Assuming Prisma is set up

// Weekday numbers (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
const WEEKDAYS = [1, 2, 3, 4, 5]; // Monday to Friday

// Function to calculate total, weekday, and weekend scans
const getScanCounts = async (shopId: string, startDate: Date, endDate: Date) => {
  try {
    const scans = await prisma.scandata.findMany({
      where: {
        shopId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    let weekdayScans = 0;
    let weekendScans = 0;

    scans.forEach((scan) => {
      const scanDate = new Date(scan.createdAt);
      const dayOfWeek = scanDate.getDay(); // Get the day of the week (0 = Sunday, 6 = Saturday)
      
    
      
      if (WEEKDAYS.includes(dayOfWeek)) {
        weekdayScans += 1; // It's a weekday
      } else {
        weekendScans += 1; // It's a weekend (Saturday or Sunday)
      }
    });
    const chartData = [
        { day: 'Weekend', visits: weekendScans, fill: 'var(--color-Weekend)' },
        { day: 'Weekday', visits: weekdayScans, fill: 'var(--color-Weekday)' },
      ];
  console.log(chartData)
      return chartData;
  } catch (error) {
    console.error('Error fetching scan counts:', error);
    return null; // Ensure this is handled properly in the handler
  }
};

// Updated API route handler for the POST request
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shopId, startDate, endDate } = body;

    // Validate input data
    if (!shopId || !startDate || !endDate) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Fetch the scan counts (total, weekday, weekend)
    const result = await getScanCounts(shopId, new Date(startDate), new Date(endDate));

    // If data was fetched successfully, return it; otherwise, send a 500 error
    if (result) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  } catch (error) {
    // Handle parsing errors or internal server errors
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
