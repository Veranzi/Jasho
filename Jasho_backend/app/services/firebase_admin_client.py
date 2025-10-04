import os
import json
import firebase_admin
from firebase_admin import credentials, auth, storage


def init_firebase_if_needed():
    if firebase_admin._apps:
        return
    project_id = os.getenv("FIREBASE_PROJECT_ID")
    client_email = os.getenv("FIREBASE_CLIENT_EMAIL")
    private_key = os.getenv("FIREBASE_PRIVATE_KEY")
    bucket_name = os.getenv("FIREBASE_STORAGE_BUCKET")

    if client_email and private_key:
        cred = credentials.Certificate({
            "type": "service_account",
            "project_id": project_id,
            "client_email": client_email,
            "private_key": private_key.replace("\\n", "\n"),
            "token_uri": "https://oauth2.googleapis.com/token",
        })
    else:
        # Fallback to GOOGLE_APPLICATION_CREDENTIALS
        cred = credentials.ApplicationDefault()

    firebase_admin.initialize_app(cred, {
        "storageBucket": bucket_name
    })


def create_firebase_custom_token(uid: str) -> str:
    init_firebase_if_needed()
    return auth.create_custom_token(uid).decode("utf-8")


def get_bucket():
    init_firebase_if_needed()
    return storage.bucket()
