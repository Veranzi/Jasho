### Jashoo Python FastAPI Backend

Run locally:

```bash
uvicorn app.main:app --reload --port 3000
```

It matches the Flutter ApiService endpoints under `/api/*` and returns the expected response shapes. Configure Firebase by setting `GOOGLE_APPLICATION_CREDENTIALS` and `FIREBASE_STORAGE_BUCKET` or editing `.env` to align with `app/config.py` settings.
