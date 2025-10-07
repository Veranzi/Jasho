const admin = require('firebase-admin');
const fs = require('fs');
require('dotenv').config();

let initialized = false;

try {
  // Prefer explicit service account JSON if provided
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || undefined,
      projectId: serviceAccount.project_id,
    });
    initialized = true;
  } else {
    // Fallback to application default credentials
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || undefined,
    });
    initialized = true;
  }
} catch (e) {
  // Do not crash the app in non-Firebase environments
  // eslint-disable-next-line no-console
  console.warn('Firebase Admin initialization warning:', e && e.message ? e.message : e);
}

module.exports = {
  admin,
  initialized,
  db: initialized ? admin.firestore() : null,
  auth: initialized ? admin.auth() : null,
  bucket: initialized && process.env.FIREBASE_STORAGE_BUCKET ? admin.storage().bucket() : null,
};
