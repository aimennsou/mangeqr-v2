// src/app/api/download-pdf/route.ts

import { generatePdf } from '@/lib/pdfUtils';
import {NextRequest , NextResponse } from 'next/server';

interface Shop {

  qrUrl: string;

}


export async function POST(req: NextRequest) {
  try {
    const { qrUrl }: Shop = await req.json();

    if ( !qrUrl ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const shop: Shop = {qrUrl };
    const pdfBytes = await generatePdf(shop);

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="shop-details.pdf"',
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
