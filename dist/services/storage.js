import { storage as fbStorage } from '../config/firebase.js';
import { env } from '../config/env.js';
export async function generateSignedUrl(objectName, expiresInSeconds, disposition) {
    const bucketName = env.GCS_BUCKET || fbStorage.bucket().name;
    const bucket = fbStorage.bucket(bucketName);
    const file = bucket.file(objectName);
    const config = {
        action: 'read',
        expires: Date.now() + expiresInSeconds * 1000,
        responseDisposition: disposition,
    };
    const [url] = await file.getSignedUrl(config);
    return url;
}
