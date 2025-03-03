import QRCode from 'qrcode';

export async function generateQrCodePng(qrUrl: string): Promise<Buffer> {
  try {
    // Generate QR code as a PNG Buffer
    const qrPngBuffer = await QRCode.toBuffer(qrUrl, {
      width: 500, // Set desired width
      type: 'png', // Specify PNG format
    });

    return qrPngBuffer;
  } catch (error) {
    console.error('Error generating QR code PNG:', error);
    throw new Error('Failed to generate QR code PNG');
  }
}
