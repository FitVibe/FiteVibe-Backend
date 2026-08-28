import { Client } from 'minio';
import 'dotenv/config';

const endPoint = process.env.MINIO_ENDPOINT || 'localhost';
const port = parseInt(process.env.MINIO_PORT || '9000', 10);
const useSSL = process.env.MINIO_USE_SSL === 'true';
const accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin';
export const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'fitvibe-media';

export const minioClient = new Client({
    endPoint,
    port,
    useSSL,
    accessKey,
    secretKey,
});

/**
 * Initializes MinIO bucket and sets public read access policy.
 */
export async function initMinioBucket(): Promise<void> {
    try {
        const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
        if (!bucketExists) {
            await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
            console.log(`[MinIO] Bucket "${BUCKET_NAME}" created.`);

            // Set public read policy for media files
            const publicReadPolicy = {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: { AWS: ['*'] },
                        Action: ['s3:GetObject'],
                        Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
                    },
                ],
            };
            await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(publicReadPolicy));
            console.log(`[MinIO] Set public read policy on bucket "${BUCKET_NAME}".`);
        } else {
            console.log(`[MinIO] Bucket "${BUCKET_NAME}" already exists.`);
        }
    } catch (err) {
        console.error('[MinIO] Failed to initialize bucket:', err);
    }
}

/**
 * Uploads a file buffer or stream to MinIO.
 */
export async function uploadFile(
    objectName: string,
    buffer: Buffer,
    contentType: string = 'application/octet-stream'
): Promise<string> {
    await minioClient.putObject(BUCKET_NAME, objectName, buffer, buffer.length, {
        'Content-Type': contentType,
    });
    return getObjectUrl(objectName);
}

/**
 * Helper to get accessible HTTP URL for an object.
 */
export function getObjectUrl(objectName: string): string {
    const protocol = useSSL ? 'https' : 'http';
    return `${protocol}://${endPoint}:${port}/${BUCKET_NAME}/${objectName}`;
}
