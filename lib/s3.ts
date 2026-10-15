/**
 * S3 helpers — **client-safe** module (no secrets).
 *
 * • `uploadToS3(file)` — uploads via a server-issued presigned PUT URL.
 *   The AWS credentials never leave the server.
 * • `getS3Url(file_key)` — builds the public object URL from bucket + region.
 *
 * Env vars used (all NEXT_PUBLIC, safe for the browser bundle):
 *   NEXT_PUBLIC_S3_BUCKET_NAME  — e.g. "mangeqr-uploads"
 *   NEXT_PUBLIC_S3_REGION       — e.g. "eu-central-1" (defaults to eu-central-1)
 */

// ---------------------------------------------------------------------------
// Region + bucket (public, needed client-side for URL building)
// ---------------------------------------------------------------------------

export function getS3Region(): string {
  return (process.env.NEXT_PUBLIC_S3_REGION || 'eu-central-1');
}

export function getS3Bucket(): string {
  return process.env.NEXT_PUBLIC_S3_BUCKET_NAME || '';
}

// ---------------------------------------------------------------------------
// Public object URL
// ---------------------------------------------------------------------------

export function getS3Url(file_key: string): string {
  const bucket = getS3Bucket();
  if (!bucket || !file_key) return '';
  return `https://${bucket}.s3.${getS3Region()}.amazonaws.com/${file_key}`;
}

// ---------------------------------------------------------------------------
// Client-side upload via presigned URL
// ---------------------------------------------------------------------------

/**
 * Upload a file to S3 via a presigned PUT URL obtained from the server.
 *
 * Flow:
 *  1. POST /api/upload/presign  →  { url, file_key }
 *  2. PUT  <presigned-url>  with raw file bytes  →  S3
 *
 * The AWS secret key never reaches the browser.
 */
export async function uploadToS3(
  file: File,
): Promise<{ file_key: string; file_name: string }> {
  // 1. Ask our server for a presigned PUT URL.
  const presignRes = await fetch('/api/upload/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
    }),
  });

  if (!presignRes.ok) {
    const body = await presignRes.json().catch(() => ({}));
    throw new Error(body.error || 'Échec de la demande de téléversement.');
  }

  const { url, file_key } = (await presignRes.json()) as {
    url: string;
    file_key: string;
  };

  // 2. PUT the file directly to S3 using the presigned URL.
  const uploadRes = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error('Échec du téléversement vers S3.');
  }

  return { file_key, file_name: file.name };
}
