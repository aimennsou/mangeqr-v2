import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma'; // Assuming Prisma is set up

const DAY_START_HOUR = 4;
const NIGHT_START_HOUR = 18;

// Function to calculate day and night scans for each weekday
const getDayNightScans = async (shopId: string, startDate: Date, endDate: Date) => {
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
  
      const dayNightData: Record<string, { jour: number; nuit: number }> = {
        Monday: { jour: 0, nuit: 0 },
        Tuesday: { jour: 0, nuit: 0 },
        Wednesday: { jour: 0, nuit: 0 },
        Thursday: { jour: 0, nuit: 0 },
        Friday: { jour: 0, nuit: 0 },
        Saturday: { jour: 0, nuit: 0 },
        Sunday: { jour: 0, nuit: 0 },
      };
  
      scans.forEach((scan) => {
        const scanDate = new Date(scan.createdAt);
        const dayOfWeek = scanDate.toLocaleDateString('en-US', { weekday: 'long' });
        const hour = scanDate.getHours();
  
        // Determine if the scan is during the day or night
        if (hour >= DAY_START_HOUR && hour < NIGHT_START_HOUR) {
          dayNightData[dayOfWeek].jour += 1;
        } else {
          dayNightData[dayOfWeek].nuit += 1;
        }
      });
  
      // Define French day names
      const frenchDayNames: Record<string, string> = {
        Monday: 'Lundi',
        Tuesday: 'Mardi',
        Wednesday: 'Mercredi',
        Thursday: 'Jeudi',
        Friday: 'Vendredi',
        Saturday: 'Samedi',
        Sunday: 'Dimanche',
      };
  
      // Transform the dayNightData into the desired format
      const chartData = Object.entries(dayNightData).map(([key, value]) => ({
        day: frenchDayNames[key], // Use the French day name
        nuit: value.nuit,
        jour: value.jour,
      }));
  
      return chartData; // Return the formatted data
    } catch (error) {
      console.error('Error fetching day/night scans:', error);
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

    // Fetch the day/night scan data
    const result = await getDayNightScans(shopId, new Date(startDate), new Date(endDate));

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
