import admin from 'firebase-admin';
import { env } from './env.js';
if (!admin.apps.length) {
    const opts = {};
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // Rely on ADC
    }
    else if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
        opts.credential = admin.credential.cert({
            projectId: env.FIREBASE_PROJECT_ID,
            clientEmail: env.FIREBASE_CLIENT_EMAIL,
            privateKey: env.FIREBASE_PRIVATE_KEY,
        });
    }
    else {
        console.warn('Firebase credentials not fully configured.');
    }
    if (env.FIREBASE_STORAGE_BUCKET) {
        opts.storageBucket = env.FIREBASE_STORAGE_BUCKET;
    }
    admin.initializeApp(opts);
}
export const firebaseAdmin = admin;
export const firestore = admin.firestore();
export const storage = admin.storage();
export const auth = admin.auth();
