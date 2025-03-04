// src/app/api/download-qr-jpeg/route.ts

import { generateQrCodePng } from '@/lib/pngUtils';  // Assuming you have a utility function to generate a QR code in JPEG format
import { NextRequest , NextResponse } from 'next/server';

interface Shop {

  qrUrl: string;

}

// POST /api/download-qr-jpeg
export async function POST(req: NextRequest) {
  try {
    const {  qrUrl}: Shop = await req.json();

    if ( !qrUrl ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const shop: Shop = {  qrUrl };
    console.log("shoppppppp",shop)
    
    // Generate QR code as a JPEG
    const qrCodeJpegBytes = await generateQrCodePng(shop.qrUrl);

    return new Response(qrCodeJpegBytes, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': 'attachment; filename="qr-code.jpeg"',
      },
    });
  } catch (error) {
    console.error('Error generating QR code JPEG:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
