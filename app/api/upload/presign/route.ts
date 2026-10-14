import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import { currentUserId } from '@/lib/authentication';
import { createPresignedPutUrl } from '@/lib/s3-server';

// Only image types we accept for cover/dish photos.
const ALLOWED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

// Map a content type to a safe file extension (never trust the client name).
const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Issue a short-lived presigned PUT URL so the browser can upload a photo
 * directly to S3 without ever seeing the AWS credentials.
 *
 * Auth-gated (owners/members only). The returned `file_key` is the value the
 * caller then stores on the restaurant/dish record; the public display URL is
 * derived from it later via getS3Url().
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await currentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fail fast with a clear message if S3 isn't configured yet.
    if (!process.env.NEXT_PUBLIC_S3_BUCKET_NAME) {
      return NextResponse.json(
        { error: "Le stockage d'images n'est pas configuré." },
        { status: 503 },
      );
    }

    const { contentType } = (await req.json()) as {
      fileName?: string;
      contentType?: string;
    };

    if (!contentType || !ALLOWED_CONTENT_TYPES.has(contentType)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé (JPEG, PNG ou WebP).' },
        { status: 400 },
      );
    }

    // Server-generated key: no user-controlled path segments, safe extension.
    const ext = EXT_BY_TYPE[contentType];
    const file_key = `uploads/${Date.now()}-${uuidv4()}.${ext}`;

    const url = await createPresignedPutUrl(file_key, contentType);

    return NextResponse.json({ url, file_key }, { status: 200 });
  } catch (error) {
    console.error('Error creating presigned upload URL:', error);
    return NextResponse.json(
      { error: 'Impossible de préparer le téléversement.' },
      { status: 500 },
    );
  }
}
