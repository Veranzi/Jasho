import { config as dotenvConfig } from 'dotenv';
dotenvConfig(); // load .env (project root)

import admin from 'firebase-admin';

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.warn('GOOGLE_APPLICATION_CREDENTIALS not set — Firebase Admin may not authenticate locally.');
}

try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    // only pass storageBucket if configured
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || undefined,
  });
} catch (e) {
  // ignore "already initialized" in dev/hot-reload
  // console.warn('firebase init skipped', e);
}

export const db = admin.firestore();
export const auth = admin.auth();
// only create bucket handle when configured
export const bucket = process.env.FIREBASE_STORAGE_BUCKET ? admin.storage().bucket() : null;
export default admin;