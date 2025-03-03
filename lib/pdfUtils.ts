// src/lib/pdfUtils.ts

import { PDFDocument, rgb } from 'pdf-lib';
import QRCode from 'qrcode';

interface Shop {
  qrUrl: string;
}

export async function generatePdf(shop: Shop): Promise<Uint8Array> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();

  // Generate QR code image
  const qrCodeImageUrl = await QRCode.toDataURL(shop.qrUrl);
  const qrCodeImageBytes = Uint8Array.from(atob(qrCodeImageUrl.split(',')[1]), c => c.charCodeAt(0));
  const qrCodeImage = await pdfDoc.embedPng(qrCodeImageBytes);

  // Add a page to the document
  const page = pdfDoc.addPage([600, 800]);

  // Define dimensions
  const qrCodeSize = 150; // Size of the QR code
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();

  // Define line properties
  const lineWidth = 1;
  const lineColor = rgb(0, 0, 0);

  // Draw vertical and horizontal lines to split the page
  page.drawLine({
    start: { x: pageWidth / 2, y: 0 },
    end: { x: pageWidth / 2, y: pageHeight },
    thickness: lineWidth,
    color: lineColor,
  });

  page.drawLine({
    start: { x: 0, y: pageHeight / 2 },
    end: { x: pageWidth, y: pageHeight / 2 },
    thickness: lineWidth,
    color: lineColor,
  });

  // Draw QR code in each section
  for (let i = 0; i < 4; i++) {
    const xOffset = (i % 2) * (pageWidth / 2);
    const yOffset = Math.floor(i / 2) * (pageHeight / 2);

    // Center the QR code in the section
    page.drawImage(qrCodeImage, {
      x: xOffset + (pageWidth / 2 - qrCodeSize) / 2,
      y: yOffset + (pageHeight / 2 - qrCodeSize) / 2,
      width: qrCodeSize,
      height: qrCodeSize,
    });
  }

  // Serialize the PDF document to bytes
  return pdfDoc.save();
}




