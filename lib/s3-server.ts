/**
 * S3 helpers — **server-only** module (uses secret credentials).
 *
 * Env vars (server-only, NOT NEXT_PUBLIC):
 *   S3_ACCESS_KEY_ID      — IAM access key
 *   S3_SECRET_ACCESS_KEY  — IAM secret key
 *
 * Env vars (shared with client):
 *   NEXT_PUBLIC_S3_BUCKET_NAME
 *   NEXT_PUBLIC_S3_REGION       (defaults to eu-central-1)
 *
 * Legacy compat: if the new S3_* vars are not set, falls back to the old
 * NEXT_PUBLIC_S3_* names so existing .env files work without changes until
 * the owner migrates.
 */

import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// ---------------------------------------------------------------------------
// Credentials (server-only, with legacy fallback)
// ---------------------------------------------------------------------------

function getAccessKeyId(): string {
  return (
    process.env.S3_ACCESS_KEY_ID ||
    process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID ||
    ''
  );
}

function getSecretAccessKey(): string {
  return (
    process.env.S3_SECRET_ACCESS_KEY ||
    process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY ||
    ''
  );
}

function getRegion(): string {
  return process.env.NEXT_PUBLIC_S3_REGION || 'eu-central-1';
}

function getBucket(): string {
  return process.env.NEXT_PUBLIC_S3_BUCKET_NAME || '';
}

// ---------------------------------------------------------------------------
// Shared S3 client (singleton, lazy)
// ---------------------------------------------------------------------------

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: getRegion(),
      credentials: {
        accessKeyId: getAccessKeyId(),
        secretAccessKey: getSecretAccessKey(),
      },
    });
  }
  return _client;
}

// ---------------------------------------------------------------------------
// Presigned PUT URL (used by /api/upload/presign)
// ---------------------------------------------------------------------------

/**
 * Generate a presigned PUT URL for the given S3 key and content type.
 * The URL is valid for 5 minutes.
 */
export async function createPresignedPutUrl(
  fileKey: string,
  contentType: string,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: fileKey,
    ContentType: contentType,
  });
  return getSignedUrl(getClient(), command, { expiresIn: 300 });
}

// ---------------------------------------------------------------------------
// Download (server-side, used by PDF/PNG export)
// ---------------------------------------------------------------------------

async function streamToUint8Array(
  stream: ReadableStream,
): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let done = false;
  while (!done) {
    const { value, done: d } = await reader.read();
    if (value) chunks.push(value);
    done = d;
  }
  return new Uint8Array(Buffer.concat(chunks));
}

export default async function downloadFromS3(
  file_key: string,
): Promise<Uint8Array> {
  const urlParts = file_key.split('/');
  const fileName = urlParts[urlParts.length - 1];

  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: 'uploads/' + fileName,
  });

  const { Body } = await getClient().send(command);

  if (!Body || !(Body instanceof ReadableStream)) {
    throw new Error('Invalid or missing Body in S3 getObject response.');
  }

  return streamToUint8Array(Body);
}
