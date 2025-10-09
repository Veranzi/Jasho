import admin from "firebase-admin";

export function initFirebaseAdmin() {
  if (admin.apps.length > 0) return admin.app();
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  let creds: admin.ServiceAccount | undefined;
  if (json) {
    creds = JSON.parse(json);
  } else if (b64) {
    creds = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
  } else {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_B64");
  }
  return admin.initializeApp({
    credential: admin.credential.cert(creds as admin.ServiceAccount),
  });
}

export const db = () => admin.firestore();
export const auth = () => admin.auth();
