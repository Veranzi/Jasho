import { storage as fbStorage } from '../config/firebase.js';
import { env } from '../config/env.js';
import { GetSignedUrlConfig } from '@google-cloud/storage';

export async function generateSignedUrl(objectName: string, expiresInSeconds: number, disposition?: string) {
  const bucketName = env.GCS_BUCKET || fbStorage.bucket().name;
  const bucket = fbStorage.bucket(bucketName);
  const file = bucket.file(objectName);
  const config: GetSignedUrlConfig = {
    action: 'read',
    expires: Date.now() + expiresInSeconds * 1000,
    responseDisposition: disposition,
  } as any;
  const [url] = await file.getSignedUrl(config);
  return url;
}
