import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'eu-central-1',
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY!,
  },
});

// Function to convert a ReadableStream to a Uint8Array
async function streamToUint8Array(stream: ReadableStream): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let done: boolean | undefined = false;

  while (!done) {
    const { value, done: doneReading } = await reader.read();
    if (value) {
      chunks.push(value);
    }
    done = doneReading;
  }

  return new Uint8Array(Buffer.concat(chunks));
}

async function downloadFromS3(file_key: string): Promise<Uint8Array> {
  try {
    const urlParts = file_key.split('/');
    const fileName = urlParts[urlParts.length - 1];

    const params = {
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
      Key: 'uploads/' + fileName,
    };

    const command = new GetObjectCommand(params);
    const { Body } = await s3Client.send(command);

    if (!Body || !(Body instanceof ReadableStream)) {
      throw new Error('Invalid or missing Body in S3 getObject response.');
    }

    return streamToUint8Array(Body);
  } catch (error) {
    console.error('Error downloading file from S3:', error);
    throw error;
  }
}

export default downloadFromS3;
